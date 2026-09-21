/**
 * The one boundary for rules that differ between Destination Page types.
 * Shared lifecycle code should ask this policy for type-specific choices instead
 * of growing page-type conditionals in saves, public reads, and admin screens.
 */
export const destinationPageTypes = ["airport", "place"] as const

export type DestinationPageType = (typeof destinationPageTypes)[number]
export type DestinationPageIdentityField = "officialName" | "displayName" | "iataCode" | "serviceArea" | "googlePlaceId" | "address" | "latitude" | "longitude"

export type DestinationPagePolicy = {
  type: DestinationPageType
  label: string
  defaults: { slugSuffix: string }
  identityFields: readonly DestinationPageIdentityField[]
  slug: { description: string; isValid: (slug: string) => boolean }
  content: { document: "airport" | "place"; requiredSections: readonly string[] }
  publishReadiness: "airport" | "place"
  relationships: { targetPageTypes: readonly DestinationPageType[] }
  public: {
    namespace: string
    renderer: "airport" | "place"
    structuredData: "airport" | "place"
    cacheNamespace: "airport" | "place"
    archiveFallback: "airport-transfers" | "destinations"
  }
}

const airportSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*-airport-taxi$/
const placeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const policies: Record<DestinationPageType, DestinationPagePolicy> = {
  airport: {
    type: "airport",
    label: "Airport Page",
    defaults: { slugSuffix: "-airport-taxi" },
    identityFields: ["officialName", "displayName", "iataCode", "serviceArea", "googlePlaceId", "address", "latitude", "longitude"],
    slug: { description: "a lowercase Airport Slug ending in -airport-taxi", isValid: (slug) => airportSlug.test(slug) },
    content: { document: "airport", requiredSections: ["introduction", "benefits", "fleet_pricing", "airport_guide", "map"] },
    publishReadiness: "airport",
    relationships: { targetPageTypes: ["airport"] },
    public: { namespace: "/airport-transfers", renderer: "airport", structuredData: "airport", cacheNamespace: "airport", archiveFallback: "airport-transfers" },
  },
  place: {
    type: "place",
    label: "Place Page",
    defaults: { slugSuffix: "" },
    identityFields: ["officialName", "displayName", "googlePlaceId", "address", "latitude", "longitude"],
    slug: { description: "a short lowercase Place Slug using hyphens between words", isValid: (slug) => placeSlug.test(slug) && !slug.endsWith("-airport-taxi") },
    content: { document: "place", requiredSections: ["introduction", "supported_airports", "local_travel", "map"] },
    publishReadiness: "place",
    relationships: { targetPageTypes: ["airport"] },
    public: { namespace: "/destinations", renderer: "place", structuredData: "place", cacheNamespace: "place", archiveFallback: "destinations" },
  },
}

export function isDestinationPageType(value: unknown): value is DestinationPageType {
  return typeof value === "string" && destinationPageTypes.includes(value as DestinationPageType)
}

export function getDestinationPagePolicy(type: DestinationPageType): DestinationPagePolicy {
  return policies[type]
}

export const airportPagePolicy = getDestinationPagePolicy("airport")
