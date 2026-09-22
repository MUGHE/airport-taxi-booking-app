import { createDefaultDestinationContent } from "@/lib/destination-content"
import { normalizePlaceIdentity } from "@/lib/place-identity"
import { getDestinationPagePolicy } from "@/lib/destination-page-policy"

export const PLACE_IMPORT_HEADERS = [
  "name",
  "place_type",
  "place_group",
  "parent_place",
  "aliases",
  "covered_localities",
  "supported_airport_slugs",
] as const

const PLACE_TYPES = new Set(["city", "town", "london_borough", "neighbourhood", "village"])

export type PlaceImportHeader = (typeof PLACE_IMPORT_HEADERS)[number]
export type PlaceImportRawRow = { rowNumber: number; values: Record<PlaceImportHeader, string> }
export type PlaceImportReference = {
  groups: { id: string; name: string }[]
  parents: { id: string; name: string }[]
  airports: { id: string; slug: string; name: string; published: boolean; bookingAvailable: boolean }[]
  existingPlaces: { id: string; name: string; officialName: string; slug: string; aliases: string[]; localities: string[] }[]
}
export type PlaceImportPreviewRow = {
  rowNumber: number
  name: string
  placeType: string
  placeGroup: string
  placeGroupId: string
  parentPlace: string
  parentPlaceId: string
  aliases: string[]
  coveredLocalities: string[]
  supportedAirportSlugs: string[]
  slug: string
  warnings: string[]
  blockers: string[]
  existingMatch?: string
}

export function normalizeImportText(value: string): string {
  return String(value ?? "").normalize("NFKC").trim().replace(/[\u0000-\u001f]+/g, " ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ")
}

export function normalizeImportKey(value: string): string {
  return normalizePlaceIdentity(normalizeImportText(value).replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " "))
}

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>()
  return values.flatMap((value) => {
    const normalized = normalizeImportText(value)
    const key = normalizeImportKey(normalized)
    if (!normalized || seen.has(key)) return []
    seen.add(key)
    return [normalized]
  })
}

export function normalizeImportList(value: string): string[] {
  return uniqueValues(value.split(";"))
}

export function normalizePlaceType(value: string): string {
  return normalizeImportText(value).toLocaleLowerCase("en-GB").replace(/[\s-]+/g, "_")
}

