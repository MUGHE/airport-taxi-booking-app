import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { DESTINATION_CONTENT_SCHEMA_VERSION, normalizeDestinationContent, validateDestinationContent, type DestinationContentDocument, type DestinationImageReference } from "@/lib/destination-content"
import { DEFAULT_GLOBAL_FAQS, DEFAULT_SERVICE_FACTS, DEFAULT_VERIFIED_REVIEWS, type GlobalFaq, type ServiceFact, type VerifiedReview } from "@/lib/reusable-content"
import { listRelatedDestinations } from "@/lib/related-destinations"
import { getPublishBlockers, getPublishWarnings, getWarningSetHash, type ExistingQualityPage, type PublishWarning } from "@/lib/publish-readiness"

export type ReusableDestinationContent = { serviceFacts: ServiceFact[]; globalFaqs: GlobalFaq[]; reviews: VerifiedReview[] }

export type AdminDestinationPage = {
  id: string
  pageType: "airport" | "city_town"
  lifecycleState: "draft" | "published" | "archived"
  bookingAvailable: boolean
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
    content: DestinationContentDocument
  }
  terminals: AdminTerminal[]
  relatedDestinations: AdminRelatedDestination[]
}

export type AdminRelatedDestination = {
  id?: string
  pageId: string
  displayName: string
  slug: string
  heading: string
  description: string
  reverseHeading: string
  reverseDescription: string
  image?: DestinationImageReference
  reverseImage?: DestinationImageReference
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

export type SaveAdminDestinationPageInput = Omit<AdminDestinationPage, "id" | "pageType" | "lifecycleState" | "bookingAvailable" | "featured" | "hasUnpublishedChanges" | "updatedAt" | "draft" | "terminals"> & {
  id?: string
  terminals: AdminTerminal[]
  relatedDestinations: AdminRelatedDestination[]
  seoTitle?: string
  metaDescription?: string
  h1?: string
  content?: DestinationContentDocument
}

type PageRow = {
  id: string
  page_type: "airport" | "city_town"
  lifecycle_state: "draft" | "published" | "archived"
  booking_available: boolean
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

export async function listReusableDestinationContent(): Promise<ReusableDestinationContent> {
  const supabase = getSupabase()
  if (!supabase) return { serviceFacts: DEFAULT_SERVICE_FACTS, globalFaqs: DEFAULT_GLOBAL_FAQS, reviews: DEFAULT_VERIFIED_REVIEWS }
  const [{ data: facts, error: factsError }, { data: faqs, error: faqsError }, { data: reviews, error: reviewsError }] = await Promise.all([
    supabase.from("destination_service_facts").select("id, fact_key, title, description").eq("approved", true).order("id"),
    supabase.from("destination_global_faqs").select("id, question, answer").eq("approved", true).order("updated_at", { ascending: false }),
    supabase.from("destination_verified_reviews").select("id, quote, author, source").eq("approved", true).order("verified_at", { ascending: false }),
  ])
  if (factsError || faqsError || reviewsError) return { serviceFacts: DEFAULT_SERVICE_FACTS, globalFaqs: DEFAULT_GLOBAL_FAQS, reviews: DEFAULT_VERIFIED_REVIEWS }
  return {
    serviceFacts: (facts ?? []).map((fact) => ({ id: fact.id, key: fact.fact_key, title: fact.title, description: fact.description })) as ServiceFact[],
    globalFaqs: (faqs ?? []) as GlobalFaq[],
    reviews: (reviews ?? []) as VerifiedReview[],
  }
}

async function validateReusableContent(content: DestinationContentDocument): Promise<string | null> {
  const library = await listReusableDestinationContent()
  const selectedFactIds = new Set(library.serviceFacts.map((fact) => fact.id))
  const selectedFaqIds = new Set(library.globalFaqs.map((faq) => faq.id))
  const selectedReviewIds = new Set(library.reviews.map((review) => review.id))
  if (content.serviceFacts.some((fact) => !selectedFactIds.has(fact.id))) return "Select Service Facts from the approved library."
  if (content.globalFaqs.some((faq) => !selectedFaqIds.has(faq.id))) return "Select Global FAQs from the approved library."
  if (content.reviews.some((review) => !selectedReviewIds.has(review.id))) return "Select verified reviews from the approved library."
  for (const fact of content.serviceFacts) {
    const approved = library.serviceFacts.find((item) => item.id === fact.id)
    if (!approved || approved.title !== fact.title || approved.description !== fact.description) return "Approved Service Facts cannot be rewritten on an Airport Page."
  }
  for (const faq of content.globalFaqs) {
    const approved = library.globalFaqs.find((item) => item.id === faq.id)
    if (!approved || approved.question !== faq.question || approved.answer !== faq.answer) return "Approved Global FAQs cannot be rewritten on an Airport Page."
  }
  for (const review of content.reviews) {
    const approved = library.reviews.find((item) => item.id === review.id)
    if (!approved || approved.quote !== review.quote || approved.author !== review.author || approved.source !== review.source) return "Verified reviews must keep their approved attribution."
  }
  return null
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

function toPage(row: PageRow, draft: SnapshotRow | undefined, published: SnapshotRow | undefined, terminals: TerminalRow[], relatedDestinations: AdminRelatedDestination[] = []): AdminDestinationPage {
  return {
    id: row.id,
    pageType: row.page_type,
    lifecycleState: row.lifecycle_state,
    bookingAvailable: row.booking_available,
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
    content: normalizeDestinationContent(draft?.content, draft?.h1 ?? `${row.display_name} Airport Taxi & Transfers`),
    },
    terminals: terminals.sort((a, b) => a.sort_order - b.sort_order).map(toTerminal),
    relatedDestinations,
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
  const result = (pages as PageRow[]).map((page) => toPage(
    page,
    snapshotRows.find((snapshot) => snapshot.id === page.current_draft_snapshot_id),
    snapshotRows.find((snapshot) => snapshot.id === page.current_published_snapshot_id),
    terminalRows.filter((terminal) => terminal.page_id === page.id),
  ))
  for (const page of result) {
    const related = await listRelatedDestinations(page.id)
    page.relatedDestinations = related.map((item) => ({ ...item, reverseHeading: item.reverseHeading ?? "", reverseDescription: item.reverseDescription ?? "" }))
  }
  return result
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
  if (input.relatedDestinations.some((item) => item.pageId === input.id)) return "An Airport Page cannot relate to itself."
  if (input.relatedDestinations.some((item) => !item.pageId || !item.heading.trim() || !item.description.trim() || !item.reverseHeading.trim() || !item.reverseDescription.trim())) return "Every related destination needs both directional headings and descriptions."
  const contentError = validateDestinationContent(input.content, input.h1?.trim() || `${input.displayName.trim()} Airport Taxi & Transfers`)
  if (contentError) return contentError
  return null
}

function friendlyDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes("destination_pages_slug_key") || message.includes("duplicate key") && message.includes("slug")) return "That Airport Slug is already in use. Choose a different slug."
  if (message.includes("destination_pages_iata_code_key") || message.includes("duplicate key") && message.includes("iata")) return "That IATA code is already in use. Check the airport code."
  if (message.toLowerCase().includes("duplicate key")) return "This airport conflicts with an existing Destination Page. Check the slug and IATA code."
  return "The Airport Page could not be saved. Please check the fields and try again."
}

function imageReferences(content: DestinationContentDocument): DestinationImageReference[] {
  return [content.hero.image, ...content.sections.map((section) => section.image)].filter((image): image is DestinationImageReference => Boolean(image))
}

async function validateSavedImages(supabase: SupabaseClient, content: DestinationContentDocument, extraImages: DestinationImageReference[] = []): Promise<string | null> {
  const references = [...imageReferences(content), ...extraImages]
  if (!references.length) return null
  const ids = [...new Set(references.map((image) => image.assetId))]
  const { data, error } = await supabase.from("cloudinary_media_assets").select("id, public_id, secure_url, width, height, format, alt_text, rights_confirmed").in("id", ids)
  if (error) return "The selected image could not be verified in the media library."
  const rows = new Map((data ?? []).map((row) => [row.id as string, row as { id: string; public_id: string; secure_url: string; width: number; height: number; format: string; alt_text: string; rights_confirmed: boolean }]))
  for (const reference of references) {
    const row = rows.get(reference.assetId)
    if (!row || !row.rights_confirmed || row.public_id !== reference.publicId || row.secure_url !== reference.secureUrl || Number(row.width) !== reference.width || Number(row.height) !== reference.height || row.format !== reference.format || row.alt_text !== reference.altText) {
      return "Select a verified image from the media library before saving this draft."
    }
  }
  return null
}

async function validateRelatedDestinations(supabase: SupabaseClient, input: SaveAdminDestinationPageInput): Promise<string | null> {
  if (!input.relatedDestinations.length) return null
  const ids = input.relatedDestinations.map((item) => item.pageId)
  if (new Set(ids).size !== ids.length) return "Each related destination can be selected only once."
  const { data, error } = await supabase.from("destination_pages").select("id").in("id", ids).eq("page_type", "airport").eq("lifecycle_state", "published")
  if (error || (data ?? []).length !== ids.length) return "Related destinations must be Published Airport Pages."
  return null
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
  const content = normalized.content ?? normalizeDestinationContent(undefined, normalized.h1?.trim() || `${normalized.displayName} Airport Taxi & Transfers`)
  const reusableContentError = await validateReusableContent(content)
  if (reusableContentError) return { ok: false, error: reusableContentError }
  const imageError = await validateSavedImages(supabase, content, normalized.relatedDestinations.flatMap((item) => [item.image, item.reverseImage].filter((image): image is DestinationImageReference => Boolean(image))))
  if (imageError) return { ok: false, error: imageError }
  const relatedError = await validateRelatedDestinations(supabase, normalized)
  if (relatedError) return { ok: false, error: relatedError }

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
        content_schema_version: DESTINATION_CONTENT_SCHEMA_VERSION,
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
        content_schema_version: DESTINATION_CONTENT_SCHEMA_VERSION,
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
      content,
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

    const { error: terminalError } = await supabase.rpc("replace_destination_page_terminals", {
      p_page_id: pageId,
      p_terminals: normalized.terminals.map((terminal) => ({
        displayName: terminal.displayName,
        address: terminal.address,
        latitude: terminal.latitude,
        longitude: terminal.longitude,
        isPrimary: terminal.isPrimary,
      })),
    })
    if (terminalError) throw terminalError

    const { error: deleteRelationshipsError } = await supabase.from("destination_page_relationships").delete().or(`page_a_id.eq.${pageId},page_b_id.eq.${pageId}`)
    if (deleteRelationshipsError) throw deleteRelationshipsError
    for (const related of normalized.relatedDestinations) {
      const [pageA, pageB] = [pageId, related.pageId].sort()
      const currentIsA = pageA === pageId
      const { error: relationshipError } = await supabase.from("destination_page_relationships").insert({
        page_a_id: pageA,
        page_b_id: pageB,
        a_heading: currentIsA ? related.heading : related.reverseHeading,
        a_description: currentIsA ? related.description : related.reverseDescription,
        a_image: currentIsA ? related.image ?? null : related.reverseImage ?? null,
        b_heading: currentIsA ? related.reverseHeading : related.heading,
        b_description: currentIsA ? related.reverseDescription : related.description,
        b_image: currentIsA ? related.reverseImage ?? null : related.image ?? null,
      })
      if (relationshipError) throw relationshipError
    }

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

export type PublishOverride = { warningSetHash: string; warnings: PublishWarning[] }
export type PublishResult = { ok: true; slug: string } | { ok: false; error: string; blockers?: { code: string; message: string }[]; warnings?: PublishWarning[]; warningSetHash?: string }
export type RestoreResult = { ok: true; page: AdminDestinationPage } | { ok: false; error: string }
export type LifecycleResult = { ok: true } | { ok: false; error: string }

export async function deleteAdminDestinationDraft(pageId: string): Promise<LifecycleResult> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }
  const { error } = await supabase.rpc("delete_destination_draft", { p_page_id: pageId, p_deleted_by: "admin" })
  return error ? { ok: false, error: error.message.includes("Published Page") ? "A Published Page cannot be deleted." : "The Draft could not be deleted." } : { ok: true }
}

