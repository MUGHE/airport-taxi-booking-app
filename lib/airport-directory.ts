import { createClient } from "@supabase/supabase-js"
import { AIRPORT_PAGES } from "@/lib/airport-content"
import { readPublishedAirportFacts } from "@/lib/published-airport-facts"
import { allowLegacyAirportFallback } from "@/lib/legacy-airport-fallback"

export const MAX_FEATURED_AIRPORTS = 6

export type AirportDirectoryEntry = {
  id: string
  displayName: string
  iataCode: string
  serviceArea: string
  slug: string
  featured: boolean
}

type DirectoryRow = {
  id: string
  published_slug: string
  lifecycle_state: "draft" | "published" | "archived"
  current_published_snapshot_id: string | null
  featured: boolean
}

type PublishedSnapshotRow = {
  id: string
  content: unknown
}

export function currentPublishedCanonicalSlug(page: Pick<DirectoryRow, "lifecycle_state" | "published_slug" | "current_published_snapshot_id">): string | null {
  return page.lifecycle_state === "published" && page.current_published_snapshot_id && page.published_slug
    ? page.published_slug
    : null
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function fallbackDirectory(): AirportDirectoryEntry[] {
  return AIRPORT_PAGES.map((airport, index) => ({
    id: `legacy-${airport.slug}`,
    displayName: airport.shortName,
    iataCode: airport.code,
    serviceArea: airport.area,
    slug: airport.slug,
    featured: index < MAX_FEATURED_AIRPORTS,
  })).sort((left, right) => left.displayName.localeCompare(right.displayName))
}

function toEntry(row: DirectoryRow, snapshot: PublishedSnapshotRow): AirportDirectoryEntry | null {
  const facts = readPublishedAirportFacts(snapshot.content)
  if (!facts) return null
  return {
    id: row.id,
    displayName: facts.displayName,
    iataCode: facts.iataCode,
    serviceArea: facts.serviceArea,
    slug: row.published_slug,
    featured: row.featured,
  }
}

function safeLegacyEntry(row: DirectoryRow): AirportDirectoryEntry | null {
  const airport = AIRPORT_PAGES.find((item) => item.slug === row.published_slug)
  if (!airport) return null
  return {
    id: row.id,
    displayName: airport.shortName,
    iataCode: airport.code,
    serviceArea: airport.area,
    slug: row.published_slug,
    featured: row.featured,
  }
}

export async function listPublishedAirportDirectory(): Promise<AirportDirectoryEntry[]> {
  const supabase = getSupabase()
  if (!supabase) return allowLegacyAirportFallback() ? fallbackDirectory() : []

  const { data, error } = await supabase
    .from("destination_pages")
    .select("id, published_slug, lifecycle_state, current_published_snapshot_id, featured")
    .eq("page_type", "airport")
    .eq("lifecycle_state", "published")
    .not("published_slug", "is", null)
    .not("current_published_snapshot_id", "is", null)

  if (error) return []
  const pages = ((data ?? []) as DirectoryRow[]).filter((row) => currentPublishedCanonicalSlug(row))
  if (pages.length === 0) return []
  const { data: snapshots, error: snapshotError } = await supabase
    .from("destination_page_snapshots")
    .select("id, content")
    .eq("snapshot_kind", "published")
    .in("id", pages.map((page) => page.current_published_snapshot_id as string))
  if (snapshotError) return []
  const snapshotsById = new Map(((snapshots ?? []) as PublishedSnapshotRow[]).map((snapshot) => [snapshot.id, snapshot]))
  return pages
    .flatMap((page) => {
      const snapshot = snapshotsById.get(page.current_published_snapshot_id as string)
      // Keep local development usable before migration 000010 is applied.
      // Production excludes any page whose Published Snapshot lacks facts.
      const entry = snapshot ? toEntry(page, snapshot) : null
      const safeEntry = entry ?? (allowLegacyAirportFallback() ? safeLegacyEntry(page) : null)
      return safeEntry ? [safeEntry] : []
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName))
}

export async function listFeaturedAirports(): Promise<AirportDirectoryEntry[]> {
  const airports = await listPublishedAirportDirectory()
  return airports.filter((airport) => airport.featured).slice(0, MAX_FEATURED_AIRPORTS)
}

export async function setAirportFeatured(pageId: string, featured: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: "Destination Pages are not connected to the database." }
  if (!pageId) return { ok: false, error: "Airport Page not found." }

  const { data, error } = await supabase
    .from("destination_pages")
    .update({ featured })
    .eq("id", pageId)
    .eq("page_type", "airport")
    .eq("lifecycle_state", "published")
    .select("id")
    .maybeSingle()

  if (!error && data) return { ok: true }
  if (error?.message.includes("six Featured Airports")) {
    return { ok: false, error: "You can feature no more than six Published Airport Pages. Unfeature one first." }
  }
  return { ok: false, error: "Only a Published Airport Page can be featured." }
}
