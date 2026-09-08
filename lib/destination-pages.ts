import { createClient } from "@supabase/supabase-js"
import { createPublishedAirportPagePresentation, type AirportPagePresentation, type AirportPageTerminal, type PublishedAirportPageContent } from "@/lib/airport-page-data"
import { VEHICLE_CLASSES } from "@/lib/fleet"

type DestinationPageRow = {
  id: string
  display_name: string
  service_area: string
  lifecycle_state: "draft" | "published" | "archived"
  current_published_snapshot_id: string | null
}

type DestinationSnapshotRow = {
  id: string
  snapshot_kind: "draft" | "published" | "recovery"
  seo_title: string
  meta_description: string
  h1: string
  content: unknown
}

type DestinationTerminalRow = {
  id: string
  display_name: string
  address: string
  latitude: number
  longitude: number
  sort_order: number
  is_primary: boolean
}

export type PublishedAirportPage = {
  presentation: AirportPagePresentation
  metadata: { title: string; description: string; canonical: string }
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function isPublishedContent(value: unknown): value is PublishedAirportPageContent {
  if (!value || typeof value !== "object") return false
  const content = value as Record<string, unknown>
  return typeof content.heading === "string"
    && Array.isArray(content.intro) && content.intro.every((item) => typeof item === "string")
    && Array.isArray(content.benefits) && content.benefits.every((item) => {
      if (!item || typeof item !== "object") return false
      const benefit = item as Record<string, unknown>
      return typeof benefit.title === "string" && typeof benefit.description === "string" && (benefit.icon === "fare" || benefit.icon === "flight")
    })
    && Array.isArray(content.faqs) && content.faqs.every((item) => {
      if (!item || typeof item !== "object") return false
      const faq = item as Record<string, unknown>
      return typeof faq.question === "string" && typeof faq.answer === "string"
    })
}

export async function getPublishedAirportPage(slug: string): Promise<PublishedAirportPage | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  try {
    const { data: page, error: pageError } = await supabase
      .from("destination_pages")
      .select("id, display_name, service_area, lifecycle_state, current_published_snapshot_id")
      .eq("slug", slug)
      .eq("page_type", "airport")
      .eq("lifecycle_state", "published")
      .maybeSingle()
    if (pageError || !page) return null

    const pageRow = page as DestinationPageRow
    if (!pageRow.current_published_snapshot_id) return null

    const [{ data: snapshot, error: snapshotError }, { data: terminalRows, error: terminalError }] = await Promise.all([
      supabase.from("destination_page_snapshots").select("id, snapshot_kind, seo_title, meta_description, h1, content").eq("id", pageRow.current_published_snapshot_id).eq("page_id", pageRow.id).eq("snapshot_kind", "published").maybeSingle(),
      supabase.from("destination_page_terminals").select("id, display_name, address, latitude, longitude, sort_order, is_primary").eq("page_id", pageRow.id).order("sort_order"),
    ])
    if (snapshotError || terminalError || !snapshot || !isPublishedContent((snapshot as DestinationSnapshotRow).content)) return null

    const terminals: AirportPageTerminal[] = (terminalRows as DestinationTerminalRow[]).map((terminal) => ({
      id: terminal.id,
      name: terminal.display_name,
      area: pageRow.service_area,
      latitude: Number(terminal.latitude),
      longitude: Number(terminal.longitude),
      isPrimary: terminal.is_primary,
    }))
    const snapshotRow = snapshot as DestinationSnapshotRow
    const content: PublishedAirportPageContent = {
      ...(snapshotRow.content as PublishedAirportPageContent),
      heading: snapshotRow.h1,
    }

    return {
      presentation: createPublishedAirportPagePresentation({
        shortName: pageRow.display_name,
        terminals,
        content,
        vehicles: VEHICLE_CLASSES,
      }),
      metadata: {
        title: snapshotRow.seo_title,
        description: snapshotRow.meta_description,
        canonical: `/airport-transfers/${slug}`,
      },
    }
  } catch {
    return null
  }
}