export async function archiveAdminDestinationPage(pageId: string, replacementSlug: string): Promise<LifecycleResult> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }
  const target = replacementSlug.trim() || "airport-transfers"
  const { error } = await supabase.rpc("archive_destination_page", { p_page_id: pageId, p_replacement_slug: target, p_archived_by: "admin" })
  if (!error) return { ok: true }
  if (error.message.includes("Replacement destination")) return { ok: false, error: "Choose a Published Airport Page as the replacement." }
  return { ok: false, error: error.message.includes("Published Page") ? "Only a Published Page can be archived." : "The Airport Page could not be archived." }
}

export async function setAdminBookingAvailability(pageId: string, available: boolean): Promise<LifecycleResult> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }
  const { error } = await supabase.rpc("set_destination_booking_availability", { p_page_id: pageId, p_available: available, p_changed_by: "admin" })
  return error ? { ok: false, error: "Only a Published Page can change booking availability." } : { ok: true }
}

async function listQualityPages(supabase: SupabaseClient): Promise<ExistingQualityPage[]> {
  const [{ data: pages, error: pageError }, { data: snapshots, error: snapshotError }] = await Promise.all([
    supabase.from("destination_pages").select("id, slug, iata_code, lifecycle_state").eq("page_type", "airport").neq("lifecycle_state", "archived"),
    supabase.from("destination_page_snapshots").select("page_id, snapshot_kind, meta_description, content").in("snapshot_kind", ["draft", "published"]),
  ])
  if (pageError || snapshotError) throw pageError ?? snapshotError
  const pageRows = (pages ?? []) as { id: string; slug: string; iata_code: string }[]
  const snapshotRows = (snapshots ?? []) as { page_id: string; snapshot_kind: "draft" | "published"; meta_description: string; content: unknown }[]
  return pageRows.flatMap((page) => snapshotRows.filter((snapshot) => snapshot.page_id === page.id).map((snapshot) => {
    const content = normalizeDestinationContent(snapshot.content, `${page.slug} Airport Taxi`)
    return { id: page.id, slug: page.slug, iataCode: page.iata_code, metaDescription: snapshot.meta_description, content, heroImageAssetId: content.hero.image?.assetId }
  }))
}

