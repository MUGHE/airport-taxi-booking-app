import { expect, test } from "@playwright/test"
import { parsePlaceImportCsv, placeImportSlug, validatePlaceImportRows, type PlaceImportReference } from "@/lib/place-csv-import"

const references: PlaceImportReference = {
  groups: [{ id: "group-london", name: "London and nearby places" }],
  parents: [{ id: "parent-london", name: "London" }],
  airports: [
    { id: "lhr", slug: "heathrow-airport-taxi", name: "Heathrow", published: true, bookingAvailable: true },
    { id: "old", slug: "old-airport-taxi", name: "Old Airport", published: false, bookingAvailable: true },
  ],
  existingPlaces: [{ id: "camden", name: "Camden", officialName: "London Borough of Camden", slug: "camden", aliases: ["Camden Town"], localities: ["Kentish Town"] }],
}

test("Place CSV parsing preserves source rows and normalizes semicolon lists", () => {
  const parsed = parsePlaceImportCsv(`name,place_type,place_group,parent_place,aliases,covered_localities,supported_airport_slugs\n  King's Cross  ,Neighbourhood, London and nearby places, London,King's Cross; Kings Cross;  St Pancras,  Somers Town ; Somers Town,HEATHROW-AIRPORT-TAXI`)
  expect(parsed.errors).toEqual([])
  expect(parsed.rows[0]).toMatchObject({ rowNumber: 2, values: { name: "King's Cross", place_type: "Neighbourhood" } })
  const preview = validatePlaceImportRows(parsed.rows, references)
  expect(preview[0]).toMatchObject({ placeType: "neighbourhood", placeGroupId: "group-london", parentPlaceId: "parent-london", aliases: ["King's Cross", "Kings Cross", "St Pancras"], coveredLocalities: ["Somers Town"], supportedAirportSlugs: ["heathrow-airport-taxi"] })
  expect(placeImportSlug("King's Cross")).toBe("kings-cross")
})

test("Place CSV validation reports existing identities, unpublished airports, and duplicate rows", () => {
  const parsed = parsePlaceImportCsv(`name,place_type,place_group,parent_place,aliases,covered_localities,supported_airport_slugs\nCamden,town,London and nearby places,,Camden Town,,heathrow-airport-taxi\nCamden,town,London and nearby places,,, ,old-airport-taxi`)
  const preview = validatePlaceImportRows(parsed.rows, references)
  expect(preview[0].existingMatch).toBe("Camden")
  expect(preview[0].blockers.join(" ")).toMatch(/already uses/)
  expect(preview[1].blockers.join(" ")).toMatch(/not Published/)
  expect(preview[1].blockers.join(" ")).toMatch(/duplicated by CSV row 2/)
})

test("malformed Place CSV headers are reported without database work", () => {
  const parsed = parsePlaceImportCsv("name,wrong\nCamden,town")
  expect(parsed.errors[0]).toMatch(/Headers must be exactly/)
  expect(validatePlaceImportRows(parsed.rows, references, parsed.errors)[0].blockers).toContain(parsed.errors[0])
})
