import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type AdminDestinationPage = {
  id: string
  pageType: "airport" | "city_town"
  lifecycleState: "draft" | "published" | "archived"
  featured: boolean
  hasUnpublishedChanges: boolean
  slug: string
  officialName: string
  displayName: string
  iataCode: string
  serviceArea: string
  googlePlaceId: string
  address: string
  latitude: number
  longitude: number
  updatedAt: string
  draft: {
    seoTitle: string
    metaDescription: string
    h1: string
  }
  terminals: AdminTerminal[]
}

export type AdminTerminal = {
  id?: string
  displayName: string
  address: string
  latitude: number
  longitude: number
  sortOrder: number
  isPrimary: boolean
}

export type SaveAdminDestinationPageInput = Omit<AdminDestinationPage, "id" | "pageType" | "lifecycleState" | "featured" | "hasUnpublishedChanges" | "updatedAt" | "draft" | "terminals"> & {
  id?: string
  terminals: AdminTerminal[]
  seoTitle?: string
  metaDescription?: string
  h1?: string
}

type PageRow = {
  id: string
  page_type: "airport" | "city_town"
  lifecycle_state: "draft" | "published" | "archived"
  featured: boolean
  slug: string
  official_name: string
  display_name: string
  iata_code: string
  service_area: string
  google_place_id: string
  address: string
  latitude: number
  longitude: number
  updated_at: string
  current_draft_snapshot_id: string | null
  current_published_snapshot_id: string | null
}

type SnapshotRow = {
  id: string
  page_id: string
  snapshot_kind: "draft" | "published" | "recovery"
  seo_title: string
  meta_description: string
  h1: string
  content: unknown
  created_at: string
}

