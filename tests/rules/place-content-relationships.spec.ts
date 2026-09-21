import { expect, test } from "@playwright/test"
import { createDefaultDestinationContent, normalizeDestinationContent } from "@/lib/destination-content"
import { geographicDistanceKm, orderNearbyPlaceCandidates, validatePlaceRelationships } from "@/lib/place-page-rules"

test("Place content keeps required sections, local FAQs, and private Source Notes", () => {
  const content = createDefaultDestinationContent("Camden Airport Taxi", "place")
  expect(content.sections.map((section) => section.type)).toEqual([
    "introduction", "airport_routes", "place_coverage", "travel_information", "faq",
  ])
  expect(content.sections.every((section) => section.required && section.visible)).toBe(true)

  const normalized = normalizeDestinationContent({
    ...content,
    placeFaqs: [{ id: "local-1", question: "Where can I be collected?", answer: "Any safe legal pickup point." }],
    sections: content.sections.map((section, index) => index === 2 ? {
      ...section,
      sourceNotes: [{ sourceName: "Camden Council", sourceUrl: "https://www.camden.gov.uk/pickup", checkedDate: "2026-09-01" }],
    } : section),
  }, "Camden Airport Taxi", "place")

  expect(normalized.placeFaqs).toHaveLength(1)
  expect(normalized.sections[2].sourceNotes).toEqual([{ sourceName: "Camden Council", sourceUrl: "https://www.camden.gov.uk/pickup", checkedDate: "2026-09-01" }])
})

test("Supported Airports require published airport endpoints and preserve unavailable choices", () => {
  expect(validatePlaceRelationships({
    supportedAirports: [
      { pageId: "lhr", pageType: "airport", lifecycleState: "published", bookingAvailable: true },
      { pageId: "lgw", pageType: "airport", lifecycleState: "published", bookingAvailable: false },
    ],
    nearbyPlaces: [],
    validNearbyCandidateCount: 0,
  })).toEqual([])

  expect(validatePlaceRelationships({
    supportedAirports: [{ pageId: "old", pageType: "airport", lifecycleState: "archived", bookingAvailable: true }],
    nearbyPlaces: [],
    validNearbyCandidateCount: 0,
  })).toContain("Supported Airports must be Published Airport Pages.")
})

test("Nearby Places prefer the same Primary Parent, then distance", () => {
  expect(geographicDistanceKm(51.5, -0.1, 51.5, 0.9)).toBeCloseTo(69, 0)
  const ordered = orderNearbyPlaceCandidates("parent-a", [
    { id: "far-sibling", primaryParentId: "parent-a", distanceKm: 18 },
    { id: "near-other", primaryParentId: "parent-b", distanceKm: 2 },
    { id: "near-sibling", primaryParentId: "parent-a", distanceKm: 4 },
  ])
  expect(ordered.map((item) => item.id)).toEqual(["near-sibling", "far-sibling", "near-other"])
})

test("Nearby Place selection requires three to six unless fewer candidates exist", () => {
  expect(validatePlaceRelationships({ supportedAirports: [], nearbyPlaces: [], validNearbyCandidateCount: 8 })).toContain("Select between three and six Nearby Places.")
  expect(validatePlaceRelationships({ supportedAirports: [], nearbyPlaces: ["a", "b"], validNearbyCandidateCount: 8 })).toContain("Select between three and six Nearby Places.")
  expect(validatePlaceRelationships({ supportedAirports: [], nearbyPlaces: ["a", "b"], validNearbyCandidateCount: 2 })).not.toContain("Select between three and six Nearby Places.")
  expect(validatePlaceRelationships({ supportedAirports: [], nearbyPlaces: ["a", "b", "c", "d", "e", "f", "g"], validNearbyCandidateCount: 9 })).toContain("Select between three and six Nearby Places.")
})
