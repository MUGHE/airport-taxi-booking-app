import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { DESTINATION_CONTENT_SCHEMA_VERSION, normalizeDestinationContent, validateDestinationContent, type DestinationContentDocument, type DestinationImageReference } from "@/lib/destination-content"
import { DEFAULT_GLOBAL_FAQS, DEFAULT_SERVICE_FACTS, DEFAULT_VERIFIED_REVIEWS, type GlobalFaq, type ServiceFact, type VerifiedReview } from "@/lib/reusable-content"
import { listRelatedDestinations } from "@/lib/related-destinations"
import { getPublishBlockers, getPublishWarnings, getWarningSetHash, type ExistingQualityPage, type PublishWarning } from "@/lib/publish-readiness"
import { getDestinationPagePolicy, type DestinationPageType } from "@/lib/destination-page-policy"
import { findPlaceIdentityConflict, normalizePlaceIdentity, wouldCreateParentCycle } from "@/lib/place-identity"
import { validatePlaceRelationships } from "@/lib/place-page-rules"

export type ReusableDestinationContent = { serviceFacts: ServiceFact[]; globalFaqs: GlobalFaq[]; reviews: VerifiedReview[] }

const DUPLICATE_SLUG_ERROR = "That Airport Slug is already in use. Choose a different slug."
const DUPLICATE_PLACE_SLUG_ERROR = "That Place Slug is already in use. Choose a different slug."
const DUPLICATE_IATA_ERROR = "That IATA code is already in use. Check the airport code."

function publishTrace(traceId: string | undefined, event: string, details: Record<string, unknown> = {}) {
  if (traceId) console.info(`[Destination publish] ${traceId} ${event}`, details)
}

export type AdminDestinationPage = {
  id: string
  pageType: DestinationPageType
  lifecycleState: "draft" | "published" | "archived"
  bookingAvailable: boolean
  featured: boolean
  hasUnpublishedChanges: boolean
  slug: string
  officialName: string
  displayName: string
  iataCode: string
  serviceArea: string
  placeType: string
  placeGroupId: string
  primaryParentId: string
  aliases: string[]
  coveredLocalities: AdminCoveredLocality[]
  googlePlaceId: string
  address: string
  latitude: number
  longitude: number
  updatedAt: string
  draftUpdatedAt: string
  draft: {
    seoTitle: string
    metaDescription: string
    h1: string
    content: DestinationContentDocument
  }
  terminals: AdminTerminal[]
  relatedDestinations: AdminRelatedDestination[]
}

export type AdminCoveredLocality = { id?: string; name: string; localityType: string; notes: string }
export type AdminPlaceGroup = { id: string; name: string }
export type AdminParentPlace = { id: string; displayName: string }

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
  kind?: "related_route" | "supported_airport" | "nearby_place"
  sortOrder?: number
  bookingAvailable?: boolean
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

