import { unstable_cache } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { VEHICLE_CLASSES } from "@/lib/fleet"
import { calculateDrivingRoute } from "@/lib/google-distance"
import { createRouteBookingLinks } from "@/lib/airport-page-data"
import {
  defaultDirectionText, defaultRouteFaqs, defaultRouteHeading, defaultRouteIntro, defaultRouteSeoDescription, defaultRouteSeoTitle,
  reverseRouteSlug, slugifyRoutePart,
  type RouteCustomText, type RouteEndpoint, type RouteFaq, type RoutePrice, type RouteStatus,
} from "@/lib/route-page-content"

// Route pages storage. Like the rest of the site this talks to Supabase with the service role key,
// so callers are responsible for authorisation (see lib/route-page-actions.ts).

/** Cache tag for public route pages; every route change clears it. */
export const ROUTE_PAGES_TAG = "route-pages"

type Result<T> = ({ ok: true } & T) | { ok: false; error: string }

type RouteRow = {
  id: string; endpoint_a_id: string; endpoint_b_id: string; slug: string; reverse_slug: string
  heading: string; intro: string; a_to_b_text: string; b_to_a_text: string; faqs: unknown
  seo_title: string; seo_description: string; prices: unknown; distance_miles: number | string | null; duration_minutes: number | null
  status: RouteStatus; published_at: string | null; created_at: string; updated_at: string
}

const ROUTE_COLUMNS = "id, endpoint_a_id, endpoint_b_id, slug, reverse_slug, heading, intro, a_to_b_text, b_to_a_text, faqs, seo_title, seo_description, prices, distance_miles, duration_minutes, status, published_at, created_at, updated_at"

export type AdminRoutePage = {
  id: string
  endpointAId: string
  endpointBId: string
  slug: string
  reverseSlug: string
  text: RouteCustomText
  prices: RoutePrice[]
  distanceMiles: number | null
  durationMinutes: number | null
  status: RouteStatus
  publishedAt: string | null
  updatedAt: string
}

export type RoutePageInput = {
  id?: string
  endpointAId: string
  endpointBId: string
  slug: string
  text: RouteCustomText
  prices: RoutePrice[]
  distanceMiles: number | null
  durationMinutes: number | null
}

export type RouteDirection = { from: RouteEndpoint; to: RouteEndpoint; text: string; bookHref: string }

export type RoutePagePresentation = {
  id: string
  slug: string
  a: RouteEndpoint
  b: RouteEndpoint
  heading: string
  intro: string
  directions: [RouteDirection, RouteDirection]
  distanceMiles: number | null
  durationMinutes: number | null
  fromFare: number | null
  /** The admin's price quotes, in the order they entered them. */
  fares: { key: string; name: string; note: string; image: string | null; capacity: number | null; luggage: number | null; fare: number }[]
  faqs: RouteFaq[]
  seoTitle: string
  seoDescription: string
  /** Other published routes that share a place with this one. */
  relatedRoutes: { slug: string; title: string }[]
}

export type PublicRoutePageRead =
  | { status: "published"; page: RoutePagePresentation }
  | { status: "redirect"; slug: string }
  | { status: "missing" | "unavailable" }

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const NOT_CONNECTED = "Route pages are not connected to the database."

function readFaqs(value: unknown): RouteFaq[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => item && typeof item === "object" && typeof item.question === "string" && typeof item.answer === "string" ? [{ question: item.question, answer: item.answer }] : [])
}

function readPrices(value: unknown): RoutePrice[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || typeof item.label !== "string") return []
    const price = Number(item.price)
    if (!Number.isFinite(price)) return []
    return [{ vehicleId: typeof item.vehicleId === "string" ? item.vehicleId : "", label: item.label, price, note: typeof item.note === "string" ? item.note : "" }]
  })
}

function toAdminRoute(row: RouteRow): AdminRoutePage {
  return {
    id: row.id,
    endpointAId: row.endpoint_a_id,
    endpointBId: row.endpoint_b_id,
    slug: row.slug,
    reverseSlug: row.reverse_slug,
    text: { heading: row.heading, intro: row.intro, aToBText: row.a_to_b_text, bToAText: row.b_to_a_text, seoTitle: row.seo_title, seoDescription: row.seo_description, faqs: readFaqs(row.faqs) },
    prices: readPrices(row.prices),
    distanceMiles: row.distance_miles == null ? null : Number(row.distance_miles),
    durationMinutes: row.duration_minutes,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }
}

// ---- Endpoints (published airport and destination pages) ----

