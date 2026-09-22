import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { DEFAULT_PLACE_PILOT, DEFAULT_PLACE_PILOT_NAMES, PILOT_AIRPORT_SLUGS, placePilotCsv, selectPlacePilot, validatePilotEvidence } from "@/lib/place-pilot"
import { parsePlaceImportCsv } from "@/lib/place-csv-import"

test("the fallback Place pilot is the documented ten approved service areas", () => {
  expect(DEFAULT_PLACE_PILOT.map((place) => place.name)).toEqual([...DEFAULT_PLACE_PILOT_NAMES])
  expect(DEFAULT_PLACE_PILOT).toHaveLength(10)
  expect(new Set(DEFAULT_PLACE_PILOT.flatMap((place) => place.supportedAirportSlugs))).toEqual(new Set(PILOT_AIRPORT_SLUGS))
})

test("reliable aggregate demand can rank only approved pilot candidates", () => {
  const selected = selectPlacePilot({ reliable: true, rows: DEFAULT_PLACE_PILOT_NAMES.map((name, index) => ({ name, pickupBookings: index + 1, dropoffBookings: 0 })).reverse() })
  expect(selected[0].name).toBe("Croydon")
  expect(selected).toHaveLength(10)
  expect(selectPlacePilot({ reliable: false, rows: DEFAULT_PLACE_PILOT_NAMES.map((name) => ({ name, pickupBookings: 999, dropoffBookings: 999 })) })).toEqual(DEFAULT_PLACE_PILOT)
  expect(selectPlacePilot({ reliable: true, rows: [{ name: "Not an approved place", pickupBookings: 999, dropoffBookings: 999 }] })).toEqual(DEFAULT_PLACE_PILOT)
})

test("the controlled pilot CSV is the normalized importer contract", () => {
  const csv = readFileSync(resolve(process.cwd(), "data/place-pilot.csv"), "utf8")
  expect(csv).toBe(placePilotCsv())
  const parsed = parsePlaceImportCsv(csv)
  expect(parsed.errors).toEqual([])
  expect(parsed.rows).toHaveLength(10)
  expect(parsed.rows.map((row) => row.values.name)).toEqual([...DEFAULT_PLACE_PILOT_NAMES])
  expect(parsed.rows.every((row) => row.values.supported_airport_slugs.split(";").length === 6)).toBeTruthy()
})

test("pilot evidence requires all three device classes and records failures", () => {
  const evidence = DEFAULT_PLACE_PILOT.flatMap((place) => {
    const slug = place.name.toLocaleLowerCase("en-GB").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    return [
      ...(["mobile", "tablet", "desktop"] as const).map((device) => ({ placeSlug: slug, device, area: "responsive-layout" as const, result: "pass" as const })),
      ...[...new Set(["keyboard-focus", "exact-address-booking-both-directions", "airport-availability", "directory-search-aliases-localities", "breadcrumbs-redirects-canonical", "sitemap-structured-data", "safe-fallback", "privacy-safe-analytics", "airport-regression"] as const)].map((area) => ({ placeSlug: slug, device: "desktop" as const, area, result: "pass" as const })),
    ]
  })
  expect(validatePilotEvidence(evidence)).toEqual([])
  expect(validatePilotEvidence(evidence.slice(1))).toContain("westminster: missing passing mobile evidence")
})
