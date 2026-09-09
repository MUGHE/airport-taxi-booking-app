import { createClient } from "@supabase/supabase-js"
import { createPublishedAirportPagePresentation, createRouteBookingLinks, type AirportPagePresentation, type AirportPageTerminal, type PublishedAirportPageContent } from "@/lib/airport-page-data"
import type { AdminDestinationPage } from "@/lib/admin-destination-pages"
import { VEHICLE_CLASSES } from "@/lib/fleet"
import { getPublishedPrimaryTerminals, listRelatedDestinations } from "@/lib/related-destinations"
import { LEGACY_AIRPORT_REDIRECTS } from "@/lib/legacy-airport-redirects.mjs"
import { readPublishedAirportFacts, type PublishedAirportFacts } from "@/lib/published-airport-facts"
import { cacheSafePublishedAirportPage, getSafePublishedAirportPage } from "@/lib/public-airport-page-cache"

type DestinationPageRow = {
  id: string
  current_published_snapshot_id: string | null
  published_slug: string
  booking_available: boolean
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

type DestinationRedirectRow = {
  source_slug: string
  target_slug: string
}

type LegacySnapshotMediaRow = {
  destination_media_assets: {
    id: string
    public_id: string
    delivery_url: string
    width: number
    height: number
    format: string
    alt_text: string
  } | null
}

export type DestinationPageLifecycle = "draft" | "published" | "archived" | "missing"

export type PublishedAirportPage = {
  presentation: AirportPagePresentation
  metadata: AirportPageSeo
  bookingAvailable: boolean
}

export type PublicAirportPageRead =
  | { status: "published" | "fallback"; page: PublishedAirportPage }
  | { status: "missing" | "unavailable" }

export type AirportPageSeo = {
  title: string
  description: string
  canonical: string
  socialImage: { url: string; alt: string }
  airport: PublishedAirportFacts
}

export async function createDraftAirportPagePresentation(page: AdminDestinationPage): Promise<AirportPagePresentation> {
  const terminals: AirportPageTerminal[] = page.terminals.map((terminal) => ({
    id: terminal.id ?? `${page.id}-${terminal.sortOrder}`,
    name: terminal.displayName,
    area: page.serviceArea,
    latitude: terminal.latitude,
    longitude: terminal.longitude,
    isPrimary: terminal.isPrimary,
  }))
  const primary = terminals.find((terminal) => terminal.isPrimary) ?? terminals[0]
  const relatedTerminals = await getPublishedPrimaryTerminals(page.relatedDestinations.map((item) => item.pageId))
  const relatedDestinations = page.relatedDestinations.flatMap((item) => {
    const relatedTerminal = relatedTerminals.get(item.pageId)
    if (!primary || !relatedTerminal) return []
    return [{ id: item.id ?? item.pageId, displayName: item.displayName, href: `/airport-transfers/${item.slug}`, heading: item.heading, description: item.description, image: item.image?.secureUrl, bookingLinks: createRouteBookingLinks(primary, { name: relatedTerminal.display_name, latitude: Number(relatedTerminal.latitude), longitude: Number(relatedTerminal.longitude) }) }]
  })
  const content = page.draft.content
  return createPublishedAirportPagePresentation({
    shortName: page.displayName,
    terminals,
    mapLocation: { placeId: page.googlePlaceId, address: page.address, latitude: page.latitude, longitude: page.longitude },
    content: {
      heading: content.hero.heading || page.draft.h1,
      intro: content.hero.body.map((block) => block.text),
      benefits: [
        { title: "Fixed, all-inclusive fare", description: "Your fare is calculated from your exact route and locked in at booking — no surge pricing, no surprise charges on arrival.", icon: "fare" },
        { title: "Flight tracking & meet & greet", description: "Your chauffeur tracks your flight and meets you at arrivals, so pickup adjusts automatically if your flight time changes.", icon: "flight" },
      ],
      faqs: content.airportFaqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
      serviceFacts: content.serviceFacts,
      globalFaqs: content.globalFaqs,
      airportFaqs: content.airportFaqs,
      reviews: content.reviews,
      sections: content.sections,
      heroImage: content.hero.image,
      finalCta: content.finalCta,
    },
    vehicles: VEHICLE_CLASSES,
    relatedDestinations,
  })
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const legacyAirportRedirects = new Map(LEGACY_AIRPORT_REDIRECTS)

export async function getPublishedAirportRedirect(slug: string): Promise<string | null> {
  const legacyTarget = legacyAirportRedirects.get(slug)
  const supabase = getSupabase()
  if (!supabase) return legacyTarget ?? null

  try {
    const { data, error } = await supabase
      .from("destination_page_redirects")
      .select("source_slug, target_slug")
      .eq("source_slug", slug)
      .maybeSingle()
    if (error || !data) return legacyTarget ?? null

    const redirect = data as DestinationRedirectRow
    if (redirect.source_slug === redirect.target_slug) return null
    if (redirect.target_slug === "airport-transfers") return redirect.target_slug

    const [{ data: targetPage, error: targetError }, { data: chainedRedirect, error: chainError }] = await Promise.all([
      supabase.from("destination_pages").select("id").eq("published_slug", redirect.target_slug).eq("page_type", "airport").eq("lifecycle_state", "published").maybeSingle(),
      supabase.from("destination_page_redirects").select("source_slug").eq("source_slug", redirect.target_slug).maybeSingle(),
    ])
    if (targetError || chainError || !targetPage || chainedRedirect) return null
    return redirect.target_slug
  } catch {
    return legacyTarget ?? null
  }
}

export async function getDestinationPageLifecycle(slug: string): Promise<DestinationPageLifecycle | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from("destination_pages")
      .select("lifecycle_state")
      .eq("slug", slug)
      .eq("page_type", "airport")
      .maybeSingle()
    if (error) return null
    if (!data) return "missing"
    return (data as { lifecycle_state: DestinationPageLifecycle }).lifecycle_state
  } catch {
    return null
  }
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
    && (!content.serviceFacts || Array.isArray(content.serviceFacts))
    && (!content.globalFaqs || Array.isArray(content.globalFaqs))
    && (!content.airportFaqs || Array.isArray(content.airportFaqs))
    && (!content.reviews || Array.isArray(content.reviews))
}