type EndpointRow = { id: string; page_type: "airport" | "place"; published_slug: string; display_name: string | null; official_name: string | null; latitude: number | string | null; longitude: number | string | null }

/** Every published airport and destination page, as a possible end of a route. */
export async function listRouteEndpoints(): Promise<RouteEndpoint[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data: pages, error } = await supabase.from("destination_pages")
    .select("id, page_type, published_slug, display_name, official_name, latitude, longitude")
    .eq("lifecycle_state", "published").not("published_slug", "is", null).not("current_published_snapshot_id", "is", null)
  if (error || !pages) return []
  const rows = pages as EndpointRow[]
  const airportIds = rows.filter((row) => row.page_type === "airport").map((row) => row.id)
  const { data: terminals } = airportIds.length
    ? await supabase.from("destination_page_terminals").select("page_id, display_name, latitude, longitude, is_primary, sort_order").in("page_id", airportIds).order("sort_order")
    : { data: [] }
  const primaryTerminal = new Map<string, { display_name: string; latitude: number | string; longitude: number | string }>()
  for (const terminal of (terminals ?? []) as { page_id: string; display_name: string; latitude: number | string; longitude: number | string; is_primary: boolean }[]) {
    if (terminal.is_primary || !primaryTerminal.has(terminal.page_id)) primaryTerminal.set(terminal.page_id, terminal)
  }
  const placeParts = new Set(rows.filter((row) => row.page_type === "place").map((row) => slugifyRoutePart(row.official_name ?? "")))
  return rows.flatMap((row): RouteEndpoint[] => {
    if (row.page_type === "airport") {
      const short = (row.display_name ?? row.official_name ?? "").replace(/\s+airport$/i, "").trim()
      const terminal = primaryTerminal.get(row.id)
      const point = terminal ? { name: terminal.display_name, latitude: Number(terminal.latitude), longitude: Number(terminal.longitude) } : row.latitude != null && row.longitude != null ? { name: `${short} Airport`, latitude: Number(row.latitude), longitude: Number(row.longitude) } : null
      if (!short || !point) return []
      const part = slugifyRoutePart(short)
      // "oxford" is both a town and an airport; the airport takes "oxford-airport" so the URLs differ.
      return [{ id: row.id, type: "airport", name: `${short} Airport`, slugPart: placeParts.has(part) ? `${part}-airport` : part, href: `/airport-transfers/${row.published_slug}`, bookingPoint: point }]
    }
    const name = (row.official_name ?? row.display_name ?? "").replace(/\s+taxi$/i, "").trim()
    if (!name || row.latitude == null || row.longitude == null) return []
    return [{ id: row.id, type: "place", name, slugPart: slugifyRoutePart(name), href: `/destinations/${row.published_slug}`, bookingPoint: { name, latitude: Number(row.latitude), longitude: Number(row.longitude) } }]
  }).sort((left, right) => Number(left.type === "place") - Number(right.type === "place") || left.name.localeCompare(right.name))
}

// ---- Admin reads and writes ----

export async function listAdminRoutePages(): Promise<AdminRoutePage[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase.from("route_pages").select(ROUTE_COLUMNS).order("updated_at", { ascending: false })
  if (error) return []
  return (data as RouteRow[]).map(toAdminRoute)
}

export async function getAdminRoutePage(id: string): Promise<AdminRoutePage | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.from("route_pages").select(ROUTE_COLUMNS).eq("id", id).maybeSingle()
  return data ? toAdminRoute(data as RouteRow) : null
}

/** Driving distance and time between the two booking points, or null when Google can't give one. */
async function measureRoute(a: RouteEndpoint, b: RouteEndpoint) {
  try {
    const route = await calculateDrivingRoute({ lat: a.bookingPoint.latitude, lng: a.bookingPoint.longitude }, { lat: b.bookingPoint.latitude, lng: b.bookingPoint.longitude })
    return route ? { distanceMiles: Math.round(route.distanceMiles * 10) / 10, durationMinutes: route.durationMinutes } : null
  } catch (error) {
    console.error("Route page distance lookup failed", error)
    return null
  }
}

function conflictMessage(error: { code?: string; message?: string }) {
  if (error.code !== "23505") return null
  if (/pair/i.test(error.message ?? "")) return "There is already a route page for these two places."
  return "That URL is already used by another route page. Change the URL."
}

