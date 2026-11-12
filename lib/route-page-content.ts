// Route pages: shared types, URL rules and the text the site writes when an admin leaves a field
// empty. Client-safe (no database or secrets), so the admin editor shows the same default text.

export type RouteEndpointType = "airport" | "place"

/** One end of a route: a published airport or destination page. */
export type RouteEndpoint = {
  id: string
  type: RouteEndpointType
  /** "Heathrow Airport", "Reading". */
  name: string
  /** The word(s) used in the route URL, e.g. "heathrow" or "reading". */
  slugPart: string
  /** The endpoint's own page, e.g. /airport-transfers/heathrow-airport-taxi. */
  href: string
  /** Where the booking form picks up or drops off: an airport's main terminal, or the town itself. */
  bookingPoint: { name: string; latitude: number; longitude: number }
}

export type RouteFaq = { question: string; answer: string }

/** What an admin can write. Empty strings mean "use the site's text". */
export type RouteCustomText = {
  heading: string
  intro: string
  aToBText: string
  bToAText: string
  seoTitle: string
  seoDescription: string
  faqs: RouteFaq[]
}

export type RouteStatus = "draft" | "published"

export const ROUTE_SLUG_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)-to-([a-z0-9]+(?:-[a-z0-9]+)*)-taxi$/
export const ROUTE_FAQ_LIMIT = 10
export const ROUTE_TEXT_LIMITS = { heading: 160, intro: 1200, aToBText: 1200, bToAText: 1200, seoTitle: 70, seoDescription: 170, faqQuestion: 200, faqAnswer: 1200 } as const

export function slugifyRoutePart(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function routeSlug(fromPart: string, toPart: string) {
  return `${fromPart}-to-${toPart}-taxi`
}

/** "heathrow-to-birmingham-taxi" → "birmingham-to-heathrow-taxi"; null when the slug is not a route URL. */
export function reverseRouteSlug(slug: string): string | null {
  const match = ROUTE_SLUG_PATTERN.exec(slug)
  if (!match) return null
  // "-to-" can also sit inside a name ("stoke-on-trent"); the split must give back the same slug.
  const parts = slug.slice(0, -"-taxi".length).split("-to-")
  if (parts.length !== 2) return null
  return routeSlug(parts[1], parts[0])
}

export function isRouteSlug(value: string) {
  return reverseRouteSlug(value) !== null
}

function hoursAndMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} minutes`
  const hourText = `${hours} hour${hours === 1 ? "" : "s"}`
  return minutes === 0 ? hourText : `${hourText} ${minutes} minutes`
}

/** "about 118 miles, usually around 2 hours 5 minutes", or "" when the distance isn't known yet. */
export function routeDistanceText(distanceMiles: number | null, durationMinutes: number | null) {
  if (distanceMiles == null || durationMinutes == null) return ""
  return `about ${Math.round(distanceMiles)} miles, usually around ${hoursAndMinutes(durationMinutes)}`
}

export function formatRouteDuration(durationMinutes: number) {
  return hoursAndMinutes(durationMinutes)
}

type RouteFacts = { a: RouteEndpoint; b: RouteEndpoint; distanceMiles: number | null; durationMinutes: number | null; fromFare: number | null }

export function defaultRouteHeading({ a, b }: Pick<RouteFacts, "a" | "b">) {
  return `${a.name} to ${b.name} Taxi`
}

export function defaultRouteIntro({ a, b, distanceMiles, durationMinutes }: RouteFacts) {
  const distance = routeDistanceText(distanceMiles, durationMinutes)
  return [
    `Book a private, fixed-price taxi between ${a.name} and ${b.name}, in either direction.`,
    distance ? `The drive is ${distance}, depending on traffic.` : "",
    "You get the full price before you book, and your driver takes you door to door with no shared stops.",
  ].filter(Boolean).join(" ")
}

/** The paragraph for one direction of travel, from `from` to `to`. */
export function defaultDirectionText(from: RouteEndpoint, to: RouteEndpoint) {
  const start = from.type === "airport"
    ? `Landing at ${from.name}? Add your flight number when you book and we track your flight, so your driver is there when you land. Airport pickups include 60 minutes of free waiting from the actual landing time.`
    : `Your driver collects you from your address in ${from.name}, at the time you choose.`
  const end = to.type === "airport"
    ? `They drive you straight to ${to.name} and drop you at your terminal, with time planned around your flight.`
    : `They drive you straight to your address in ${to.name}, with help for your luggage.`
  return `${start} ${end}`
}

/** The site adds " | ONE Airport Taxi" after the title. */
export function defaultRouteSeoTitle({ a, b }: Pick<RouteFacts, "a" | "b">) {
  return `${a.name} to ${b.name} Taxi`.slice(0, ROUTE_TEXT_LIMITS.seoTitle)
}

export function defaultRouteSeoDescription({ a, b, fromFare }: RouteFacts) {
  const price = fromFare != null ? ` from £${fromFare}` : ""
  const text = `Fixed-price taxi transfers between ${a.name} and ${b.name}${price}, in both directions. Private car, door to door. Book online in minutes.`
  return text.length <= ROUTE_TEXT_LIMITS.seoDescription ? text : `${text.slice(0, ROUTE_TEXT_LIMITS.seoDescription - 1).trimEnd()}…`
}

export function defaultRouteFaqs({ a, b, distanceMiles, durationMinutes, fromFare }: RouteFacts): RouteFaq[] {
  const distance = routeDistanceText(distanceMiles, durationMinutes)
  const hasAirport = a.type === "airport" || b.type === "airport"
  const faqs: RouteFaq[] = []
  if (distance) faqs.push({
    question: `How long does a taxi from ${a.name} to ${b.name} take?`,
    answer: `The drive is ${distance}. Traffic and the time of day can change this, so leave extra time if you have a flight to catch.`,
  })
  if (fromFare != null) faqs.push({
    question: `How much is a taxi from ${a.name} to ${b.name}?`,
    answer: `Fares start from £${fromFare} for a standard car. The price depends on the vehicle you choose and your exact pickup and drop-off addresses, and you see the full fixed price before you book.`,
  })
  faqs.push({
    question: `Do you also drive from ${b.name} to ${a.name}?`,
    answer: `Yes. This page covers both directions. Choose "${b.name} to ${a.name}" above to book the journey the other way.`,
  })
  if (hasAirport) faqs.push(
    {
      question: "What does the price include?",
      answer: "Your quoted fare includes airport pickup and drop-off charges, tolls, parking and congestion charges. Optional meet & greet costs £7 extra. Airport pickups include 60 minutes of free waiting from the actual landing time; additional waiting costs £15 per 30 minutes.",
    },
    {
      question: "What happens if my flight is delayed?",
      answer: "Add your flight number when you book and we track your flight, so your driver can adjust the pickup time if it lands early or late.",
    },
  )
  faqs.push({
    question: "Can I book a return journey?",
    answer: "Yes. Tick the return journey option in the booking form and choose the date and time you're coming back.",
  })
  return faqs
}

export const EMPTY_ROUTE_TEXT: RouteCustomText = { heading: "", intro: "", aToBText: "", bToAText: "", seoTitle: "", seoDescription: "", faqs: [] }
