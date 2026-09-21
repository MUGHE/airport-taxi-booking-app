import { expect, test } from "@playwright/test"
import { getDestinationPagePolicy, isDestinationPageType } from "@/lib/destination-page-policy"
import { createDefaultDestinationContent } from "@/lib/destination-content"

test("Destination Page policies keep Airport Page rules and reserve Place Page rules", () => {
  const airport = getDestinationPagePolicy("airport")
  const place = getDestinationPagePolicy("place")

  expect(isDestinationPageType("city_town")).toBe(false)
  expect(airport.slug.isValid("heathrow-airport-taxi")).toBe(true)
  expect(airport.slug.isValid("heathrow")).toBe(false)
  expect(airport.identity.requiredFields).toEqual(expect.arrayContaining(["iataCode", "terminal"]))
  expect(airport.defaults.h1("Heathrow")).toBe("Heathrow Airport Taxi & Transfers")
  expect(airport.content.requiredSectionTypes).toContain("airport_guide")
  expect(airport.publishReadiness).toBe("airport")
  expect(airport.relationships).toBe("related-destinations")
  expect(airport.public.namespace).toBe("/airport-transfers")
  expect(airport.public.renderer).toBe("airport")
  expect(airport.public.structuredData).toBe("airport")
  expect(airport.public.cacheNamespace).toBe("airport-pages")
  expect(airport.archiveFallback).toBe("airport-transfers")

  expect(place.slug.isValid("city-of-london")).toBe(true)
  expect(place.slug.isValid("city-of-london-airport-taxi")).toBe(false)
  expect(place.identity.requiredFields).not.toContain("iataCode")
  expect(place.defaults.h1("Camden")).toBe("Camden Airport Taxi")
  expect(place.defaults.metaDescription("Camden", ["Heathrow Airport", "Gatwick Airport"])).toBe("Fixed-price taxi transfers between Camden and Heathrow Airport, Gatwick Airport.")
  expect(place.content.requiredSectionTypes).toEqual(expect.arrayContaining(["airport_routes", "place_coverage", "travel_information"]))
  expect(place.publishReadiness).toBe("place")
  expect(place.relationships).toBe("supported-airports")
  expect(place.public.namespace).toBe("/destinations")
  expect(place.public.renderer).toBe("place")
  expect(place.public.structuredData).toBe("place")
  expect(place.public.cacheNamespace).toBe("place-pages")
  expect(place.archiveFallback).toBe("destinations")

  const placeContent = createDefaultDestinationContent("Camden Airport Taxi", "place")
  expect(placeContent.schemaVersion).toBe(3)
  expect(placeContent.sections.map((section) => section.type)).toEqual(place.content.requiredSectionTypes)
  expect(placeContent.sections.map((section) => section.type)).not.toContain("airport_guide")
})