type TerminalRow = {
  id: string
  page_id: string
  display_name: string
  address: string
  latitude: number
  longitude: number
  sort_order: number
  is_primary: boolean
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function toTerminal(row: TerminalRow): AdminTerminal {
  return {
    id: row.id,
    displayName: row.display_name,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    sortOrder: row.sort_order,
    isPrimary: row.is_primary,
  }
}

function toPage(row: PageRow, draft: SnapshotRow | undefined, published: SnapshotRow | undefined, terminals: TerminalRow[]): AdminDestinationPage {
  return {
    id: row.id,
    pageType: row.page_type,
    lifecycleState: row.lifecycle_state,
    featured: row.featured,
    hasUnpublishedChanges: Boolean(draft && (!published || draft.created_at > published.created_at)),
    slug: row.slug,
    officialName: row.official_name,
    displayName: row.display_name,
    iataCode: row.iata_code,
    serviceArea: row.service_area,
    googlePlaceId: row.google_place_id,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    updatedAt: row.updated_at,
    draft: {
      seoTitle: draft?.seo_title ?? `${row.display_name} Airport Taxi & Transfers`,
      metaDescription: draft?.meta_description ?? `Fixed-price taxi transfers to and from ${row.display_name} Airport.`,
      h1: draft?.h1 ?? `${row.display_name} Airport Taxi & Transfers`,
    },
    terminals: terminals.sort((a, b) => a.sort_order - b.sort_order).map(toTerminal),
  }
}

async function loadPageRows(supabase: SupabaseClient, pageId?: string): Promise<AdminDestinationPage[]> {
  let pageQuery = supabase.from("destination_pages").select("*").eq("page_type", "airport").order("updated_at", { ascending: false })
  if (pageId) pageQuery = pageQuery.eq("id", pageId)

  const { data: pages, error: pageError } = await pageQuery
  if (pageError) throw pageError
  if (!pages?.length) return []

  const ids = (pages as PageRow[]).map((page) => page.id)
  const [{ data: snapshots, error: snapshotError }, { data: terminals, error: terminalError }] = await Promise.all([
    supabase.from("destination_page_snapshots").select("id, page_id, snapshot_kind, seo_title, meta_description, h1, content, created_at").in("page_id", ids),
    supabase.from("destination_page_terminals").select("id, page_id, display_name, address, latitude, longitude, sort_order, is_primary").in("page_id", ids).order("sort_order"),
  ])
  if (snapshotError) throw snapshotError
  if (terminalError) throw terminalError

  const snapshotRows = (snapshots ?? []) as SnapshotRow[]
  const terminalRows = (terminals ?? []) as TerminalRow[]
  return (pages as PageRow[]).map((page) => toPage(
    page,
    snapshotRows.find((snapshot) => snapshot.id === page.current_draft_snapshot_id),
    snapshotRows.find((snapshot) => snapshot.id === page.current_published_snapshot_id),
    terminalRows.filter((terminal) => terminal.page_id === page.id),
  ))
}

export async function listAdminDestinationPages(): Promise<AdminDestinationPage[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  return loadPageRows(supabase)
}

export async function getAdminDestinationPage(id: string): Promise<AdminDestinationPage | null> {
  const supabase = getSupabase()
  if (!supabase || !id) return null
  const pages = await loadPageRows(supabase, id)
  return pages[0] ?? null
}

function validationError(input: SaveAdminDestinationPageInput): string | null {
  if (!input.officialName.trim()) return "Official airport name is required."
  if (!input.displayName.trim()) return "Display name is required."
  if (!/^[A-Z]{3}$/.test(input.iataCode.trim())) return "IATA code must be exactly three uppercase letters."
  if (!input.serviceArea.trim()) return "Service area is required."
  if (!input.googlePlaceId.trim() || !input.address.trim()) return "Select the airport from Google Places before saving."
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90 || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
    return "Select a valid Google location before saving."
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-airport-taxi$/.test(input.slug.trim())) return "Use a lowercase slug ending in -airport-taxi."
  if (!input.terminals.length) return "Add at least one Airport Terminal."
  if (input.terminals.filter((terminal) => terminal.isPrimary).length !== 1) return "Select exactly one primary Airport Terminal."
  for (const terminal of input.terminals) {
    if (!terminal.displayName.trim() || !terminal.address.trim()) return "Every Airport Terminal needs a name and address."
    if (!Number.isFinite(terminal.latitude) || terminal.latitude < -90 || terminal.latitude > 90 || !Number.isFinite(terminal.longitude) || terminal.longitude < -180 || terminal.longitude > 180) {
      return "Every Airport Terminal needs valid latitude and longitude values."
    }
  }
  return null
}

function friendlyDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes("destination_pages_slug_key") || message.includes("duplicate key") && message.includes("slug")) return "That Airport Slug is already in use. Choose a different slug."
  if (message.includes("destination_pages_iata_code_key") || message.includes("duplicate key") && message.includes("iata")) return "That IATA code is already in use. Check the airport code."
  if (message.toLowerCase().includes("duplicate key")) return "This airport conflicts with an existing Destination Page. Check the slug and IATA code."
  return "The Airport Page could not be saved. Please check the fields and try again."
}

