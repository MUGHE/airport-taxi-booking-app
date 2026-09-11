import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { createGoogleMapsEmbedUrl, createGoogleMapsUrl } from "@/lib/google-maps-links"

const location = {
  placeId: "ChIJ2f3hy2hb2EcROw-4AqftcYY",
  address: "London Southend Airport, Eastwoodbury Crescent, Southend-on-Sea SS2 6YF, UK",
  latitude: 51.5701932,
  longitude: 0.6924774,
}

test("uses the saved Google place for map and fallback links", () => {
  expect(createGoogleMapsUrl(location)).toContain("query_place_id=ChIJ2f3hy2hb2EcROw-4AqftcYY")
  expect(createGoogleMapsEmbedUrl(location, "test-key")).toContain("q=place_id%3AChIJ2f3hy2hb2EcROw-4AqftcYY")
})

test("the Airport Page map section renders the map preview", async () => {
  const renderer = await readFile("components/airport-page/airport-page-renderer.tsx", "utf8")
  expect(renderer).toContain("<AirportMapPreview location={page.mapLocation}")
  expect(renderer).not.toContain("Showing the saved airport location at")
})
