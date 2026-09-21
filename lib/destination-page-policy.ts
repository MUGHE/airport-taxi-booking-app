import type { DestinationSectionType } from "@/lib/destination-content"

export const DESTINATION_PAGE_TYPES = ["airport", "place"] as const
export type DestinationPageType = (typeof DESTINATION_PAGE_TYPES)[number]

type DestinationPagePolicy = {
  label: string
  defaults: { seoTitle: (displayName: string) => string; metaDescription: (displayName: string) => string; h1: (displayName: string) => string }
  identity: { editableFields: readonly string[]; requiredFields: readonly string[] }
  slug: { label: string; isValid: (slug: string) => boolean }
  content: { requiredSectionTypes: readonly DestinationSectionType[]; localFaqField: string }
  publishReadiness: "airport" | "place"
  relationships: "related-destinations" | "supported-airports"
  public: { namespace: "/airport-transfers" | "/destinations"; renderer: "airport" | "place"; structuredData: "airport" | "place"; cacheNamespace: "airport-pages" | "place-pages" }
  archiveFallback: "airport-transfers" | "destinations"
}

const AIRPORT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*-airport-taxi$/
const PLACE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const airport: DestinationPagePolicy = {
  label: "Airport Page",
  defaults: { seoTitle: (name) => `${name} Airport Taxi & Transfers`, metaDescription: (name) => `Fixed-price taxi transfers to and from ${name} Airport.`, h1: (name) => `${name} Airport Taxi & Transfers` },
  identity: { editableFields: ["officialName", "displayName", "iataCode", "serviceArea", "googlePlaceId", "address", "latitude", "longitude", "terminal"], requiredFields: ["officialName", "displayName", "iataCode", "serviceArea", "googlePlaceId", "address", "latitude", "longitude", "terminal"] },
  slug: { label: "Airport Slug", isValid: (slug) => AIRPORT_SLUG.test(slug) },
  content: { requiredSectionTypes: ["introduction", "benefits", "fleet_pricing", "airport_guide", "faq", "map"], localFaqField: "airportFaqs" },
  publishReadiness: "airport", relationships: "related-destinations",
  public: { namespace: "/airport-transfers", renderer: "airport", structuredData: "airport", cacheNamespace: "airport-pages" }, archiveFallback: "airport-transfers",
}

const place: DestinationPagePolicy = {
  label: "Place Page",
  defaults: { seoTitle: (name) => `${name} Airport Taxi | Fixed-Price Transfers`, metaDescription: (name) => `Fixed-price taxi transfers between ${name} and supported airports.`, h1: (name) => `${name} Airport Taxi` },
  identity: { editableFields: ["officialName", "displayName", "placeType", "placeGroup", "parentPlace", "googlePlaceId", "address", "latitude", "longitude"], requiredFields: ["officialName", "displayName", "placeType", "placeGroup", "googlePlaceId", "address", "latitude", "longitude"] },
  slug: { label: "Place Slug", isValid: (slug) => PLACE_SLUG.test(slug) && !slug.endsWith("-airport-taxi") },
  content: { requiredSectionTypes: ["introduction", "airport_routes", "place_coverage", "travel_information", "faq"], localFaqField: "placeFaqs" },
  publishReadiness: "place", relationships: "supported-airports",
  public: { namespace: "/destinations", renderer: "place", structuredData: "place", cacheNamespace: "place-pages" }, archiveFallback: "destinations",
}

const policies: Record<DestinationPageType, DestinationPagePolicy> = { airport, place }

export function isDestinationPageType(value: unknown): value is DestinationPageType {
  return typeof value === "string" && (DESTINATION_PAGE_TYPES as readonly string[]).includes(value)
}

export function getDestinationPagePolicy(type: DestinationPageType): DestinationPagePolicy {
  return policies[type]
}
