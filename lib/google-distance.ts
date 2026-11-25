import { unstable_cache } from "next/cache"

interface LatLng {
  lat: number
  lng: number
}

export interface DrivingRoute {
  /** Rounded to 0.1 mile here, once, so every price built from it (quote, booking, Stripe) agrees. */
  distanceMiles: number
  durationMinutes: number
}

type RawRoute = { distanceMeters: number; durationSeconds: number }

const METERS_PER_MILE = 1609.344

/** One Google Routes API call, in the order given. Null when Google finds no drivable route. */
async function fetchRoute(origin: LatLng, destination: LatLng, waypoints: LatLng[]): Promise<RawRoute | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) throw new Error("GOOGLE_MAPS_SERVER_API_KEY is missing.")

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      // Intermediate stops, visited in order — the route (and its distance/duration, so its
      // fare) accounts for the full journey through them, not just origin -> destination.
      intermediates: waypoints.map((point) => ({ location: { latLng: { latitude: point.lat, longitude: point.lng } } })),
      travelMode: "DRIVE",
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    const detail = await res.json().catch(() => null) as { error?: { message?: string } } | null
    const message = detail?.error?.message
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Google Routes API rejected the server key. Enable the Routes API and allow this server key to use it.",
      )
    }
    // A 400/404 can genuinely mean there is no drivable route. Preserve that
    // distinction for callers instead of presenting every API error as one.
    if (res.status === 400 || res.status === 404) return null
    throw new Error(message || `Google Routes API request failed (${res.status}).`)
  }

  const data = await res.json()
  const route = data?.routes?.[0]
  const distanceMeters = route?.distanceMeters
  const durationSeconds = typeof route?.duration === "string" ? Number.parseFloat(route.duration) : NaN
  if (typeof distanceMeters !== "number" || !Number.isFinite(durationSeconds)) return null
  return { distanceMeters, durationSeconds }
}

function toDrivingRoute(distanceMeters: number, durationSeconds: number): DrivingRoute {
  return {
    distanceMiles: Math.round((distanceMeters / METERS_PER_MILE) * 10) / 10,
    durationMinutes: Math.ceil(durationSeconds / 60),
  }
}

/**
 * The direction-independent route between two points: the average of A -> B and B -> A.
 * One-way roads and junctions make the two directions differ by a few miles; averaging them
 * means a trip and its reverse always get the same distance, time and so the same fare.
 *
 * Always called with the pair in canonical order (see calculateDrivingRoute), and cached on that
 * pair for a day, so the quote the customer sees and the fare charged at booking come from the
 * very same numbers rather than two Google calls minutes apart.
 */
const canonicalPairRoute = unstable_cache(
  async (first: LatLng, second: LatLng): Promise<DrivingRoute | null> => {
    const [forward, reverse] = await Promise.all([fetchRoute(first, second, []), fetchRoute(second, first, [])])
    const legs = [forward, reverse].filter((leg): leg is RawRoute => leg != null)
    // Both directions failing means there's no drivable route. If only one way works (rare),
    // that direction stands for both, which is still the same answer whichever way is asked.
    if (legs.length === 0) return null
    const distanceMeters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0) / legs.length
    const durationSeconds = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0) / legs.length
    return toDrivingRoute(distanceMeters, durationSeconds)
  },
  ["driving-route-pair-v1"],
  { revalidate: 60 * 60 * 24 },
)

const comparePoints = (a: LatLng, b: LatLng) => a.lat - b.lat || a.lng - b.lng

export async function calculateDrivingRoute(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[] = [],
): Promise<DrivingRoute | null> {
  // A trip with stops is priced as driven, in the customer's order: reversing it is a
  // different journey, not the same one backwards.
  if (waypoints.length > 0) {
    const route = await fetchRoute(origin, destination, waypoints)
    return route ? toDrivingRoute(route.distanceMeters, route.durationSeconds) : null
  }
  // Point to point: put the pair in a fixed order first, so A -> B and B -> A hit the same
  // calculation (and the same cache entry) and get identical numbers.
  const [first, second] = comparePoints(origin, destination) <= 0 ? [origin, destination] : [destination, origin]
  return canonicalPairRoute({ lat: first.lat, lng: first.lng }, { lat: second.lat, lng: second.lng })
}
