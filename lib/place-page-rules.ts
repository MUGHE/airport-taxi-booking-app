export type PlaceRelationshipEndpoint = {
  pageId: string
  pageType: "airport" | "place"
  lifecycleState: "draft" | "published" | "archived"
  bookingAvailable: boolean
}

export type NearbyPlaceCandidateForOrdering = {
  id: string
  primaryParentId: string
  distanceKm: number | null
}

export function geographicDistanceKm(fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(toLatitude - fromLatitude)
  const longitudeDelta = radians(toLongitude - fromLongitude)
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(fromLatitude)) * Math.cos(radians(toLatitude)) * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export function orderNearbyPlaceCandidates<T extends NearbyPlaceCandidateForOrdering>(primaryParentId: string, candidates: T[]): T[] {
  return [...candidates].sort((left, right) => {
    const leftSameParent = Boolean(primaryParentId) && left.primaryParentId === primaryParentId
    const rightSameParent = Boolean(primaryParentId) && right.primaryParentId === primaryParentId
    if (leftSameParent !== rightSameParent) return leftSameParent ? -1 : 1
    return (left.distanceKm ?? Number.POSITIVE_INFINITY) - (right.distanceKm ?? Number.POSITIVE_INFINITY)
  })
}

export function validatePlaceRelationships(input: {
  supportedAirports: PlaceRelationshipEndpoint[]
  nearbyPlaces: string[]
  validNearbyCandidateCount: number
}): string[] {
  const errors: string[] = []
  if (input.supportedAirports.some((airport) => airport.pageType !== "airport" || airport.lifecycleState !== "published")) {
    errors.push("Supported Airports must be Published Airport Pages.")
  }
  if (input.nearbyPlaces.length > 6) errors.push("Select no more than six Nearby Places.")
  if (new Set(input.nearbyPlaces).size !== input.nearbyPlaces.length) errors.push("Each Nearby Place can be selected only once.")
  return errors
}