export type SaveAdminDestinationPageInput = Omit<AdminDestinationPage, "id" | "lifecycleState" | "bookingAvailable" | "featured" | "hasUnpublishedChanges" | "updatedAt" | "draft" | "draftUpdatedAt" | "terminals"> & {
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
  page_type: DestinationPageType
  lifecycle_state: "draft" | "published" | "archived"
  booking_available: boolean
  featured: boolean
  slug: string | null
  official_name: string | null
  display_name: string | null
  iata_code: string | null
  service_area: string | null
  place_type: string | null
  place_group_id: string | null
  primary_parent_id: string | null
  google_place_id: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
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

function toPage(row: PageRow, draft: SnapshotRow | undefined, published: SnapshotRow | undefined, terminals: TerminalRow[], relatedDestinations: AdminRelatedDestination[] = [], aliases: string[] = [], coveredLocalities: AdminCoveredLocality[] = []): AdminDestinationPage {
  const policy = getDestinationPagePolicy(row.page_type)
  return {
    id: row.id,
    pageType: row.page_type,
    lifecycleState: row.lifecycle_state,
    bookingAvailable: row.booking_available,
    featured: row.featured,
    hasUnpublishedChanges: Boolean(draft && (!published || draft.created_at > published.created_at)),
    slug: row.slug ?? "",
    officialName: row.official_name ?? "",
    displayName: row.display_name ?? "",
    iataCode: row.iata_code ?? "",
    serviceArea: row.service_area ?? "",
    placeType: row.place_type ?? "",
    placeGroupId: row.place_group_id ?? "",
    primaryParentId: row.primary_parent_id ?? "",
    aliases,
    coveredLocalities,
    googlePlaceId: row.google_place_id ?? "",
    address: row.address ?? "",
    latitude: row.latitude == null ? 0 : Number(row.latitude),
    longitude: row.longitude == null ? 0 : Number(row.longitude),
    updatedAt: row.updated_at,
    draftUpdatedAt: draft?.created_at ?? "",
    draft: {
      seoTitle: draft?.seo_title ?? policy.defaults.seoTitle(row.display_name ?? ""),
      metaDescription: draft?.meta_description ?? policy.defaults.metaDescription(row.display_name ?? ""),
    h1: draft?.h1 ?? policy.defaults.h1(row.display_name ?? ""),
    content: normalizeDestinationContent(draft?.content, draft?.h1 ?? policy.defaults.h1(row.display_name ?? ""), row.page_type),
    },
    terminals: terminals.sort((a, b) => a.sort_order - b.sort_order).map(toTerminal),
    relatedDestinations,
  }
}

async function loadPageRows(supabase: SupabaseClient, pageId?: string, traceId?: string): Promise<AdminDestinationPage[]> {
  const startedAt = Date.now()
  publishTrace(traceId, "Loading Destination Page record.", { pageId })
  let pageQuery = supabase.from("destination_pages").select("*").order("updated_at", { ascending: false })
  if (pageId) pageQuery = pageQuery.eq("id", pageId)

  const { data: pages, error: pageError } = await pageQuery
  if (pageError) throw pageError
  if (!pages?.length) return []
  publishTrace(traceId, "Destination Page record loaded.", { pageCount: pages.length, elapsedMs: Date.now() - startedAt })

  const ids = (pages as PageRow[]).map((page) => page.id)
  const relatedDataStartedAt = Date.now()
  publishTrace(traceId, "Loading Draft, terminal, alias, and locality records.", { pageCount: ids.length })
  const [{ data: snapshots, error: snapshotError }, { data: terminals, error: terminalError }, { data: aliases, error: aliasError }, { data: localities, error: localityError }] = await Promise.all([
    supabase.from("destination_page_snapshots").select("id, page_id, snapshot_kind, seo_title, meta_description, h1, content, created_at").in("page_id", ids),
    supabase.from("destination_page_terminals").select("id, page_id, display_name, address, latitude, longitude, sort_order, is_primary").in("page_id", ids).order("sort_order"),
    supabase.from("destination_place_aliases").select("id, page_id, name, display_order").in("page_id", ids).order("display_order"),
    supabase.from("destination_covered_localities").select("id, page_id, name, locality_type, notes, display_order").in("page_id", ids).order("display_order"),
  ])
  if (snapshotError) throw snapshotError
  if (terminalError) throw terminalError
  if (aliasError) throw aliasError
  if (localityError) throw localityError
  publishTrace(traceId, "Draft, terminal, alias, and locality records loaded.", { snapshotCount: snapshots?.length ?? 0, terminalCount: terminals?.length ?? 0, aliasCount: aliases?.length ?? 0, localityCount: localities?.length ?? 0, elapsedMs: Date.now() - relatedDataStartedAt })

  const snapshotRows = (snapshots ?? []) as SnapshotRow[]
  const terminalRows = (terminals ?? []) as TerminalRow[]
  const result = (pages as PageRow[]).map((page) => toPage(
    page,
    snapshotRows.find((snapshot) => snapshot.id === page.current_draft_snapshot_id),
    snapshotRows.find((snapshot) => snapshot.id === page.current_published_snapshot_id),
    terminalRows.filter((terminal) => terminal.page_id === page.id),
    [],
    (aliases ?? []).filter((alias) => alias.page_id === page.id).map((alias) => alias.name as string),
    (localities ?? []).filter((locality) => locality.page_id === page.id).map((locality) => ({ id: locality.id as string, name: locality.name as string, localityType: locality.locality_type as string, notes: (locality.notes as string | null) ?? "" })),
  ))
  for (const page of result) {
    const relationshipStartedAt = Date.now()
    publishTrace(traceId, "Loading related Destination Pages.", { pageId: page.id })
    const related = await listRelatedDestinations(page.id)
    publishTrace(traceId, "Related Destination Pages loaded.", { relatedCount: related.length, elapsedMs: Date.now() - relationshipStartedAt })
    const managedKinds = page.pageType === "place" ? new Set(["supported_airport", "nearby_place"]) : new Set(["related_route"])
    page.relatedDestinations = related.filter((item) => managedKinds.has(item.kind)).map((item) => ({ ...item, reverseHeading: item.reverseHeading ?? "", reverseDescription: item.reverseDescription ?? "" }))
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

export async function listPlaceIdentityOptions(): Promise<{ groups: AdminPlaceGroup[]; parents: AdminParentPlace[] }> {
  const supabase = getSupabase()
  if (!supabase) return { groups: [], parents: [] }
  const [{ data: groups, error: groupError }, { data: parents, error: parentError }] = await Promise.all([
    supabase.from("destination_place_groups").select("id, name").eq("active", true).order("display_order").order("name"),
    supabase.from("destination_pages").select("id, display_name").eq("page_type", "place").neq("lifecycle_state", "archived").order("display_name"),
  ])
  if (groupError || parentError) throw groupError ?? parentError
  return {
    groups: (groups ?? []).map((group) => ({ id: group.id as string, name: group.name as string })),
    parents: (parents ?? []).map((parent) => ({ id: parent.id as string, displayName: (parent.display_name as string | null) ?? "Unnamed Place" })),
  }
}

function validationError(input: SaveAdminDestinationPageInput): string | null {
  const policy = getDestinationPagePolicy(input.pageType)
  if (input.pageType === "airport" && input.iataCode.trim() && !/^[A-Z]{3}$/.test(input.iataCode.trim())) return "IATA code must be exactly three uppercase letters."
  if (input.slug.trim() && !policy.slug.isValid(input.slug.trim())) return input.pageType === "place" ? "Use a short lowercase Place Slug with words separated by hyphens." : "Use a lowercase slug ending in -airport-taxi."
  if (input.pageType === "place") {
    if (input.iataCode || input.terminals.length) return "Place Pages cannot have IATA codes or Airport Terminals."
    if (!input.placeType) return "Choose a Place type before saving this Draft."
    if (!input.placeGroupId) return "Choose one Place Group before saving this Draft."
    const conflict = findPlaceIdentityConflict({ names: [input.displayName, input.officialName], aliases: input.aliases, coveredLocalities: input.coveredLocalities.map((item) => item.name) })
    if (conflict) return `“${conflict}” is used more than once in this Place identity.`
    if (input.coveredLocalities.some((item) => !item.name.trim() || !item.localityType.trim())) return "Every Covered Locality needs a name and locality type."
    const contentError = validateDestinationContent(input.content, input.h1?.trim() || getDestinationPagePolicy(input.pageType).defaults.h1(input.displayName.trim()), input.pageType)
    if (contentError) return contentError
    return null
  }
  const terminals = input.terminals.filter((terminal) => terminal.address.trim() || terminal.displayName.trim() !== "Main Terminal")
  if (terminals.filter((terminal) => terminal.isPrimary).length > 1) return "Select only one primary Airport Terminal."
  for (const terminal of terminals) {
    if (!terminal.displayName.trim() || !terminal.address.trim()) return "Every Airport Terminal needs a name and address."
    if (!Number.isFinite(terminal.latitude) || terminal.latitude < -90 || terminal.latitude > 90 || !Number.isFinite(terminal.longitude) || terminal.longitude < -180 || terminal.longitude > 180) {
      return "Every Airport Terminal needs valid latitude and longitude values."
    }
  }
  if (input.relatedDestinations.some((item) => item.pageId === input.id)) return "An Airport Page cannot relate to itself."
  if (input.relatedDestinations.some((item) => !item.pageId || !item.heading.trim() || !item.description.trim() || !item.reverseHeading.trim() || !item.reverseDescription.trim())) return "Every Related Route needs both directional headings and descriptions."
  const contentError = validateDestinationContent(input.content, input.h1?.trim() || getDestinationPagePolicy(input.pageType).defaults.h1(input.displayName.trim()), input.pageType)
  if (contentError) return contentError
  return null
}

function databaseErrorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const databaseError = error as { message?: unknown; details?: unknown; code?: unknown }
    return [databaseError.message, databaseError.details, databaseError.code].filter((value): value is string => typeof value === "string").join(" ")
  }
  return String(error)
}

export function friendlyDatabaseError(error: unknown): string {
  const message = databaseErrorText(error)
  if (message.includes("destination_pages_slug_key") || message.includes("duplicate key") && message.includes("slug")) return DUPLICATE_SLUG_ERROR
  if (message.includes("destination_pages_iata_code_key") || message.includes("duplicate key") && message.includes("iata")) return DUPLICATE_IATA_ERROR
  if (message.includes("Ambiguous active Place identity")) return "That Place name, alias, or Covered Locality is already used by another active Place."
  if (message.includes("Primary Parent relationship cannot form a cycle")) return "Choose a Primary Parent that does not create a loop."
  if (message.toLowerCase().includes("duplicate key")) return "This conflicts with an existing Destination Page. Check the identity fields."
  return "The Destination Page could not be saved. Please check the fields and try again."
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
  if (!input.relatedDestinations.length && input.pageType === "airport") return null
  const ids = input.relatedDestinations.map((item) => item.pageId)
  if (new Set(ids).size !== ids.length) return "Each Related Route can be selected only once."
  const { data, error } = ids.length ? await supabase.from("destination_pages").select("id, page_type, lifecycle_state").in("id", ids) : { data: [], error: null }
  if (error || (data ?? []).length !== ids.length) return "Every relationship must connect an existing page."
  const pages = new Map((data ?? []).map((page) => [page.id as string, page]))
  if (input.relatedDestinations.some((item) => {
    const page = pages.get(item.pageId)
    const expectedType = item.kind === "nearby_place" ? "place" : "airport"
    return !page || page.page_type !== expectedType || page.lifecycle_state !== "published"
  })) return input.pageType === "place" ? "Supported Airports and Nearby Places must be Published Pages of the correct type." : "Related Routes must connect Published Airport Pages."
  if (input.pageType === "place") {
    const { count, error: countError } = await supabase.from("destination_pages").select("id", { count: "exact", head: true }).eq("page_type", "place").eq("lifecycle_state", "published").neq("id", input.id ?? "00000000-0000-0000-0000-000000000000")
    if (countError) return "Nearby Place availability could not be checked."
    const errors = validatePlaceRelationships({
      supportedAirports: input.relatedDestinations.filter((item) => item.kind === "supported_airport").flatMap((item) => {
        const page = pages.get(item.pageId)
        return page ? [{ pageId: item.pageId, pageType: page.page_type as DestinationPageType, lifecycleState: page.lifecycle_state as "draft" | "published" | "archived", bookingAvailable: true }] : []
      }),
      nearbyPlaces: input.relatedDestinations.filter((item) => item.kind === "nearby_place").map((item) => item.pageId),
      validNearbyCandidateCount: count ?? 0,
    })
    if (errors.length) return errors[0]
  }
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
    placeType: input.placeType.trim(),
    placeGroupId: input.placeGroupId.trim(),
    primaryParentId: input.primaryParentId.trim(),
    aliases: input.aliases.map((alias) => alias.trim().replace(/\s+/g, " ")).filter(Boolean),
    coveredLocalities: input.coveredLocalities.map((locality) => ({ ...locality, name: locality.name.trim().replace(/\s+/g, " "), localityType: locality.localityType.trim(), notes: locality.notes.trim() })),
    googlePlaceId: input.googlePlaceId.trim(),
    address: input.address.trim(),
    terminals: input.pageType === "place" ? [] : input.terminals.filter((terminal) => terminal.address.trim() || terminal.displayName.trim() !== "Main Terminal").map((terminal, index) => ({ ...terminal, displayName: terminal.displayName.trim(), address: terminal.address.trim(), sortOrder: index })),
  }
  const error = validationError(normalized)
  if (error) return { ok: false, error }
  const [{ data: duplicateSlugs, error: duplicateSlugError }, { data: duplicateIataCodes, error: duplicateIataError }] = await Promise.all([
    supabase.from("destination_pages").select("id").eq("slug", normalized.slug),
    supabase.from("destination_pages").select("id").eq("iata_code", normalized.iataCode),
  ])
  if (duplicateSlugError) return { ok: false, error: friendlyDatabaseError(duplicateSlugError) }
  if (duplicateIataError) return { ok: false, error: friendlyDatabaseError(duplicateIataError) }
  if (duplicateSlugs?.some((row) => row.id !== normalized.id)) return { ok: false, error: normalized.pageType === "place" ? DUPLICATE_PLACE_SLUG_ERROR : DUPLICATE_SLUG_ERROR }
  if (normalized.pageType === "airport" && duplicateIataCodes?.some((row) => row.id !== normalized.id)) return { ok: false, error: DUPLICATE_IATA_ERROR }
  if (normalized.pageType === "place" && normalized.primaryParentId) {
    const { data: parentRows, error: parentError } = await supabase.from("destination_pages").select("id, primary_parent_id").eq("page_type", "place")
    if (parentError) return { ok: false, error: "The Primary Parent could not be checked." }
    const parents = new Map((parentRows ?? []).map((row) => [row.id as string, row.primary_parent_id as string | null]))
    if (wouldCreateParentCycle(normalized.id ?? "new-place", normalized.primaryParentId, parents)) return { ok: false, error: "Choose a Primary Parent that does not create a loop." }
  }
  const policy = getDestinationPagePolicy(normalized.pageType)
  const content = normalized.content ?? normalizeDestinationContent(undefined, normalized.h1?.trim() || policy.defaults.h1(normalized.displayName), normalized.pageType)
  const reusableContentError = await validateReusableContent(content)
  if (reusableContentError) return { ok: false, error: reusableContentError }
  const imageError = await validateSavedImages(supabase, content, normalized.relatedDestinations.flatMap((item) => [item.image, item.reverseImage].filter((image): image is DestinationImageReference => Boolean(image))))
  if (imageError) return { ok: false, error: imageError }
  const relatedError = await validateRelatedDestinations(supabase, normalized)
  if (relatedError) return { ok: false, error: relatedError }

  let pageId = normalized.id
  try {
    if (pageId) {
      const hasLocation = Boolean(normalized.googlePlaceId && normalized.address)
      const pageValues = {
        slug: normalized.slug || null,
        official_name: normalized.officialName || null,
        display_name: normalized.displayName || null,
        iata_code: normalized.iataCode || null,
        service_area: normalized.serviceArea || null,
        place_type: normalized.pageType === "place" ? normalized.placeType || null : null,
        place_group_id: normalized.pageType === "place" ? normalized.placeGroupId || null : null,
        primary_parent_id: normalized.pageType === "place" ? normalized.primaryParentId || null : null,
        google_place_id: hasLocation ? normalized.googlePlaceId : null,
        address: hasLocation ? normalized.address : null,
        latitude: hasLocation ? normalized.latitude : null,
        longitude: hasLocation ? normalized.longitude : null,
      }
      const { error: updateError } = await supabase.from("destination_pages").update({
        ...pageValues,
        content_schema_version: DESTINATION_CONTENT_SCHEMA_VERSION,
        updated_at: new Date().toISOString(),
      }).eq("id", pageId).eq("page_type", normalized.pageType)
      if (updateError) throw updateError
    } else {
      const hasLocation = Boolean(normalized.googlePlaceId && normalized.address)
      const { data, error: insertError } = await supabase.from("destination_pages").insert({
        page_type: normalized.pageType,
        lifecycle_state: "draft",
        slug: normalized.slug || null,
        official_name: normalized.officialName || null,
        display_name: normalized.displayName || null,
        iata_code: normalized.iataCode || null,
        service_area: normalized.serviceArea || null,
        place_type: normalized.pageType === "place" ? normalized.placeType || null : null,
        place_group_id: normalized.pageType === "place" ? normalized.placeGroupId || null : null,
        primary_parent_id: normalized.pageType === "place" ? normalized.primaryParentId || null : null,
        google_place_id: hasLocation ? normalized.googlePlaceId : null,
        address: hasLocation ? normalized.address : null,
        latitude: hasLocation ? normalized.latitude : null,
        longitude: hasLocation ? normalized.longitude : null,
        content_schema_version: DESTINATION_CONTENT_SCHEMA_VERSION,
      }).select("id").single()
      if (insertError || !data) throw insertError ?? new Error("Destination Page could not be created")
      pageId = data.id
    }

    const { data: currentPage, error: currentPageError } = await supabase.from("destination_pages").select("current_draft_snapshot_id").eq("id", pageId).single()
    if (currentPageError) throw currentPageError
    const snapshot = {
      page_id: pageId,
      snapshot_kind: "draft",
      created_at: new Date().toISOString(),
      seo_title: normalized.seoTitle?.trim() || policy.defaults.seoTitle(normalized.displayName),
      meta_description: normalized.metaDescription?.trim() || policy.defaults.metaDescription(normalized.displayName),
      h1: normalized.h1?.trim() || policy.defaults.h1(normalized.displayName),
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

    if (normalized.pageType === "place") {
      const { error: supportError } = await supabase.rpc("replace_destination_place_support", {
        p_page_id: pageId,
        p_aliases: normalized.aliases.map((name) => ({ name })),
        p_localities: normalized.coveredLocalities,
      })
      if (supportError) throw supportError
    }

    const managedKinds = normalized.pageType === "place" ? ["supported_airport", "nearby_place"] : ["related_route"]
    const { error: deleteRelationshipsError } = await supabase.from("destination_page_relationships").delete().or(`page_a_id.eq.${pageId},page_b_id.eq.${pageId}`).in("relationship_kind", managedKinds)
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
        relationship_kind: related.kind ?? "related_route",
        place_display_order: related.sortOrder ?? 0,
      })
      if (relationshipError) throw relationshipError
    }

    const saved = await loadPageRows(supabase, pageId)
    if (!saved[0]) return { ok: false, error: "The Destination Page was saved but could not be reloaded." }
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

