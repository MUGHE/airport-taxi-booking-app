import { createClient } from "@supabase/supabase-js"
import { createPublishedAirportPagePresentation, createRouteBookingLinks, type AirportPagePresentation, type AirportPageTerminal, type PublishedAirportPageContent } from "@/lib/airport-page-data"
import type { AdminDestinationPage } from "@/lib/admin-destination-pages"
import { VEHICLE_CLASSES } from "@/lib/fleet"
import { getPublishedPrimaryTerminals, listRelatedDestinations } from "@/lib/related-destinations"

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

type DestinationRedirectRow = {
  source_slug: string
  target_slug: string
}

export type DestinationPageLifecycle = "draft" | "published" | "archived" | "missing"

export type PublishedAirportPage = {
  presentation: AirportPagePresentation
  metadata: { title: string; description: string; canonical: string }
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

const LEGACY_AIRPORT_REDIRECTS = new Map([
  ["heathrow", "heathrow-airport-taxi"],
  ["gatwick", "gatwick-airport-taxi"],
  ["stansted", "stansted-airport-taxi"],
  ["luton", "luton-airport-taxi"],
  ["london-city", "london-city-airport-taxi"],
  ["southend", "southend-airport-taxi"],
])

export async function getPublishedAirportRedirect(slug: string): Promise<string | null> {
  const legacyTarget = LEGACY_AIRPORT_REDIRECTS.get(slug)
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

    const [{ data: targetPage, error: targetError }, { data: chainedRedirect, error: chainError }] = await Promise.all([
      supabase.from("destination_pages").select("id").eq("slug", redirect.target_slug).eq("page_type", "airport").eq("lifecycle_state", "published").maybeSingle(),
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
      airportFaqs: ((snapshotRow.content as Record<string, unknown>).airportFaqs ?? (snapshotRow.content as PublishedAirportPageContent).faqs) as PublishedAirportPageContent["airportFaqs"],
    }
    const rawContent = snapshotRow.content as Record<string, unknown>
    const hero = rawContent.hero as { image?: unknown } | undefined
    content.heroImage = hero?.image as PublishedAirportPageContent["heroImage"]
    content.sections = (rawContent.sections ?? []) as PublishedAirportPageContent["sections"]
    content.finalCta = (rawContent.finalCta ?? { heading: "Ready to book your airport transfer?", body: [] }) as PublishedAirportPageContent["finalCta"]

    const related = await listRelatedDestinations(pageRow.id)
    const relatedTerminals = await getPublishedPrimaryTerminals(related.map((item) => item.pageId))
    const primary = terminals.find((terminal) => terminal.isPrimary) ?? terminals[0]
    const relatedDestinations = related.flatMap((item) => {
      const relatedTerminal = relatedTerminals.get(item.pageId)
      if (!primary || !relatedTerminal) return []
      return [{ id: item.id, displayName: item.displayName, href: `/airport-transfers/${item.slug}`, heading: item.heading, description: item.description, image: item.image?.secureUrl, bookingLinks: createRouteBookingLinks(primary, { name: relatedTerminal.display_name, latitude: Number(relatedTerminal.latitude), longitude: Number(relatedTerminal.longitude) }) }]
    })

    return {
      presentation: createPublishedAirportPagePresentation({
        shortName: pageRow.display_name,
        terminals,
        content,
        vehicles: VEHICLE_CLASSES,
        relatedDestinations,
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
