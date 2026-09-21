import { expect, test } from "@playwright/test"
import { destinationPageTypes, getDestinationPagePolicy, isDestinationPageType } from "@/lib/destination-page-policy"

test("Destination Pages accept airport and place types, but reject the retired city_town type", () => {
  expect(destinationPageTypes).toEqual(["airport", "place"])
  expect(isDestinationPageType("airport")).toBe(true)
  expect(isDestinationPageType("place")).toBe(true)
  expect(isDestinationPageType("city_town")).toBe(false)
})

test("the page-type policy owns the type-specific extension points", () => {
  const airport = getDestinationPagePolicy("airport")
  const place = getDestinationPagePolicy("place")

  expect(airport.defaults.slugSuffix).toBe("-airport-taxi")
  expect(airport.slug.isValid("glasgow-airport-taxi")).toBe(true)
  expect(airport.slug.isValid("glasgow")).toBe(false)
  expect(airport.identityFields).toContain("iataCode")
  expect(airport.public).toEqual({ namespace: "/airport-transfers", renderer: "airport", structuredData: "airport", cacheNamespace: "airport", archiveFallback: "airport-transfers" })

  expect(place.defaults.slugSuffix).toBe("")
  expect(place.slug.isValid("city-of-london")).toBe(true)
  expect(place.slug.isValid("city-of-london-airport-taxi")).toBe(false)
  expect(place.identityFields).not.toContain("iataCode")
  expect(place.public).toEqual({ namespace: "/destinations", renderer: "place", structuredData: "place", cacheNamespace: "place", archiveFallback: "destinations" })
})