export type PublishOverride = { warningSetHash: string; warnings: PublishWarning[]; expectedDraftUpdatedAt?: string }
export type PublishResult = { ok: true; slug: string } | { ok: false; error: string; blockers?: { code: string; message: string }[]; warnings?: PublishWarning[]; warningSetHash?: string }
export type PublishReview = {
  ok: true
  pageId: string
  pageType: DestinationPageType
  displayName: string
  slug: string
  draftUpdatedAt: string
  blockers: { code: string; message: string }[]
  warnings: PublishWarning[]
  warningSetHash: string
} | { ok: false; error: string }
export type RestoreResult = { ok: true; page: AdminDestinationPage } | { ok: false; error: string }
export type LifecycleResult = { ok: true } | { ok: false; error: string }

export async function promoteCoveredLocalityToPlace(input: { parentPageId: string; localityId: string; slug: string; placeType: string; placeGroupId: string }): Promise<{ ok: true; pageId: string } | { ok: false; error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: "Destination Pages are not connected to the database." }
  const { data, error } = await supabase.rpc("promote_covered_locality_to_place", {
    p_parent_page_id: input.parentPageId, p_locality_id: input.localityId, p_slug: input.slug,
    p_place_type: input.placeType, p_place_group_id: input.placeGroupId, p_promoted_by: "admin",
  })
  return error || !data ? { ok: false, error: error?.message ?? "The Covered Locality could not be promoted." } : { ok: true, pageId: data as string }
}

