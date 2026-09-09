import { createClient } from "@supabase/supabase-js"

const CANONICAL_SLUGS = [
  "heathrow-airport-taxi",
  "gatwick-airport-taxi",
  "stansted-airport-taxi",
  "luton-airport-taxi",
  "london-city-airport-taxi",
  "southend-airport-taxi",
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running cutover verification.")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const failures = []

const { data: pages, error: pagesError } = await supabase
  .from("destination_pages")
  .select("id, published_slug, lifecycle_state, current_published_snapshot_id")
  .eq("page_type", "airport")
  .in("published_slug", CANONICAL_SLUGS)

if (pagesError) {
  console.error(`Could not read destination pages: ${pagesError.message}`)
  process.exit(1)
}

const pagesBySlug = new Map((pages ?? []).map((page) => [page.published_slug, page]))
for (const slug of CANONICAL_SLUGS) {
  const page = pagesBySlug.get(slug)
  if (!page || page.lifecycle_state !== "published" || !page.current_published_snapshot_id) {
    failures.push(`${slug}: not published with a current Published Snapshot`)
  }
}

const publishedIds = [...pagesBySlug.values()]
  .filter((page) => page.lifecycle_state === "published" && page.current_published_snapshot_id)
  .map((page) => page.current_published_snapshot_id)

if (publishedIds.length) {
  const [{ data: snapshots, error: snapshotError }, { data: terminals, error: terminalError }] = await Promise.all([
    supabase.from("destination_page_snapshots").select("id, content").eq("snapshot_kind", "published").in("id", publishedIds),
    supabase.from("destination_page_terminals").select("page_id, is_primary").in("page_id", [...pagesBySlug.values()].map((page) => page.id)),
  ])

  if (snapshotError) failures.push(`Published Snapshot read failed: ${snapshotError.message}`)
  if (terminalError) failures.push(`Terminal read failed: ${terminalError.message}`)

  const snapshotsById = new Map((snapshots ?? []).map((snapshot) => [snapshot.id, snapshot]))
  const terminalsByPageId = new Map()
  for (const terminal of terminals ?? []) {
    const list = terminalsByPageId.get(terminal.page_id) ?? []
    list.push(terminal)
    terminalsByPageId.set(terminal.page_id, list)
  }

  for (const slug of CANONICAL_SLUGS) {
    const page = pagesBySlug.get(slug)
    if (!page || page.lifecycle_state !== "published") continue
    const content = snapshotsById.get(page.current_published_snapshot_id)?.content
    if (!content || typeof content !== "object" || !content.publishedFacts) failures.push(`${slug}: Published Snapshot is missing publishedFacts`)
    const pageTerminals = terminalsByPageId.get(page.id) ?? []
    if (!pageTerminals.length || pageTerminals.filter((terminal) => terminal.is_primary).length !== 1) {
      failures.push(`${slug}: expected terminals with exactly one primary terminal`)
    }
  }
}

const { data: redirects, error: redirectsError } = await supabase
  .from("destination_page_redirects")
  .select("source_slug, target_slug")
  .in("source_slug", ["heathrow", "gatwick", "stansted", "luton", "london-city", "southend"])

if (redirectsError) failures.push(`Redirect read failed: ${redirectsError.message}`)
const redirectsBySource = new Map((redirects ?? []).map((redirect) => [redirect.source_slug, redirect.target_slug]))
for (const slug of CANONICAL_SLUGS) {
  const source = slug.replace(/-airport-taxi$/, "")
  if (redirectsBySource.get(source) !== slug) failures.push(`${source}: missing direct redirect to ${slug}`)
}

if (failures.length) {
  console.error("Airport Page cutover verification failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Airport Page cutover verified: ${CANONICAL_SLUGS.length} canonical pages, Published Snapshots, terminals, and redirects.`)
