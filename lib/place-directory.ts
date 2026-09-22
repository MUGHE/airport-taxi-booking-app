import { createClient } from "@supabase/supabase-js"

export type PlaceDirectoryEntry = {
  id: string
  displayName: string
  officialName: string
  placeType: string
  placeGroup: string
  parentPlace: string | null
  slug: string
  featured: boolean
  aliases: string[]
  coveredLocalities: string[]
}

export type PlaceDirectoryGroup = { id: string; name: string; displayOrder: number }
export type PlaceDirectory = { places: PlaceDirectoryEntry[]; groups: PlaceDirectoryGroup[] }
export type PlaceDirectoryRead = { status: "ok" | "unavailable"; directory: PlaceDirectory }

type PageRow = {
  id: string
  published_slug: string | null
  lifecycle_state: "draft" | "published" | "archived"
  current_published_snapshot_id: string | null
  display_name: string | null
  official_name: string | null
  place_type: string | null
  place_group_id: string | null
  primary_parent_id: string | null
  featured: boolean
}

type GroupRow = { id: string; name: string; display_order: number; active: boolean }
type SupportRow = { page_id: string; name: string; display_order: number }

export function normalizePlaceDirectoryTerm(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ")
}

export function placeDirectorySearchText(place: PlaceDirectoryEntry) {
  return [place.displayName, place.officialName, place.placeType, place.placeGroup, place.parentPlace ?? "", ...place.aliases, ...place.coveredLocalities]
    .map(normalizePlaceDirectoryTerm)
    .join(" ")
}

export function currentPublishedPlaceCanonicalSlug(page: Pick<PageRow, "lifecycle_state" | "published_slug" | "current_published_snapshot_id">) {
  return page.lifecycle_state === "published" && page.published_slug && page.current_published_snapshot_id ? page.published_slug : null
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null
}

export async function readPlaceDirectory(): Promise<PlaceDirectoryRead> {
  const supabase = getSupabase()
  if (!supabase) return { status: "unavailable", directory: { places: [], groups: [] } }

  try {
    const [{ data: pages, error: pageError }, { data: groups, error: groupError }] = await Promise.all([
      supabase.from("destination_pages").select("id, published_slug, lifecycle_state, current_published_snapshot_id, display_name, official_name, place_type, place_group_id, primary_parent_id, featured").eq("page_type", "place").eq("lifecycle_state", "published").not("published_slug", "is", null).not("current_published_snapshot_id", "is", null),
      supabase.from("destination_place_groups").select("id, name, display_order, active").eq("active", true).order("display_order").order("name"),
    ])
    if (pageError || groupError) return { status: "unavailable", directory: { places: [], groups: [] } }

    const publishedPages = (pages ?? []) as PageRow[]
    if (!publishedPages.length) return { status: "ok", directory: { places: [], groups: (groups ?? []).map((group) => ({ id: group.id, name: group.name, displayOrder: group.display_order })) } }
    const ids = publishedPages.map((page) => page.id)
    const [{ data: snapshots, error: snapshotError }, { data: aliases, error: aliasError }, { data: localities, error: localityError }, { data: parents, error: parentError }] = await Promise.all([
      supabase.from("destination_page_snapshots").select("id, snapshot_kind").eq("snapshot_kind", "published").in("id", publishedPages.map((page) => page.current_published_snapshot_id as string)),
      supabase.from("destination_place_aliases").select("page_id, name, display_order").in("page_id", ids).order("display_order"),
      supabase.from("destination_covered_localities").select("page_id, name, display_order").in("page_id", ids).order("display_order"),
      supabase.from("destination_pages").select("id, display_name").in("id", publishedPages.map((page) => page.primary_parent_id).filter(Boolean)),
    ])
    if (snapshotError || aliasError || localityError || parentError) return { status: "unavailable", directory: { places: [], groups: [] } }

    const groupById = new Map((groups ?? []).map((group) => [group.id, group as GroupRow]))
    const parentById = new Map((parents ?? []).map((parent) => [parent.id, parent.display_name as string]))
    const publishedSnapshotIds = new Set((snapshots ?? []).map((snapshot) => snapshot.id as string))
    const collect = (rows: unknown, pageId: string) => ((rows as SupportRow[] | null) ?? []).filter((row) => row.page_id === pageId).sort((a, b) => a.display_order - b.display_order).map((row) => row.name)
    const places = publishedPages.flatMap((page) => {
      const slug = currentPublishedPlaceCanonicalSlug(page)
      const group = page.place_group_id ? groupById.get(page.place_group_id) : undefined
      if (!slug || !publishedSnapshotIds.has(page.current_published_snapshot_id as string) || !page.display_name || !page.official_name || !page.place_type || !group) return []
      return [{ id: page.id, displayName: page.display_name, officialName: page.official_name, placeType: page.place_type, placeGroup: group.name, parentPlace: page.primary_parent_id ? parentById.get(page.primary_parent_id) ?? null : null, slug, featured: page.featured, aliases: collect(aliases, page.id), coveredLocalities: collect(localities, page.id) }]
    }).sort((a, b) => a.displayName.localeCompare(b.displayName))
    return { status: "ok", directory: { places, groups: (groups ?? []).map((group) => ({ id: group.id, name: group.name, displayOrder: group.display_order })) } }
  } catch {
    return { status: "unavailable", directory: { places: [], groups: [] } }
  }
}

export async function listPublishedPlaceDirectory() {
  const result = await readPlaceDirectory()
  return result.directory
}
