import { expect, test } from "@playwright/test"
import { normalizePlaceDirectoryTerm, placeDirectorySearchText, type PlaceDirectoryEntry } from "@/lib/place-directory"

const place: PlaceDirectoryEntry = {
  id: "camden-id",
  displayName: "Camden",
  officialName: "London Borough of Camden",
  placeType: "borough",
  placeGroup: "London and nearby places",
  parentPlace: null,
  slug: "camden",
  featured: true,
  aliases: ["Camden Town"],
  coveredLocalities: ["Kentish Town", "Hampstead"],
}

test("destination directory search includes official names, aliases, and Covered Localities", () => {
  const searchText = placeDirectorySearchText(place)
  expect(searchText).toContain("london borough of camden")
  expect(searchText).toContain("camden town")
  expect(searchText).toContain("kentish town")
})

test("destination directory search normalizes surrounding whitespace and case", () => {
  expect(normalizePlaceDirectoryTerm("  Kentish   Town ")).toBe("kentish town")
})
