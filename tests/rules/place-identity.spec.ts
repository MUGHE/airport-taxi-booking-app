import { expect, test } from "@playwright/test"
import { findPlaceIdentityConflict, normalizePlaceIdentity, wouldCreateParentCycle } from "@/lib/place-identity"
import { createDestinationPageEditorSchema } from "@/lib/destination-page-form-schema"

test("Place identity support terms are normalized case-insensitively", () => {
  expect(normalizePlaceIdentity("  King's   Cross  ")).toBe("king's cross")
  expect(findPlaceIdentityConflict({
    names: ["Camden"],
    aliases: ["Camden Town"],
    coveredLocalities: ["King's Cross"],
  })).toBeNull()
  expect(findPlaceIdentityConflict({
    names: ["Camden"],
    aliases: [" camden "],
    coveredLocalities: [],
  })).toBe("camden")
})

test("Primary Parent relationships reject direct and indirect cycles", () => {
  const parents = new Map([
    ["camden", "london"],
    ["london", "england"],
  ])
  expect(wouldCreateParentCycle("england", "camden", parents)).toBe(true)
  expect(wouldCreateParentCycle("camden", "camden", parents)).toBe(true)
  expect(wouldCreateParentCycle("camden", "westminster", parents)).toBe(false)
})

test("Place Draft validation accepts a short Place Slug without airport identity", () => {
  const values = {
    officialName: "London Borough of Camden",
    displayName: "Camden",
    iataCode: "",
    serviceArea: "",
    slug: "camden",
    googlePlaceId: "",
    address: "",
    latitude: 0,
    longitude: 0,
  }
  const result = createDestinationPageEditorSchema("place").safeParse(values)
  expect(result.success).toBe(true)
  expect(createDestinationPageEditorSchema("place").safeParse({ ...values, slug: "camden-airport-taxi" }).success).toBe(false)
})