export async function deleteAdminDestinationDraft(pageId: string): Promise<LifecycleResult> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }
  const { error } = await supabase.rpc("delete_destination_draft", { p_page_id: pageId, p_deleted_by: "admin" })
  return error ? { ok: false, error: error.message.includes("Published Page") ? "A Published Page cannot be deleted." : "The Draft could not be deleted." } : { ok: true }
}

export async function archiveAdminDestinationPage(pageId: string, replacementSlug: string): Promise<LifecycleResult> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }
  const page = await getAdminDestinationPage(pageId)
  if (!page) return { ok: false, error: "Destination Page not found." }
  const fallback = page.pageType === "place" ? "destinations" : "airport-transfers"
  const target = replacementSlug.trim() || fallback
  const { error } = await supabase.rpc("archive_destination_page", { p_page_id: pageId, p_replacement_slug: target, p_archived_by: "admin" })
  if (!error) return { ok: true }
  if (error.message.includes("Replacement destination")) return { ok: false, error: `Choose a Published ${page.pageType === "place" ? "Place" : "Airport"} Page as the replacement.` }
  return { ok: false, error: error.message.includes("Published Page") ? "Only a Published Page can be archived." : `The ${page.pageType === "place" ? "Place" : "Airport"} Page could not be archived.` }
}

