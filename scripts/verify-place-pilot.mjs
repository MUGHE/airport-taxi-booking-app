import { createClient } from "@supabase/supabase-js"

const PILOT_SLUGS = ["westminster", "city-of-london", "camden", "kensington-and-chelsea", "hammersmith-and-fulham", "ealing", "hillingdon", "tower-hamlets", "greenwich", "croydon"]
const AIRPORT_SLUGS = ["heathrow-airport-taxi", "gatwick-airport-taxi", "stansted-airport-taxi", "luton-airport-taxi", "london-city-airport-taxi", "southend-airport-taxi"]
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running Place pilot verification.")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const failures = []

async function readPages(pageType, slugs) {
  const { data, error } = await supabase
    .from("destination_pages")
    .select("id, page_type, published_slug, lifecycle_state, current_published_snapshot_id, google_place_id, address, latitude, longitude, booking_available")
    .eq("page_type", pageType)
    .in("published_slug", slugs)
  if (error) throw new Error(`${pageType} page read failed: ${error.message}`)
  return data ?? []
}

try {
  const places = await readPages("place", PILOT_SLUGS)
  const airports = await readPages("airport", AIRPORT_SLUGS)
  const placeBySlug = new Map(places.map((page) => [page.published_slug, page]))
  const airportBySlug = new Map(airports.map((page) => [page.published_slug, page]))
  const airportIds = new Set(airports.map((page) => page.id))

  for (const slug of PILOT_SLUGS) {
    const page = placeBySlug.get(slug)
    if (!page || page.lifecycle_state !== "published" || !page.current_published_snapshot_id) failures.push(`${slug}: not Published with a current Published Snapshot`)
    if (page && (!page.google_place_id || !page.address || page.latitude == null || page.longitude == null)) failures.push(`${slug}: missing reviewed Google Place identity or coordinates`)
  }
  for (const slug of AIRPORT_SLUGS) {
    const page = airportBySlug.get(slug)
    if (!page || page.lifecycle_state !== "published" || !page.current_published_snapshot_id) failures.push(`${slug}: Airport Page regression failed`)
  }

  const placeIds = places.map((page) => page.id)
  if (placeIds.length) {
    const [{ data: snapshots, error: snapshotError }, { data: relationships, error: relationshipError }] = await Promise.all([
      supabase.from("destination_page_snapshots").select("id, page_id, snapshot_kind, content").in("page_id", placeIds).eq("snapshot_kind", "published"),
      supabase.from("destination_page_relationships").select("page_a_id, page_b_id, relationship_kind").eq("relationship_kind", "supported_airport").or(`page_a_id.in.(${placeIds.join(",")}),page_b_id.in.(${placeIds.join(",")})`),
    ])
    if (snapshotError) failures.push(`Place Published Snapshot read failed: ${snapshotError.message}`)
    if (relationshipError) failures.push(`Supported Airport relationship read failed: ${relationshipError.message}`)
    const snapshotsByPageId = new Map((snapshots ?? []).map((snapshot) => [snapshot.page_id, snapshot]))
    const supportedCounts = new Map(placeIds.map((id) => [id, 0]))
    for (const relationship of relationships ?? []) {
      const placeId = supportedCounts.has(relationship.page_a_id) ? relationship.page_a_id : relationship.page_b_id
      const airportId = placeId === relationship.page_a_id ? relationship.page_b_id : relationship.page_a_id
      if (supportedCounts.has(placeId) && airportIds.has(airportId)) supportedCounts.set(placeId, supportedCounts.get(placeId) + 1)
    }
    for (const page of places) {
      const snapshot = snapshotsByPageId.get(page.id)
      if (!snapshot || !snapshot.content || typeof snapshot.content !== "object") failures.push(`${page.published_slug}: missing public Published Snapshot content`)
      if (!supportedCounts.get(page.id)) failures.push(`${page.published_slug}: no Supported Airport relationship`)
    }
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : "Place pilot verification could not read Supabase")
}

if (failures.length) {
  console.error("Place pilot verification failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Place pilot verified: ${PILOT_SLUGS.length} Published Place Pages and ${AIRPORT_SLUGS.length} Airport Page regressions.`)
