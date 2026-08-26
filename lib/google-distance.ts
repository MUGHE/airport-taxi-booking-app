interface LatLng {
  lat: number
  lng: number
}

export interface DrivingRoute {
  distanceMiles: number
  durationMinutes: number
}

export async function calculateDrivingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<DrivingRoute | null> {
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
      travelMode: "DRIVE",
    }),
    cache: "no-store",
  })

  if (!res.ok) return null

  const data = await res.json()
  const route = data?.routes?.[0]
  const distanceMeters = route?.distanceMeters
  const durationSeconds = typeof route?.duration === "string" ? Number.parseFloat(route.duration) : NaN
  if (typeof distanceMeters !== "number" || !Number.isFinite(durationSeconds)) return null

  return {
    distanceMiles: distanceMeters / 1609.344,
    durationMinutes: Math.ceil(durationSeconds / 60),
  }
}
