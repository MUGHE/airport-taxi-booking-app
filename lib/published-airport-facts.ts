export type PublishedAirportFacts = {
  officialName: string
  displayName: string
  iataCode: string
  serviceArea: string
  address: string
  latitude: number
  longitude: number
  googlePlaceId: string
}

export function readPublishedAirportFacts(content: unknown): PublishedAirportFacts | null {
  if (!content || typeof content !== "object") return null
  const facts = (content as Record<string, unknown>).publishedFacts
  if (!facts || typeof facts !== "object") return null
  const value = facts as Record<string, unknown>
  if (
    typeof value.officialName !== "string"
    || typeof value.displayName !== "string"
    || typeof value.iataCode !== "string"
    || typeof value.serviceArea !== "string"
    || typeof value.address !== "string"
    || typeof value.latitude !== "number"
    || typeof value.longitude !== "number"
    || typeof value.googlePlaceId !== "string"
  ) return null
  return value as PublishedAirportFacts
}
