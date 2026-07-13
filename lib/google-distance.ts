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
  
    const params = new URLSearchParams({
      origins: `${origin.lat},${origin.lng}`,
      destinations: `${destination.lat},${destination.lng}`,
      units: "imperial",
      key: apiKey,
    })
  
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`,
      { cache: "no-store" },
    )
    if (!res.ok) return null
  
    const data = await res.json()
    const element = data?.rows?.[0]?.elements?.[0]
    if (!element || element.status !== "OK") return null
  
    return element.distance.value / 1609.34 // meters -> miles
  }