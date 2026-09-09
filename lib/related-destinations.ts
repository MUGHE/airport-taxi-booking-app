import { createClient } from "@supabase/supabase-js"
import type { DestinationImageReference } from "@/lib/destination-content"

export type RelatedDestination = {
  id: string
  pageId: string
  displayName: string
  slug: string
  heading: string
  description: string
  image?: DestinationImageReference
  reverseImage?: DestinationImageReference
  reverseHeading?: string
  reverseDescription?: string
}

type RelationshipRow = {
  id: string
  page_a_id: string
  page_b_id: string
  a_heading: string
  a_description: string
  a_image: unknown
  b_heading: string
  b_description: string
  b_image: unknown
}

type PageRow = { id: string; display_name: string; slug: string }
type TerminalRow = { page_id: string; display_name: string; latitude: number; longitude: number; is_primary: boolean; sort_order: number }

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null
}

function image(value: unknown): DestinationImageReference | undefined {
  if (!value || typeof value !== "object") return undefined
  const item = value as Record<string, unknown>
  if (typeof item.assetId !== "string" || typeof item.publicId !== "string" || typeof item.secureUrl !== "string" || typeof item.altText !== "string" || typeof item.width !== "number" || typeof item.height !== "number" || typeof item.format !== "string") return undefined
  return item as unknown as DestinationImageReference
}

export type RelatedDestinationCandidate = { id: string; displayName: string; slug: string }

export async function listPublishedDestinationCandidates(excludePageId?: string): Promise<RelatedDestinationCandidate[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const query = supabase.from("destination_pages").select("id, display_name, slug").eq("page_type", "airport").eq("lifecycle_state", "published").order("display_name")
  if (excludePageId) query.neq("id", excludePageId)
  const { data, error } = await query
  if (error) return []
  return (data ?? []).map((item) => ({ id: item.id as string, displayName: item.display_name as string, slug: item.slug as string }))
}

export async function listRelatedDestinations(pageId: string): Promise<RelatedDestination[]> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return []
  const { data: relationships, error } = await supabase.from("destination_page_relationships").select("*").or(`page_a_id.eq.${pageId},page_b_id.eq.${pageId}`)
  if (error || !relationships?.length) return []
  const rows = relationships as RelationshipRow[]
  const ids = [...new Set(rows.flatMap((row) => [row.page_a_id, row.page_b_id]))]
  const { data: pages, error: pageError } = await supabase.from("destination_pages").select("id, display_name, slug").in("id", ids).eq("lifecycle_state", "published")
  if (pageError || !pages) return []
  const pagesById = new Map((pages as PageRow[]).map((page) => [page.id, page]))
  return rows.flatMap((row) => {
    const currentIsA = row.page_a_id === pageId
    const relatedId = currentIsA ? row.page_b_id : row.page_a_id
    const relatedPage = pagesById.get(relatedId)
    if (!relatedPage) return []
    return [{ id: row.id, pageId: relatedId, displayName: relatedPage.display_name, slug: relatedPage.slug, heading: currentIsA ? row.a_heading : row.b_heading, description: currentIsA ? row.a_description : row.b_description, image: image(currentIsA ? row.a_image : row.b_image), reverseHeading: currentIsA ? row.b_heading : row.a_heading, reverseDescription: currentIsA ? row.b_description : row.a_description, reverseImage: image(currentIsA ? row.b_image : row.a_image) }]
  })
}

export async function getPublishedPrimaryTerminals(pageIds: string[]) {
  const supabase = getSupabase()
  if (!supabase || !pageIds.length) return new Map<string, TerminalRow>()
  const { data, error } = await supabase.from("destination_page_terminals").select("page_id, display_name, latitude, longitude, is_primary, sort_order").in("page_id", pageIds).order("sort_order")
  if (error || !data) return new Map<string, TerminalRow>()
  const result = new Map<string, TerminalRow>()
  for (const terminal of data as TerminalRow[]) {
    if (!result.has(terminal.page_id) || terminal.is_primary) result.set(terminal.page_id, terminal)
  }
  return result
}