export async function setAdminBookingAvailability(pageId: string, available: boolean): Promise<LifecycleResult> {
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }
  const { error } = await supabase.rpc("set_destination_booking_availability", { p_page_id: pageId, p_available: available, p_changed_by: "admin" })
  return error ? { ok: false, error: "Only a Published Page can change booking availability." } : { ok: true }
}

async function listQualityPages(supabase: SupabaseClient, traceId?: string): Promise<ExistingQualityPage[]> {
  const startedAt = Date.now()
  publishTrace(traceId, "Loading existing Pages for duplicate and quality checks.")
  const [{ data: pages, error: pageError }, { data: snapshots, error: snapshotError }, { data: aliases, error: aliasError }, { data: localities, error: localityError }] = await Promise.all([
    supabase.from("destination_pages").select("id, slug, iata_code, page_type, display_name, official_name, lifecycle_state").neq("lifecycle_state", "archived"),
    supabase.from("destination_page_snapshots").select("page_id, snapshot_kind, seo_title, meta_description, content").in("snapshot_kind", ["draft", "published"]),
    supabase.from("destination_place_aliases").select("page_id, name"),
    supabase.from("destination_covered_localities").select("page_id, name"),
  ])
  if (pageError || snapshotError || aliasError || localityError) throw pageError ?? snapshotError ?? aliasError ?? localityError
  publishTrace(traceId, "Existing Pages loaded for duplicate and quality checks.", { pageCount: pages?.length ?? 0, snapshotCount: snapshots?.length ?? 0, aliasCount: aliases?.length ?? 0, localityCount: localities?.length ?? 0, elapsedMs: Date.now() - startedAt })
  const pageRows = (pages ?? []) as { id: string; slug: string; iata_code?: string; page_type: DestinationPageType; display_name?: string; official_name?: string }[]
  const snapshotRows = (snapshots ?? []) as { page_id: string; snapshot_kind: "draft" | "published"; seo_title: string; meta_description: string; content: unknown }[]
  return pageRows.flatMap((page) => snapshotRows.filter((snapshot) => snapshot.page_id === page.id).map((snapshot) => {
    const content = normalizeDestinationContent(snapshot.content, `${page.slug} Airport Taxi`, page.page_type)
    return { id: page.id, slug: page.slug, pageType: page.page_type, iataCode: page.iata_code, displayName: page.display_name, officialName: page.official_name, aliases: (aliases ?? []).filter((alias) => alias.page_id === page.id).map((alias) => alias.name as string), coveredLocalities: (localities ?? []).filter((locality) => locality.page_id === page.id).map((locality) => locality.name as string), seoTitle: snapshot.seo_title, metaDescription: snapshot.meta_description, content, heroImageAssetId: content.hero.image?.assetId }
  }))
}