export async function saveRoutePage(input: RoutePageInput): Promise<Result<{ route: AdminRoutePage; distanceFound: boolean }>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONNECTED }
  const reverseSlug = reverseRouteSlug(input.slug)
  if (!reverseSlug) return { ok: false, error: "The URL must look like heathrow-to-birmingham-taxi." }
  if (input.endpointAId === input.endpointBId) return { ok: false, error: "Choose two different places." }
  const endpoints = await listRouteEndpoints()
  const a = endpoints.find((endpoint) => endpoint.id === input.endpointAId)
  const b = endpoints.find((endpoint) => endpoint.id === input.endpointBId)
  if (!a || !b) return { ok: false, error: "Both places must have a published page." }

  const before = input.id ? await getAdminRoutePage(input.id) : null
  if (input.id && !before) return { ok: false, error: "This route page no longer exists." }
  // Checked first so the message names the real problem; the database enforces it too.
  const { data: samePair } = await supabase.from("route_pages").select("id")
    .or(`and(endpoint_a_id.eq.${a.id},endpoint_b_id.eq.${b.id}),and(endpoint_a_id.eq.${b.id},endpoint_b_id.eq.${a.id})`)
    .neq("id", input.id ?? "00000000-0000-0000-0000-000000000000").limit(1)
  if (samePair?.length) return { ok: false, error: "There is already a route page for these two places. It covers both directions." }
  // Google fills the distance when the admin leaves it empty or changes the places.
  const endpointsChanged = before ? before.endpointAId !== a.id || before.endpointBId !== b.id : true
  let distanceMiles = input.distanceMiles
  let durationMinutes = input.durationMinutes
  let distanceFound = distanceMiles != null && durationMinutes != null
  if (distanceMiles == null || durationMinutes == null || (endpointsChanged && before && distanceMiles === before.distanceMiles && durationMinutes === before.durationMinutes)) {
    const measured = await measureRoute(a, b)
    if (measured) { distanceMiles = measured.distanceMiles; durationMinutes = measured.durationMinutes; distanceFound = true }
    else if (endpointsChanged && before) { distanceMiles = null; durationMinutes = null; distanceFound = false }
  }

  const row = {
    endpoint_a_id: a.id, endpoint_b_id: b.id, slug: input.slug, reverse_slug: reverseSlug,
    heading: input.text.heading.trim(), intro: input.text.intro.trim(), a_to_b_text: input.text.aToBText.trim(), b_to_a_text: input.text.bToAText.trim(),
    faqs: input.text.faqs.map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() })).filter((faq) => faq.question && faq.answer),
    seo_title: input.text.seoTitle.trim(), seo_description: input.text.seoDescription.trim(),
    prices: input.prices
      .map((item) => ({ vehicleId: VEHICLE_CLASSES.some((vehicle) => vehicle.id === item.vehicleId) ? item.vehicleId : "", label: item.label.trim(), price: Math.round(item.price * 100) / 100, note: item.note.trim() }))
      .filter((item) => item.label && item.price > 0),
    distance_miles: distanceMiles, duration_minutes: durationMinutes,
  }
  const { data, error } = input.id
    ? await supabase.from("route_pages").update(row).eq("id", input.id).select(ROUTE_COLUMNS).single()
    : await supabase.from("route_pages").insert(row).select(ROUTE_COLUMNS).single()
  if (error) {
    const conflict = conflictMessage(error)
    if (conflict) return { ok: false, error: conflict }
    console.error("Route page save failed", error)
    return { ok: false, error: "The route page could not be saved. Please try again." }
  }
  return { ok: true, route: toAdminRoute(data as RouteRow), distanceFound }
}

export async function setRoutePageStatus(id: string, status: RouteStatus): Promise<Result<{ route: AdminRoutePage }>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONNECTED }
  const before = await getAdminRoutePage(id)
  if (!before) return { ok: false, error: "This route page no longer exists." }
  const { data, error } = await supabase.from("route_pages")
    .update({ status, published_at: status === "published" ? before.publishedAt ?? new Date().toISOString() : before.publishedAt })
    .eq("id", id).select(ROUTE_COLUMNS).single()
  if (error) return { ok: false, error: "The status could not be changed. Please try again." }
  return { ok: true, route: toAdminRoute(data as RouteRow) }
}

export async function deleteRoutePage(id: string): Promise<Result<{ slug: string | null }>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONNECTED }
  const { data, error } = await supabase.from("route_pages").delete().eq("id", id).select("slug").maybeSingle()
  if (error) return { ok: false, error: "The route page could not be deleted. Please try again." }
  return { ok: true, slug: (data as { slug: string } | null)?.slug ?? null }
}

// ---- Public reads ----

type PublishedRouteSummary = { slug: string; endpointAId: string; endpointBId: string; updatedAt: string }

