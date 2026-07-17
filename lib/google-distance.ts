interface LatLng {
  lat: number
  lng: number
}

export async function calculateDrivingMiles(
  origin: LatLng,
  destination: LatLng,
): Promise<number | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) throw new Error("GOOGLE_MAPS_SERVER_API_KEY is missing.")

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters",
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
  const distanceMeters = data?.routes?.[0]?.distanceMeters
  return typeof distanceMeters === "number" ? distanceMeters / 1609.344 : null
}