async function getPublishReview(pageId: string, traceId?: string): Promise<PublishReview> {
  publishTrace(traceId, "Final server review started.", { pageId })
  const supabase = getSupabase()
  if (!supabase || !pageId) return { ok: false, error: "Destination Pages are not connected to the database." }
  const pageStartedAt = Date.now()
  publishTrace(traceId, "Loading this Draft for final server review.")
  const pages = await loadPageRows(supabase, pageId, traceId)
  const page = pages[0] ?? null
  if (!page) return { ok: false, error: "Destination Page not found." }
  publishTrace(traceId, "This Draft loaded for final server review.", { pageType: page.pageType, slug: page.slug, elapsedMs: Date.now() - pageStartedAt })
  const existingPages = await listQualityPages(supabase, traceId)
  const validNearbyCandidateCount = new Set(existingPages.filter((item) => item.pageType === "place" && item.id !== pageId).map((item) => item.id)).size
  const readiness = { ...page, pageType: page.pageType, seoTitle: page.draft.seoTitle, metaDescription: page.draft.metaDescription, h1: page.draft.h1, content: page.draft.content, existingPages, validNearbyCandidateCount }
  const blockers = getPublishBlockers(readiness)
  const warnings = getPublishWarnings(readiness)
  const warningSetHash = getWarningSetHash(warnings)
  const reusableContentStartedAt = Date.now()
  publishTrace(traceId, "Checking selected shared content.")
  const reusableContentError = await validateReusableContent(page.draft.content)
  publishTrace(traceId, "Selected shared content checked.", { valid: !reusableContentError, elapsedMs: Date.now() - reusableContentStartedAt })
  if (reusableContentError) blockers.push({ code: "invalid-reusable-content", message: reusableContentError })
  const imageStartedAt = Date.now()
  publishTrace(traceId, "Checking selected media assets.")
  const imageError = await validateSavedImages(supabase, page.draft.content, page.relatedDestinations.flatMap((item) => [item.image, item.reverseImage].filter((image): image is DestinationImageReference => Boolean(image))))
  publishTrace(traceId, "Selected media assets checked.", { valid: !imageError, elapsedMs: Date.now() - imageStartedAt })
  if (imageError) blockers.push({ code: "invalid-media", message: imageError })
  const relatedStartedAt = Date.now()
  publishTrace(traceId, "Checking related Destination Pages.")
  const relatedError = await validateRelatedDestinations(supabase, { ...page, seoTitle: page.draft.seoTitle, metaDescription: page.draft.metaDescription, h1: page.draft.h1, content: page.draft.content })
  publishTrace(traceId, "Related Destination Pages checked.", { valid: !relatedError, elapsedMs: Date.now() - relatedStartedAt })
  if (relatedError) blockers.push({ code: "invalid-relationships", message: relatedError })
  return { ok: true, pageId, pageType: page.pageType, displayName: page.displayName, slug: page.slug, draftUpdatedAt: page.draftUpdatedAt, blockers, warnings, warningSetHash }
}