async function loadPublishedRouteSummaries(): Promise<PublishedRouteSummary[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase.from("route_pages").select("slug, endpoint_a_id, endpoint_b_id, updated_at").eq("status", "published")
  if (error || !data) return []
  return (data as { slug: string; endpoint_a_id: string; endpoint_b_id: string; updated_at: string }[]).map((row) => ({ slug: row.slug, endpointAId: row.endpoint_a_id, endpointBId: row.endpoint_b_id, updatedAt: row.updated_at }))
}

/** Published route pages whose two places are both still published, for the sitemap and links. */
export const listPublishedRoutePages = unstable_cache(async () => {
  const [routes, endpoints] = await Promise.all([loadPublishedRouteSummaries(), listRouteEndpoints()])
  const byId = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint]))
  return routes.flatMap((route) => {
    const a = byId.get(route.endpointAId)
    const b = byId.get(route.endpointBId)
    return a && b ? [{ slug: route.slug, updatedAt: route.updatedAt, endpointAId: a.id, endpointBId: b.id, title: `${a.name} to ${b.name}` }] : []
  })
}, ["route-pages-published"], { revalidate: 300, tags: [ROUTE_PAGES_TAG] })

// Throws when the database can't be read, so a failed read is never cached as a page.
async function loadPublicRoutePage(slug: string): Promise<Exclude<PublicRoutePageRead, { status: "unavailable" }>> {
  const supabase = getSupabase()
  if (!supabase) throw new Error(NOT_CONNECTED)
  {
    const { data, error } = await supabase.from("route_pages").select(ROUTE_COLUMNS).eq("status", "published").or(`slug.eq.${slug},reverse_slug.eq.${slug}`).maybeSingle()
    if (error) throw error
    if (!data) return { status: "missing" }
    const route = toAdminRoute(data as RouteRow)
    if (route.slug !== slug) return { status: "redirect", slug: route.slug }

    const [endpoints, related] = await Promise.all([listRouteEndpoints(), listPublishedRoutePages()])
    const a = endpoints.find((endpoint) => endpoint.id === route.endpointAId)
    const b = endpoints.find((endpoint) => endpoint.id === route.endpointBId)
    // A route only shows while both of its places are published.
    if (!a || !b) return { status: "missing" }

    // Prices are exactly what the admin typed; with none, the page shows no prices at all.
    const fares = route.prices.map((item, index) => {
      const vehicle = VEHICLE_CLASSES.find((candidate) => candidate.id === item.vehicleId)
      return { key: `${index}-${item.label}`, name: item.label, note: item.note, image: vehicle?.image ?? null, capacity: vehicle?.capacity ?? null, luggage: vehicle?.luggage ?? null, fare: item.price }
    })
    const fromFare = fares.length ? Math.min(...fares.map((fare) => fare.fare)) : null
    const facts = { a, b, distanceMiles: route.distanceMiles, durationMinutes: route.durationMinutes, fromFare }
    const links = createRouteBookingLinks(a.bookingPoint, b.bookingPoint)
    const text = route.text

    return { status: "published", page: {
      id: route.id,
      slug: route.slug,
      a, b,
      heading: text.heading || defaultRouteHeading(facts),
      intro: text.intro || defaultRouteIntro(facts),
      directions: [
        { from: a, to: b, text: text.aToBText || defaultDirectionText(a, b), bookHref: links.toAirport },
        { from: b, to: a, text: text.bToAText || defaultDirectionText(b, a), bookHref: links.fromAirport },
      ],
      distanceMiles: route.distanceMiles,
      durationMinutes: route.durationMinutes,
      fromFare,
      fares,
      faqs: [...defaultRouteFaqs(facts), ...text.faqs],
      seoTitle: text.seoTitle || defaultRouteSeoTitle(facts),
      seoDescription: text.seoDescription || defaultRouteSeoDescription(facts),
      relatedRoutes: related
        .filter((item) => item.slug !== route.slug && [item.endpointAId, item.endpointBId].some((id) => id === a.id || id === b.id))
        .slice(0, 8)
        .map((item) => ({ slug: item.slug, title: item.title })),
    } }
  }
}

const cachedPublicRoutePage = unstable_cache(loadPublicRoutePage, ["route-page"], { revalidate: 300, tags: [ROUTE_PAGES_TAG] })

export async function readPublicRoutePage(slug: string): Promise<PublicRoutePageRead> {
  // Only route-shaped URLs reach the database; anything else at the site root is a 404.
  if (!reverseRouteSlug(slug)) return { status: "missing" }
  try {
    return await cachedPublicRoutePage(slug)
  } catch (error) {
    console.error("Route page read failed", slug, error)
    return { status: "unavailable" }
  }
}
