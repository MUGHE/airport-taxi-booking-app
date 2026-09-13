export type AirportMapLocation = {
  placeId?: string
  address: string
  latitude: number
  longitude: number
}

export function createGoogleMapsUrl(location: AirportMapLocation): string {
  const params = new URLSearchParams({ api: "1", query: `${location.latitude},${location.longitude}` })
  if (location.placeId) params.set("query_place_id", location.placeId)
  return `https://www.google.com/maps/search/?${params.toString()}`
}

export function createGoogleMapsEmbedUrl(location: AirportMapLocation, apiKey: string): string {
  const query = location.placeId ? `place_id:${location.placeId}` : `${location.latitude},${location.longitude}`
  return `https://www.google.com/maps/embed/v1/place?${new URLSearchParams({ key: apiKey, q: query })}`
}