export function placeImportSlug(name: string): string {
  return normalizeImportKey(normalizeImportText(name).replace(/[’']/g, "")).replace(/\s+/g, "-")
}

function normalizeHeader(value: string): string {
  return normalizeImportText(value).toLocaleLowerCase("en-GB").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

export function parseCsv(value: string): { headers: string[]; rows: string[][]; error?: string } {
  const input = value.replace(/^\uFEFF/, "")
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { cell += '"'; index += 1 }
      else if (character === '"') quoted = false
      else cell += character
    } else if (character === '"' && cell.length === 0) quoted = true
    else if (character === ",") { row.push(cell); cell = "" }
    else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1
      row.push(cell); cell = ""
      if (row.some((item) => item.trim())) rows.push(row)
      row = []
    } else cell += character
  }
  if (quoted) return { headers: [], rows: [], error: "The CSV has an unfinished quoted value." }
  if (cell.length || row.length) { row.push(cell); if (row.some((item) => item.trim())) rows.push(row) }
  if (!rows.length) return { headers: [], rows: [], error: "Add a header row and at least one Place row." }
  return { headers: rows[0].map(normalizeHeader), rows: rows.slice(1) }
}

export function parsePlaceImportCsv(value: string): { rows: PlaceImportRawRow[]; errors: string[] } {
  const parsed = parseCsv(value)
  if (parsed.error) return { rows: [], errors: [parsed.error] }
  const expected = [...PLACE_IMPORT_HEADERS]
  const errors: string[] = []
  if (parsed.headers.length !== expected.length || parsed.headers.some((header, index) => header !== expected[index])) {
    errors.push(`Headers must be exactly: ${expected.join(", ")}.`)
  }
  const rows = parsed.rows.map((cells, index) => {
    const values = Object.fromEntries(expected.map((header, cellIndex) => [header, normalizeImportText(cells[cellIndex] ?? "")])) as Record<PlaceImportHeader, string>
    if (cells.length !== expected.length) errors.push(`Row ${index + 2} has ${cells.length} columns; expected ${expected.length}.`)
    return { rowNumber: index + 2, values }
  })
  return { rows, errors }
}

function identityTerms(row: Pick<PlaceImportPreviewRow, "name" | "aliases" | "coveredLocalities">): string[] {
  return [row.name, ...row.aliases, ...row.coveredLocalities].map(normalizeImportKey).filter(Boolean)
}

export function validatePlaceImportRows(rawRows: PlaceImportRawRow[], references: PlaceImportReference, headerErrors: string[] = []): PlaceImportPreviewRow[] {
  const groupByKey = new Map(references.groups.map((item) => [normalizeImportKey(item.name), item]))
  const parentByKey = new Map(references.parents.map((item) => [normalizeImportKey(item.name), item]))
  const airportBySlug = new Map(references.airports.map((item) => [item.slug.toLocaleLowerCase("en-GB"), item]))
  const existingTerms = references.existingPlaces.flatMap((place) => [place.name, place.officialName, ...place.aliases, ...place.localities].map((term) => [normalizeImportKey(term), place] as const))
  const rows = rawRows.map((raw) => {
    const name = normalizeImportText(raw.values.name)
    const placeType = normalizePlaceType(raw.values.place_type)
    const placeGroup = normalizeImportText(raw.values.place_group)
    const parentPlace = normalizeImportText(raw.values.parent_place)
    const aliases = normalizeImportList(raw.values.aliases)
    const coveredLocalities = normalizeImportList(raw.values.covered_localities)
    const supportedAirportSlugs = uniqueValues(raw.values.supported_airport_slugs.split(";").map((item) => item.toLocaleLowerCase("en-GB")))
    const group = groupByKey.get(normalizeImportKey(placeGroup))
    const parent = parentByKey.get(normalizeImportKey(parentPlace))
    const slug = placeImportSlug(name)
    const blockers = [...headerErrors]
    const warnings: string[] = []
    if (!name) blockers.push("Add a Place name.")
    if (!PLACE_TYPES.has(placeType)) blockers.push(`“${placeType || "(empty)"}” is not a valid Place type.`)
    if (!group) blockers.push(`Place Group “${placeGroup || "(empty)"}” was not found.`)
    if (parentPlace && !parent) blockers.push(`Parent Place “${parentPlace}” was not found.`)
    if (!slug || !getDestinationPagePolicy("place").slug.isValid(slug)) blockers.push("A valid Place Slug could not be generated.")
    if (!supportedAirportSlugs.length) blockers.push("Add at least one Supported Airport Slug.")
    for (const airportSlug of supportedAirportSlugs) {
      const airport = airportBySlug.get(airportSlug)
      if (!airport) blockers.push(`Airport Slug “${airportSlug}” was not found.`)
      else if (!airport.published) blockers.push(`Airport “${airportSlug}” is not Published.`)
      else if (!airport.bookingAvailable) warnings.push(`Airport “${airportSlug}” is Published but booking is temporarily unavailable.`)
    }
    const existing = identityTerms({ name, aliases, coveredLocalities }).map((term) => existingTerms.find(([key]) => key === term)?.[1]).find(Boolean)
    if (existing) { blockers.push("An active Place already uses this name, alias, or Covered Locality."); return { rowNumber: raw.rowNumber, name, placeType, placeGroup, placeGroupId: group?.id ?? "", parentPlace, parentPlaceId: parent?.id ?? "", aliases, coveredLocalities, supportedAirportSlugs, slug, warnings, blockers, existingMatch: existing.name } }
    const ownTerms = identityTerms({ name, aliases, coveredLocalities })
    if (new Set(ownTerms).size !== ownTerms.length) blockers.push("This row repeats a name, alias, or Covered Locality.")
    return { rowNumber: raw.rowNumber, name, placeType, placeGroup, placeGroupId: group?.id ?? "", parentPlace, parentPlaceId: parent?.id ?? "", aliases, coveredLocalities, supportedAirportSlugs, slug, warnings, blockers }
  })
  const seenNames = new Map<string, number>()
  const seenSlugs = new Map<string, number>()
  const seenIdentityTerms = new Map<string, number>()
  const rowByNumber = new Map(rows.map((row) => [row.rowNumber, row]))
  for (const row of rows) {
    const nameKey = normalizeImportKey(row.name)
    const priorName = seenNames.get(nameKey)
    if (priorName) row.blockers.push(`This name is duplicated by CSV row ${priorName}.`)
    else if (nameKey) seenNames.set(nameKey, row.rowNumber)
    const priorSlug = seenSlugs.get(row.slug)
    if (priorSlug) row.blockers.push(`This generated slug is duplicated by CSV row ${priorSlug}.`)
    else if (row.slug) seenSlugs.set(row.slug, row.rowNumber)
    for (const term of identityTerms(row)) {
      const priorTerm = seenIdentityTerms.get(term)
      if (priorTerm && priorTerm !== row.rowNumber) {
        row.blockers.push(`This name, alias, or Covered Locality conflicts with CSV row ${priorTerm}.`)
        rowByNumber.get(priorTerm)?.blockers.push(`This name, alias, or Covered Locality conflicts with CSV row ${row.rowNumber}.`)
      }
      else seenIdentityTerms.set(term, row.rowNumber)
    }
  }
  return rows
}

export function defaultPlaceImportContent(name: string) {
  const heading = getDestinationPagePolicy("place").defaults.h1(name)
  return createDefaultDestinationContent(heading, "place")
}

export function placeImportTemplate(): string {
  return `${PLACE_IMPORT_HEADERS.join(",")}\n`
}