export async function reviewAdminDestinationPage(pageId: string): Promise<PublishReview> {
  return getPublishReview(pageId)
}

export async function publishAdminDestinationPage(pageId: string, override?: PublishOverride, traceId?: string): Promise<PublishResult> {
  const trace = traceId ? `[Destination publish] ${traceId}` : "[Destination publish]"
  console.info(`${trace} Database publish flow started.`, { pageId, warningOverride: Boolean(override) })
  const supabase = getSupabase()
  if (!supabase || !pageId) {
    console.error(`${trace} Database publish flow stopped: database connection or page ID is missing.`)
    return { ok: false, error: "Destination Pages are not connected to the database." }
  }
  const review = await getPublishReview(pageId, traceId)
  if (!review.ok) {
    console.error(`${trace} Server review failed.`, { error: review.error })
    return review
  }
  console.info(`${trace} Server review completed.`, { pageType: review.pageType, slug: review.slug, blockerCount: review.blockers.length, warningCount: review.warnings.length, draftUpdatedAt: review.draftUpdatedAt })
  if (review.blockers.length) {
    console.warn(`${trace} Database publish flow stopped: blockers found.`, review.blockers)
    return { ok: false, error: review.blockers.map((item) => item.message).join(" "), blockers: review.blockers }
  }
  if (override?.expectedDraftUpdatedAt && override.expectedDraftUpdatedAt !== review.draftUpdatedAt) {
    console.warn(`${trace} Database publish flow stopped: Draft changed after review.`)
    return { ok: false, error: "This Draft changed after it was reviewed. Refresh the list and review it again." }
  }
  if (review.warnings.length && (!override || override.warningSetHash !== review.warningSetHash || JSON.stringify(override.warnings) !== JSON.stringify(review.warnings))) {
    console.info(`${trace} Database publish flow paused: warning acceptance is required.`, review.warnings)
    return { ok: false, error: override ? "The quality warnings changed. Review them before publishing." : "Review the quality warnings before publishing.", warnings: review.warnings, warningSetHash: review.warningSetHash }
  }
  console.info(`${trace} Calling the database publish transaction.`)
  const { data, error } = await supabase.rpc("publish_destination_page", { p_page_id: pageId, p_published_by: "admin", p_override: override ? { warningCodes: review.warnings.map((warning) => warning.code), warningReasons: review.warnings.map((warning) => warning.reason) } : {} })
  if (error) {
    console.error(`${trace} Database publish transaction failed.`, { message: error.message })
    const message = error.message.toLowerCase().includes("duplicate") ? "That SEO title, Airport Slug, or IATA code conflicts with another Published Page." : "Publish failed. The previous public Published Snapshot is unchanged."
    return { ok: false, error: message }
  }
  console.info(`${trace} Database publish transaction completed.`, { slug: (data as { slug: string }).slug })
  return { ok: true, slug: (data as { slug: string }).slug }
}

