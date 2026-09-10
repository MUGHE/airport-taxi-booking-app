import { expect, test } from "@playwright/test"
import { destinationPageEditorSchema } from "@/lib/destination-page-form-schema"

test("editor schema reports errors against the fields that need attention", () => {
  const result = destinationPageEditorSchema.safeParse({
    officialName: "",
    displayName: "",
    iataCode: "XX",
    serviceArea: "",
    slug: "Manchester Airport",
    googlePlaceId: "",
    address: "",
    latitude: 0,
    longitude: 0,
  })

  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining([
    "iataCode", "slug",
  ]))
})

test("editor schema allows a partial Draft while Publish owns completeness checks", () => {
  const result = destinationPageEditorSchema.safeParse({
    officialName: "Glasgow Airport",
    displayName: "Glasgow Airport Taxi",
    iataCode: "GLA",
    serviceArea: "London and surrounding area",
    slug: "",
    googlePlaceId: "",
    address: "",
    latitude: 0,
    longitude: 0,
  })
  expect(result.success).toBe(true)
})
