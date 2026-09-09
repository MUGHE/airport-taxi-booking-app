import { createClient } from "@supabase/supabase-js"
import { AIRPORT_PAGES } from "@/lib/airport-content"

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
  display_name: string
  iata_code: string
  service_area: string
  slug: string
  published_slug: string | null
  featured: boolean
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

function toEntry(row: DirectoryRow): AirportDirectoryEntry {
  return {
    id: row.id,
    displayName: row.display_name,
    iataCode: row.iata_code,
    serviceArea: row.service_area,
    slug: row.published_slug ?? row.slug,
    featured: row.featured,
  }
}

export async function listPublishedAirportDirectory(): Promise<AirportDirectoryEntry[]> {
  const supabase = getSupabase()
  if (!supabase) return fallbackDirectory()

  const { data, error } = await supabase
    .from("destination_pages")
    .select("id, display_name, iata_code, service_area, slug, published_slug, featured")
    .eq("page_type", "airport")
    .eq("lifecycle_state", "published")
    .order("display_name", { ascending: true })

  if (error) return []
  return ((data ?? []) as DirectoryRow[]).map(toEntry)
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