export async function publishAdminDestinationPage(pageId: string, override?: PublishOverride): Promise<PublishResult> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }
  const page = await getAdminDestinationPage(pageId)
  if (!page) return { ok: false, error: "Airport Page not found." }
  const existingPages = await listQualityPages(supabase)
  const readiness = { ...page, seoTitle: page.draft.seoTitle, metaDescription: page.draft.metaDescription, h1: page.draft.h1, content: page.draft.content, existingPages }
  const blockers = getPublishBlockers(readiness)
  if (blockers.length) return { ok: false, error: blockers.map((item) => item.message).join(" "), blockers }
  const warnings = getPublishWarnings(readiness)
  const warningSetHash = getWarningSetHash(warnings)
  if (warnings.length && (!override || override.warningSetHash !== warningSetHash || JSON.stringify(override.warnings) !== JSON.stringify(warnings))) {
    return { ok: false, error: override ? "The quality warnings changed. Review them before publishing." : "Review the quality warnings before publishing.", warnings, warningSetHash }
  }
  const reusableContentError = await validateReusableContent(page.draft.content)
  if (reusableContentError) return { ok: false, error: reusableContentError, blockers: [{ code: "invalid-reusable-content", message: reusableContentError }] }
  const imageError = await validateSavedImages(supabase, page.draft.content, page.relatedDestinations.flatMap((item) => [item.image, item.reverseImage].filter((image): image is DestinationImageReference => Boolean(image))))
  if (imageError) return { ok: false, error: imageError, blockers: [{ code: "invalid-media", message: imageError }] }
  const relatedError = await validateRelatedDestinations(supabase, { ...page, seoTitle: page.draft.seoTitle, metaDescription: page.draft.metaDescription, h1: page.draft.h1, content: page.draft.content })
  if (relatedError) return { ok: false, error: relatedError, blockers: [{ code: "invalid-relationships", message: relatedError }] }
  const { data, error } = await supabase.rpc("publish_destination_page", { p_page_id: pageId, p_published_by: "admin", p_override: override ? { warningCodes: warnings.map((warning) => warning.code), warningReasons: warnings.map((warning) => warning.reason) } : {} })
  if (error) {
    const message = error.message.toLowerCase().includes("duplicate") ? "That SEO title, Airport Slug, or IATA code conflicts with another Published Page." : "Publish failed. The previous public Published Snapshot is unchanged."
    return { ok: false, error: message }
  }
  return { ok: true, slug: (data as { slug: string }).slug }
}

export async function restoreAdminDestinationPage(pageId: string): Promise<RestoreResult> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }

  const { error } = await supabase.rpc("restore_destination_page", { p_page_id: pageId, p_restored_by: "admin" })
  if (error) {
    return { ok: false, error: error.message.includes("Recovery Snapshot") ? "There is no previous Published Snapshot to restore." : "The previous Published Snapshot could not be restored." }
  }

  const page = await getAdminDestinationPage(pageId)
  return page ? { ok: true, page } : { ok: false, error: "The restored Draft could not be reloaded." }
}