async function loadPublishedAirportPage(slug: string): Promise<{ status: "published" | "missing" | "unavailable"; page?: PublishedAirportPage }> {
  const supabase = getSupabase()
  if (!supabase) return { status: "unavailable" }

  try {
    const { data: page, error: pageError } = await supabase
      .from("destination_pages")
      .select("id, current_published_snapshot_id, published_slug, booking_available")
      .eq("published_slug", slug)
      .eq("page_type", "airport")
      .eq("lifecycle_state", "published")
      .maybeSingle()
    if (pageError) return { status: "unavailable" }
    if (!page) return { status: "missing" }

    const pageRow = page as DestinationPageRow
    if (!pageRow.current_published_snapshot_id) return { status: "unavailable" }

    const [{ data: snapshot, error: snapshotError }, { data: terminalRows, error: terminalError }, { data: legacyHero }] = await Promise.all([
      supabase.from("destination_page_snapshots").select("id, snapshot_kind, seo_title, meta_description, h1, content").eq("id", pageRow.current_published_snapshot_id).eq("page_id", pageRow.id).eq("snapshot_kind", "published").maybeSingle(),
      supabase.from("destination_page_terminals").select("id, display_name, address, latitude, longitude, sort_order, is_primary").eq("page_id", pageRow.id).order("sort_order"),
      supabase.from("destination_snapshot_media").select("destination_media_assets(id, public_id, delivery_url, width, height, format, alt_text)").eq("snapshot_id", pageRow.current_published_snapshot_id).eq("purpose", "hero").limit(1).maybeSingle(),
    ])
    if (snapshotError || terminalError || !snapshot || !isPublishedContent((snapshot as DestinationSnapshotRow).content)) return { status: "unavailable" }

    const snapshotRow = snapshot as DestinationSnapshotRow
    const rawContent = snapshotRow.content as Record<string, unknown>
    const airport = readPublishedAirportFacts(rawContent)
    if (!airport) return { status: "unavailable" }

    const terminals: AirportPageTerminal[] = (terminalRows as DestinationTerminalRow[]).map((terminal) => ({
      id: terminal.id,
      name: terminal.display_name,
      area: airport.serviceArea,
      latitude: Number(terminal.latitude),
      longitude: Number(terminal.longitude),
      isPrimary: terminal.is_primary,
    }))
    const content: PublishedAirportPageContent = {
      ...(snapshotRow.content as PublishedAirportPageContent),
      heading: snapshotRow.h1,
      airportFaqs: ((snapshotRow.content as Record<string, unknown>).airportFaqs ?? (snapshotRow.content as PublishedAirportPageContent).faqs) as PublishedAirportPageContent["airportFaqs"],
    }
    const hero = rawContent.hero as { image?: PublishedAirportPageContent["heroImage"] } | undefined
    const legacyHeroAsset = (legacyHero as LegacySnapshotMediaRow | null)?.destination_media_assets
    content.heroImage = hero?.image ?? (legacyHeroAsset ? {
      assetId: legacyHeroAsset.id,
      publicId: legacyHeroAsset.public_id,
      secureUrl: legacyHeroAsset.delivery_url,
      width: legacyHeroAsset.width,
      height: legacyHeroAsset.height,
      format: legacyHeroAsset.format,
      altText: legacyHeroAsset.alt_text,
    } : undefined)
    content.sections = (rawContent.sections ?? []) as PublishedAirportPageContent["sections"]
    content.finalCta = (rawContent.finalCta ?? { heading: "Ready to book your airport transfer?", body: [] }) as PublishedAirportPageContent["finalCta"]

    const heroImage = content.heroImage
    const related = await listRelatedDestinations(pageRow.id)
    const relatedTerminals = await getPublishedPrimaryTerminals(related.map((item) => item.pageId))
    const primary = terminals.find((terminal) => terminal.isPrimary) ?? terminals[0]
    const relatedDestinations = related.flatMap((item) => {
      const relatedTerminal = relatedTerminals.get(item.pageId)
      if (!primary || !relatedTerminal) return []
      return [{ id: item.id, displayName: item.displayName, href: `/airport-transfers/${item.slug}`, heading: item.heading, description: item.description, image: item.image?.secureUrl, bookingLinks: createRouteBookingLinks(primary, { name: relatedTerminal.display_name, latitude: Number(relatedTerminal.latitude), longitude: Number(relatedTerminal.longitude) }) }]
    })

    return { status: "published", page: {
      presentation: createPublishedAirportPagePresentation({
        shortName: airport.displayName,
        terminals,
        mapLocation: { placeId: airport.googlePlaceId, address: airport.address, latitude: airport.latitude, longitude: airport.longitude },
        content,
        vehicles: VEHICLE_CLASSES,
        relatedDestinations,
        bookingAvailable: pageRow.booking_available,
      }),
      metadata: {
        title: snapshotRow.seo_title,
        description: snapshotRow.meta_description,
        canonical: `/airport-transfers/${pageRow.published_slug}`,
        socialImage: heroImage
          ? { url: heroImage.secureUrl, alt: heroImage.altText }
          : { url: `/airport-transfers/${pageRow.published_slug.replace(/-airport-taxi$/, "")}.webp`, alt: `${airport.displayName} Airport transfer service` },
        airport,
      },
      bookingAvailable: pageRow.booking_available,
    } }
  } catch {
    return { status: "unavailable" }
  }
}

export async function readPublicAirportPage(slug: string): Promise<PublicAirportPageRead> {
  const loaded = await loadPublishedAirportPage(slug)
  if (loaded.status === "published" && loaded.page) {
    cacheSafePublishedAirportPage(slug, loaded.page)
    return { status: "published", page: loaded.page }
  }
  if (loaded.status === "unavailable") {
    const cached = getSafePublishedAirportPage(slug)
    if (cached) return { status: "fallback", page: cached }
  }
  if (loaded.status === "missing") return { status: "missing" }
  return { status: "unavailable" }
}

export async function getPublishedAirportPage(slug: string): Promise<PublishedAirportPage | null> {
  const result = await readPublicAirportPage(slug)
  return result.status === "published" || result.status === "fallback" ? result.page : null
}
