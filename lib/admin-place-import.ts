import { createClient } from "@supabase/supabase-js"
import { getDestinationPagePolicy } from "@/lib/destination-page-policy"
import { defaultPlaceImportContent, parsePlaceImportCsv, validatePlaceImportRows, type PlaceImportReference } from "@/lib/place-csv-import"
import { saveAdminDestinationPage } from "@/lib/admin-destination-pages"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null
}

export async function getPlaceImportReferences(): Promise<PlaceImportReference> {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Destination Pages are not connected to the database.")
  const [{ data: groups, error: groupsError }, { data: parents, error: parentsError }, { data: airports, error: airportsError }, { data: pages, error: pagesError }] = await Promise.all([
    supabase.from("destination_place_groups").select("id, name").eq("active", true).order("display_order").order("name"),
    supabase.from("destination_pages").select("id, display_name").eq("page_type", "place").neq("lifecycle_state", "archived").order("display_name"),
    supabase.from("destination_pages").select("id, slug, display_name, lifecycle_state, booking_available").eq("page_type", "airport"),
    supabase.from("destination_pages").select("id, display_name, official_name, slug, lifecycle_state").eq("page_type", "place").neq("lifecycle_state", "archived"),
  ])
  if (groupsError || parentsError || airportsError || pagesError) throw groupsError ?? parentsError ?? airportsError ?? pagesError
  const pageIds = (pages ?? []).map((page) => page.id as string)
  const [{ data: aliases, error: aliasesError }, { data: localities, error: localitiesError }] = pageIds.length ? await Promise.all([
    supabase.from("destination_place_aliases").select("page_id, name").in("page_id", pageIds),
    supabase.from("destination_covered_localities").select("page_id, name").in("page_id", pageIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }]
  if (aliasesError || localitiesError) throw aliasesError ?? localitiesError
  const aliasesByPage = new Map<string, string[]>()
  const localitiesByPage = new Map<string, string[]>()
  for (const alias of aliases ?? []) aliasesByPage.set(alias.page_id as string, [...(aliasesByPage.get(alias.page_id as string) ?? []), alias.name as string])
  for (const locality of localities ?? []) localitiesByPage.set(locality.page_id as string, [...(localitiesByPage.get(locality.page_id as string) ?? []), locality.name as string])
  return {
    groups: (groups ?? []).map((item) => ({ id: item.id as string, name: item.name as string })),
    parents: (parents ?? []).map((item) => ({ id: item.id as string, name: (item.display_name as string | null) ?? "Unnamed Place" })),
    airports: (airports ?? []).flatMap((item) => item.slug && item.display_name ? [{ id: item.id as string, slug: item.slug as string, name: item.display_name as string, published: item.lifecycle_state === "published", bookingAvailable: item.booking_available !== false }] : []),
    existingPlaces: (pages ?? []).map((item) => ({ id: item.id as string, name: (item.display_name as string | null) ?? "", officialName: (item.official_name as string | null) ?? "", slug: (item.slug as string | null) ?? "", aliases: aliasesByPage.get(item.id as string) ?? [], localities: localitiesByPage.get(item.id as string) ?? [] })),
  }
}

export async function previewPlaceImport(csv: string) {
  const parsed = parsePlaceImportCsv(csv)
  const references = await getPlaceImportReferences()
  return { errors: parsed.errors, rows: validatePlaceImportRows(parsed.rows, references, parsed.errors), references: { groups: references.groups, parents: references.parents } }
}

export type PlaceImportResult = {
  created: { rowNumber: number; name: string; id: string; href: string }[]
  skipped: { rowNumber: number; name: string; reason: string }[]
  failed: { rowNumber: number; name: string; reason: string }[]
}

export async function confirmPlaceImport(csv: string, selectedRowNumbers: number[]): Promise<PlaceImportResult> {
  const parsed = parsePlaceImportCsv(csv)
  const references = await getPlaceImportReferences()
  const rows = validatePlaceImportRows(parsed.rows, references, parsed.errors)
  const selected = new Set(selectedRowNumbers)
  const result: PlaceImportResult = { created: [], skipped: [], failed: [] }
  for (const row of rows) {
    if (!selected.has(row.rowNumber)) {
      result.skipped.push({ rowNumber: row.rowNumber, name: row.name, reason: "Not selected." })
      continue
    }
    if (row.blockers.length) {
      result.skipped.push({ rowNumber: row.rowNumber, name: row.name, reason: row.blockers.join(" ") })
      continue
    }
    const airports = row.supportedAirportSlugs.map((slug) => references.airports.find((airport) => airport.slug.toLocaleLowerCase("en-GB") === slug)).filter((airport): airport is PlaceImportReference["airports"][number] => Boolean(airport))
    const policy = getDestinationPagePolicy("place")
    const resultForRow = await saveAdminDestinationPage({
      pageType: "place",
      slug: row.slug,
      officialName: row.name,
      displayName: row.name,
      iataCode: "",
      serviceArea: "",
      placeType: row.placeType,
      placeGroupId: row.placeGroupId,
      primaryParentId: row.parentPlaceId,
      aliases: row.aliases,
      coveredLocalities: row.coveredLocalities.map((name) => ({ name, localityType: "neighbourhood", notes: "" })),
      googlePlaceId: "",
      address: "",
      latitude: 0,
      longitude: 0,
      terminals: [],
      relatedDestinations: airports.map((airport, index) => ({
        pageId: airport.id,
        displayName: airport.name,
        slug: airport.slug,
        heading: `Travel between ${row.name} and ${airport.name}`,
        description: `Book a fixed-price airport transfer between ${row.name} and ${airport.name}.`,
        reverseHeading: `Travel between ${airport.name} and ${row.name}`,
        reverseDescription: `Book a fixed-price airport transfer between ${airport.name} and ${row.name}.`,
        kind: "supported_airport" as const,
        sortOrder: index,
        bookingAvailable: airport.bookingAvailable,
      })),
      seoTitle: policy.defaults.seoTitle(row.name),
      metaDescription: policy.defaults.metaDescription(row.name, airports.map((airport) => airport.name)),
      h1: policy.defaults.h1(row.name),
      content: defaultPlaceImportContent(row.name),
    })
    if (resultForRow.ok) result.created.push({ rowNumber: row.rowNumber, name: row.name, id: resultForRow.page.id, href: `/admin/destination-pages/${resultForRow.page.id}` })
    else result.failed.push({ rowNumber: row.rowNumber, name: row.name, reason: resultForRow.error })
  }
  return result
}