export async function saveAdminDestinationPage(input: SaveAdminDestinationPageInput): Promise<{ ok: true; page: AdminDestinationPage } | { ok: false; error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: "Destination Pages are not connected to the database." }

  const normalized: SaveAdminDestinationPageInput = {
    ...input,
    slug: input.slug.trim().toLowerCase(),
    officialName: input.officialName.trim(),
    displayName: input.displayName.trim(),
    iataCode: input.iataCode.trim().toUpperCase(),
    serviceArea: input.serviceArea.trim(),
    googlePlaceId: input.googlePlaceId.trim(),
    address: input.address.trim(),
    terminals: input.terminals.map((terminal, index) => ({ ...terminal, displayName: terminal.displayName.trim(), address: terminal.address.trim(), sortOrder: index })),
  }
  const error = validationError(normalized)
  if (error) return { ok: false, error }

  let pageId = normalized.id
  try {
    if (pageId) {
      const { error: updateError } = await supabase.from("destination_pages").update({
        slug: normalized.slug,
        official_name: normalized.officialName,
        display_name: normalized.displayName,
        iata_code: normalized.iataCode,
        service_area: normalized.serviceArea,
        google_place_id: normalized.googlePlaceId,
        address: normalized.address,
        latitude: normalized.latitude,
        longitude: normalized.longitude,
        updated_at: new Date().toISOString(),
      }).eq("id", pageId).eq("page_type", "airport")
      if (updateError) throw updateError
    } else {
      const { data, error: insertError } = await supabase.from("destination_pages").insert({
        page_type: "airport",
        lifecycle_state: "draft",
        slug: normalized.slug,
        official_name: normalized.officialName,
        display_name: normalized.displayName,
        iata_code: normalized.iataCode,
        service_area: normalized.serviceArea,
        google_place_id: normalized.googlePlaceId,
        address: normalized.address,
        latitude: normalized.latitude,
        longitude: normalized.longitude,
      }).select("id").single()
      if (insertError || !data) throw insertError ?? new Error("Airport Page could not be created")
      pageId = data.id
    }

    const { data: currentPage, error: currentPageError } = await supabase.from("destination_pages").select("current_draft_snapshot_id").eq("id", pageId).single()
    if (currentPageError) throw currentPageError
    const snapshot = {
      page_id: pageId,
      snapshot_kind: "draft",
      created_at: new Date().toISOString(),
      seo_title: normalized.seoTitle?.trim() || `${normalized.displayName} Airport Taxi & Transfers`,
      meta_description: normalized.metaDescription?.trim() || `Fixed-price taxi transfers to and from ${normalized.displayName} Airport.`,
      h1: normalized.h1?.trim() || `${normalized.displayName} Airport Taxi & Transfers`,
      content: { heading: normalized.h1?.trim() || `${normalized.displayName} Airport Taxi & Transfers`, intro: [], benefits: [], faqs: [] },
    }
    let snapshotId = currentPage.current_draft_snapshot_id
    if (snapshotId) {
      const { error: snapshotError } = await supabase.from("destination_page_snapshots").update(snapshot).eq("id", snapshotId).eq("page_id", pageId)
      if (snapshotError) throw snapshotError
    } else {
      const { data, error: snapshotError } = await supabase.from("destination_page_snapshots").insert(snapshot).select("id").single()
      if (snapshotError || !data) throw snapshotError ?? new Error("Draft could not be created")
      snapshotId = data.id
      const { error: pointerError } = await supabase.from("destination_pages").update({ current_draft_snapshot_id: snapshotId, updated_at: new Date().toISOString() }).eq("id", pageId)
      if (pointerError) throw pointerError
    }

    const { error: deleteTerminalsError } = await supabase.from("destination_page_terminals").delete().eq("page_id", pageId)
    if (deleteTerminalsError) throw deleteTerminalsError
    const { error: terminalError } = await supabase.from("destination_page_terminals").insert(normalized.terminals.map((terminal) => ({
      page_id: pageId,
      display_name: terminal.displayName,
      address: terminal.address,
      latitude: terminal.latitude,
      longitude: terminal.longitude,
      sort_order: terminal.sortOrder,
      is_primary: terminal.isPrimary,
    })))
    if (terminalError) throw terminalError

    const saved = await loadPageRows(supabase, pageId)
    if (!saved[0]) return { ok: false, error: "The Airport Page was saved but could not be reloaded." }
    return { ok: true, page: saved[0] }
  } catch (saveError) {
    if (!input.id && pageId) {
      // A failed create should not leave a half-created page behind if a later
      // child insert failed. The delete is best-effort and never hides the real error.
      await supabase.from("destination_pages").delete().eq("id", pageId)
    }
    return { ok: false, error: friendlyDatabaseError(saveError) }
  }
}
