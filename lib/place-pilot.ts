import { PLACE_IMPORT_HEADERS, type PlaceImportHeader } from "@/lib/place-csv-import"

export const DEFAULT_PLACE_PILOT_NAMES = [
  "Westminster",
  "City of London",
  "Camden",
  "Kensington and Chelsea",
  "Hammersmith and Fulham",
  "Ealing",
  "Hillingdon",
  "Tower Hamlets",
  "Greenwich",
  "Croydon",
] as const

export const PILOT_AIRPORT_SLUGS = [
  "heathrow-airport-taxi",
  "gatwick-airport-taxi",
  "stansted-airport-taxi",
  "luton-airport-taxi",
  "london-city-airport-taxi",
  "southend-airport-taxi",
] as const

export type PlacePilotDemand = {
  name: string
  pickupBookings: number
  dropoffBookings: number
}

export type PlacePilotDemandReport = {
  reliable: boolean
  rows: readonly PlacePilotDemand[]
}

export type PlacePilotCandidate = {
  name: string
  placeType: "city" | "london_borough"
  placeGroup: "London and nearby places"
  parentPlace: ""
  aliases: string[]
  coveredLocalities: string[]
  supportedAirportSlugs: string[]
}

const DEFAULT_PILOT_DETAILS: Record<string, Pick<PlacePilotCandidate, "placeType" | "aliases" | "coveredLocalities">> = {
  Westminster: { placeType: "london_borough", aliases: ["City of Westminster"], coveredLocalities: ["Mayfair", "Soho", "Pimlico"] },
  "City of London": { placeType: "city", aliases: ["The City", "Square Mile"], coveredLocalities: ["Barbican", "Farringdon"] },
  Camden: { placeType: "london_borough", aliases: ["Camden Town"], coveredLocalities: ["Kentish Town", "Hampstead", "King's Cross"] },
  "Kensington and Chelsea": { placeType: "london_borough", aliases: ["Royal Borough of Kensington and Chelsea"], coveredLocalities: ["Notting Hill", "Chelsea", "South Kensington"] },
  "Hammersmith and Fulham": { placeType: "london_borough", aliases: ["Hammersmith & Fulham"], coveredLocalities: ["Hammersmith", "Fulham", "Shepherd's Bush"] },
  Ealing: { placeType: "london_borough", aliases: ["London Borough of Ealing"], coveredLocalities: ["Acton", "Hanwell", "Southall"] },
  Hillingdon: { placeType: "london_borough", aliases: ["London Borough of Hillingdon"], coveredLocalities: ["Hayes", "Uxbridge", "Ruislip"] },
  "Tower Hamlets": { placeType: "london_borough", aliases: ["London Borough of Tower Hamlets"], coveredLocalities: ["Canary Wharf", "Whitechapel", "Bethnal Green"] },
  Greenwich: { placeType: "london_borough", aliases: ["Royal Borough of Greenwich"], coveredLocalities: ["Greenwich Peninsula", "Woolwich", "Charlton"] },
  Croydon: { placeType: "london_borough", aliases: ["London Borough of Croydon"], coveredLocalities: ["Thornton Heath", "Purley", "Crystal Palace"] },
}

function candidateFor(name: string): PlacePilotCandidate {
  const details = DEFAULT_PILOT_DETAILS[name]
  if (!details) throw new Error(`Unknown default Place pilot candidate: ${name}`)
  return {
    name,
    ...details,
    placeGroup: "London and nearby places",
    parentPlace: "",
    supportedAirportSlugs: [...PILOT_AIRPORT_SLUGS],
  }
}

export const DEFAULT_PLACE_PILOT: readonly PlacePilotCandidate[] = DEFAULT_PLACE_PILOT_NAMES.map(candidateFor)

function normalizedName(value: string): string {
  return value.trim().toLocaleLowerCase("en-GB").replace(/\s+/g, " ")
}

/**
 * Pick ten approved Places from reliable aggregate demand. The demand query
 * must already exclude personal booking fields. If it is missing, incomplete,
 * or does not contain ten approved candidates, use the documented fallback.
 */
export function selectPlacePilot(report?: PlacePilotDemandReport): readonly PlacePilotCandidate[] {
  if (!report?.reliable || !report.rows.length) return DEFAULT_PLACE_PILOT
  const demand = report.rows
  const approvedByName = new Map(DEFAULT_PLACE_PILOT.map((place) => [normalizedName(place.name), place]))
  const defaultOrder = new Map(DEFAULT_PLACE_PILOT_NAMES.map((name, index) => [normalizedName(name), index]))
  const totals = new Map<string, number>()
  for (const item of demand) {
    if (!Number.isFinite(item.pickupBookings) || !Number.isFinite(item.dropoffBookings) || item.pickupBookings < 0 || item.dropoffBookings < 0) continue
    const key = normalizedName(item.name)
    if (!approvedByName.has(key)) continue
    totals.set(key, (totals.get(key) ?? 0) + item.pickupBookings + item.dropoffBookings)
  }
  const ranked = [...totals.entries()]
    .map(([key, total]) => ({ place: approvedByName.get(key), total }))
    .filter((item): item is { place: PlacePilotCandidate; total: number } => Boolean(item.place))
    .sort((left, right) => right.total - left.total || (defaultOrder.get(normalizedName(left.place.name)) ?? 99) - (defaultOrder.get(normalizedName(right.place.name)) ?? 99))
  if (new Set(ranked.map((item) => item.place.name)).size < DEFAULT_PLACE_PILOT.length) return DEFAULT_PLACE_PILOT
  return ranked.slice(0, DEFAULT_PLACE_PILOT.length).map((item) => item.place)
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

export function placePilotCsv(places: readonly PlacePilotCandidate[] = DEFAULT_PLACE_PILOT): string {
  const rows = places.map((place) => [
    place.name,
    place.placeType,
    place.placeGroup,
    place.parentPlace,
    place.aliases.join("; "),
    place.coveredLocalities.join("; "),
    place.supportedAirportSlugs.join("; "),
  ].map(csvCell).join(","))
  return [PLACE_IMPORT_HEADERS.join(","), ...rows, ""].join("\n")
}

export const PILOT_VERIFICATION_AREAS = [
  "responsive-layout",
  "keyboard-focus",
  "exact-address-booking-both-directions",
  "airport-availability",
  "directory-search-aliases-localities",
  "breadcrumbs-redirects-canonical",
  "sitemap-structured-data",
  "safe-fallback",
  "privacy-safe-analytics",
  "airport-regression",
] as const

export type PilotEvidence = {
  placeSlug: string
  device: "mobile" | "tablet" | "desktop"
  area: (typeof PILOT_VERIFICATION_AREAS)[number]
  result: "pass" | "fail" | "not-run"
  note?: string
}

export function validatePilotEvidence(evidence: readonly PilotEvidence[]): string[] {
  const failures: string[] = []
  for (const place of DEFAULT_PLACE_PILOT) {
    const slug = place.name.toLocaleLowerCase("en-GB").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    for (const device of ["mobile", "tablet", "desktop"] as const) {
      if (!evidence.some((item) => item.placeSlug === slug && item.device === device && item.result === "pass")) failures.push(`${slug}: missing passing ${device} evidence`)
    }
    for (const area of PILOT_VERIFICATION_AREAS) {
      if (!evidence.some((item) => item.placeSlug === slug && item.area === area && item.result === "pass")) failures.push(`${slug}: missing passing ${area} evidence`)
    }
  }
  const failed = evidence.filter((item) => item.result === "fail")
  if (failed.length) failures.push(...failed.map((item) => `${item.placeSlug}: ${item.area} failed`))
  return failures
}