export type BulkPublishSelection = {
  pageId: string
  expectedDraftUpdatedAt: string
  override?: PublishOverride
}

export type BulkPublishReportItem = {
  pageId: string
  displayName: string
  slug: string
  status: "published" | "skipped" | "failed"
  reason: string
  fixLink?: string
}

export async function bulkPublishPlaceDrafts(selections: BulkPublishSelection[]): Promise<BulkPublishReportItem[]> {
  const uniqueSelections = [...new Map(selections.map((selection) => [selection.pageId, selection])).values()]
  const report: BulkPublishReportItem[] = []
  for (const selection of uniqueSelections) {
    const page = await getAdminDestinationPage(selection.pageId)
    const displayName = page?.displayName || "Unknown Place Page"
    const slug = page?.slug || ""
    const fixLink = `/admin/destination-pages/${selection.pageId}`
    if (!page || page.pageType !== "place") {
      report.push({ pageId: selection.pageId, displayName, slug, status: "skipped", reason: "Only Place Pages can be bulk published.", fixLink })
      continue
    }
    if (page.lifecycleState === "archived" || (page.lifecycleState === "published" && !page.hasUnpublishedChanges)) {
      report.push({ pageId: selection.pageId, displayName, slug, status: "skipped", reason: "This Place has no unpublished changes to publish.", fixLink })
      continue
    }
    if (selection.expectedDraftUpdatedAt !== page.draftUpdatedAt) {
      report.push({ pageId: selection.pageId, displayName, slug, status: "skipped", reason: "This Draft changed after selection. Review the newer Draft before publishing.", fixLink })
      continue
    }
    const result = await publishAdminDestinationPage(selection.pageId, selection.override ? { ...selection.override, expectedDraftUpdatedAt: selection.expectedDraftUpdatedAt } : { warningSetHash: "", warnings: [], expectedDraftUpdatedAt: selection.expectedDraftUpdatedAt })
    if (result.ok) report.push({ pageId: selection.pageId, displayName, slug: result.slug, status: "published", reason: "Published successfully." })
    else report.push({ pageId: selection.pageId, displayName, slug, status: result.blockers?.length || result.warnings?.length ? "skipped" : "failed", reason: result.error, fixLink })
  }
  return report
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
