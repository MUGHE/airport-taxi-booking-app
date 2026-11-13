import Image from "next/image"
import Link from "next/link"
import { HeroOfferBox } from "@/components/hero-offer-box"
import {
  ArrowRight,
  Accessibility,
  Baby,
  BadgeCheck,
  Banknote,
  BatteryCharging,
  Briefcase,
  Bus,
  Car,
  Check,
  Clock,
  DoorOpen,
  GlassWater,
  Headphones,
  Info,
  Luggage,
  MapPin,
  Navigation,
  PlaneLanding,
  PlaneTakeoff,
  Route,
  ShieldCheck,
  Ship,
  SlidersHorizontal,
  SquareParking,
  Star,
  TrainFront,
  UsersRound,
} from "lucide-react"
import { AirportMapPreview } from "@/components/airport-page/airport-map-preview"
import { VehicleCard } from "@/components/vehicle-card"
import { AirportQuoteActions } from "@/components/airport-page/airport-quote-actions"
import { ResilientImage } from "@/components/airport-page/resilient-image"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { GoogleBusinessReviewsWidget } from "@/components/google-business-reviews-widget"
import { BriefPricingPanel, CitiesSection, DeparturesSection, GuideSection, PortsSection, TravellersSection, type BriefCard, type BriefPlace, type BriefPricing } from "@/components/airport-page/airport-brief-sections"
import { BRIEF_COPY } from "@/components/airport-page/airport-briefs"
import { GOOGLE_REVIEW_PLACE_ID } from "@/lib/company"
import { AIRPORT_IMAGES } from "@/lib/airport-images"
import { CALL_NUMBER, WHATSAPP_LINK } from "@/lib/contact"
import type { GoogleRating } from "@/lib/google-rating"
import type { StopPricing } from "@/lib/types"
import type { AirportPageContentSection, AirportPagePresentation } from "@/lib/airport-page-data"
import type { RichTextBlock, TiptapDocument, TiptapNode } from "@/lib/destination-content"

function safeNewTabProps(href: string) {
  return href.startsWith("https://") ? { target: "_blank" as const, rel: "noopener noreferrer" } : {}
}

function InlineNode({ node }: { node: TiptapNode }) {
  if (node.type === "text") {
    let result: React.ReactNode = node.text
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") result = <strong>{result}</strong>
      if (mark.type === "link" && typeof mark.attrs?.href === "string") {
        result = <Link className="font-semibold text-primary underline decoration-primary/30 underline-offset-4" href={mark.attrs.href} {...safeNewTabProps(mark.attrs.href)}>{result}</Link>
      }
    }
    return result
  }
  return <>{(node.content ?? []).map((child, index) => <InlineNode key={`${child.type}-${index}`} node={child} />)}</>
}

export function TiptapRichText({ document }: { document: TiptapDocument }) {
  function renderNode(node: TiptapNode, index: number): React.ReactNode {
    const content = (node.content ?? []).map((child, childIndex) => renderNode(child, childIndex))
    if (node.type === "paragraph") return <p key={index} className="leading-7"><InlineNode node={node} /></p>
    if (node.type === "heading") return <h3 key={index} className="text-lg font-semibold text-foreground"><InlineNode node={node} /></h3>
    if (node.type === "bulletList") return <ul key={index} className="airport-rich-list">{content}</ul>
    if (node.type === "orderedList") return <ol key={index} className="airport-rich-list list-decimal">{content}</ol>
    if (node.type === "listItem") return <li key={index}>{content}</li>
    return null
  }
  return <div className="space-y-4 text-left text-muted-foreground">{document.content.map(renderNode)}</div>
}

function RichText({ blocks, document }: { blocks: RichTextBlock[]; document?: TiptapDocument }) {
  if (document) return <TiptapRichText document={document} />
  return <div className="space-y-4 text-left text-muted-foreground">{blocks.map((block, index) => {
    if (block.type === "link" && block.href) return <Link key={`${block.text}-${index}`} className="block font-semibold text-primary underline decoration-primary/30 underline-offset-4" href={block.href} {...safeNewTabProps(block.href)}>{block.label || block.text}</Link>
    if (block.type === "heading") return <h3 key={`${block.text}-${index}`} className="text-lg font-semibold text-foreground">{block.text}</h3>
    if (block.type === "bold") return <p key={`${block.text}-${index}`} className="font-semibold text-foreground">{block.text}</p>
    if (block.type === "list") return block.listStyle === "ordered" ? <ol key={`${block.text}-${index}`} className="airport-rich-list list-decimal"><li>{block.text}</li></ol> : <ul key={`${block.text}-${index}`} className="airport-rich-list"><li>{block.text}</li></ul>
    return <p key={`${block.text}-${index}`} className="leading-7">{block.text}</p>
  })}</div>
}

const sectionLabels: Partial<Record<AirportPageContentSection["type"], string>> = {
  airport_routes: "Airport connections",
  city_routes: "City connections",
  ferry_cruise: "Onward travel",
  travel_information: "Plan your journey",
  video: "See the journey",
}

const storyIcons = [Navigation, PlaneLanding, Luggage, MapPin]

// CMS template labels that tell visitors nothing; the page swaps in an airport-specific heading.
const PLACEHOLDER_TITLES = new Set(["introduction", "benefits & service facts", "airport guide", "airport map", "popular transfer routes", "google reviews", "airport faqs", "frequently asked questions", "fleet & pricing", "find the right vehicle for your journey", "ready to book your airport transfer?", "ferry & cruise information", "who we drive", "places you can book from", "travel information", "airport terminal", "getting to", "departures", "know before you land", "plan your journey"])

function headingFor(title: string | undefined, fallback: string) {
  return title && !PLACEHOLDER_TITLES.has(title.trim().toLowerCase()) ? title : fallback
}

/** "London Luton (LTN)" -> "London Luton Airport (LTN)", from the primary terminal's name. */
function airportLabel(page: AirportPagePresentation) {
  const name = (page.terminals.find((terminal) => terminal.isPrimary) ?? page.terminals[0])?.name.split(" - ")[0]
  return name ? name.replace(/(?<! Airport)\s*\(([A-Z]{3})\)/, " Airport ($1)") : `${page.shortName} Airport`
}

function hasBodyText(section: AirportPageContentSection) {
  return section.bodyDocument ? JSON.stringify(section.bodyDocument).includes('"text"') : section.body.some((block) => block.text.trim())
}

function hasContent(section: AirportPageContentSection) {
  return hasBodyText(section) || Object.values(section.fields).some((value) => value.trim())
}

const TRAVELLER_ICONS: Record<string, BriefCard["icon"]> = { family: Baby, business: Briefcase, group: UsersRound, long_distance: Route, accessible: Accessibility, luggage: Luggage, terminal: PlaneTakeoff, arrivals: PlaneLanding, clock: Clock, car: Car, train: TrainFront, bus: Bus, map_pin: MapPin, parking: SquareParking, info: Info }

/** Cards for the CMS "Who we drive" section; a card needs at least a title. */
function cmsTravellerCards(section: AirportPageContentSection): BriefCard[] {
  return (section.items ?? []).filter((item) => item.title).map((item) => ({
    icon: TRAVELLER_ICONS[item.icon],
    title: item.title,
    text: item.text,
    link: item.linkHref && item.linkLabel ? { href: item.linkHref, label: item.linkLabel } : undefined,
  }))
}

/** Places for the CMS "Places you can book from" section; booking buttons need a place chosen from Google Places. */
function cmsPlaces(section: AirportPageContentSection): BriefPlace[] {
  return (section.items ?? []).flatMap((item) => item.title && item.latitude !== undefined && item.longitude !== undefined
    ? [{ label: item.title, name: item.title, address: item.address || item.title, latitude: item.latitude, longitude: item.longitude, text: item.text || undefined, href: item.linkHref || undefined, hrefLabel: item.linkHref ? item.linkLabel || `${item.title} taxi guide` : undefined }]
    : [])
}

/** A Ferry & cruise section with a card list shows port cards; one without keeps the original text layout. */
function hasPortCards(section: AirportPageContentSection) {
  return section.type === "ferry_cruise" && Array.isArray(section.items)
}

function CmsPortsSection({ section, page }: { section: AirportPageContentSection; page: AirportPagePresentation }) {
  const places = cmsPlaces(section)
  if (!places.length) return null
  return <PortsSection page={page} ports={{
    heading: headingFor(section.title, `${airportName(page)} to Ferry Ports and Cruise Terminals`),
    paragraphs: [],
    body: hasBodyText(section) ? <RichText blocks={section.body} document={section.bodyDocument} /> : undefined,
    titleFrom: page.shortName,
    places,
    note: section.fields.note?.trim(),
  }} />
}

function airportName(page: AirportPagePresentation) {
  return /\bAirport$/.test(page.shortName) ? page.shortName : `${page.shortName} Airport`
}

/** Cards for the CMS Airport Terminal and Getting To sections, in rows of consecutive cards that share a group heading. */
function cmsGuideGroups(section: AirportPageContentSection) {
  if (section.type !== "airport_guide" && section.type !== "getting_to") return []
  const groups: { title: string; cards: BriefCard[] }[] = []
  for (const item of section.items ?? []) {
    if (!item.title) continue
    const title = item.group ?? ""
    const card: BriefCard = {
      icon: TRAVELLER_ICONS[item.icon],
      title: item.title,
      text: item.text,
      // Button text turns the card into the highlighted booking card.
      ...(item.linkLabel ? { actions: [{ kind: "to" as const, label: item.linkLabel }], highlight: true } : {}),
    }
    const last = groups[groups.length - 1]
    if (last && last.title === title) last.cards.push(card)
    else groups.push({ title, cards: [card] })
  }
  return groups.map((group) => ({ ...group, columns: (group.cards.length === 2 ? 2 : group.cards.length === 4 ? 4 : 3) as 2 | 3 | 4 }))
}

function CmsGuideSection({ section, page }: { section: AirportPageContentSection; page: AirportPagePresentation }) {
  const groups = cmsGuideGroups(section)
  if (!groups.length) return null
  const name = airportName(page)
  const body = hasBodyText(section) ? <RichText blocks={section.body} document={section.bodyDocument} /> : undefined
  if (section.type === "getting_to") return <GuideSection page={page} guide={{ id: "getting-to-airport", eyebrow: "Getting there", heading: headingFor(section.title, `Getting to ${name}`), paragraphs: [], body, groups }} />
  // Older Airport Guides hold terminals and "Getting to" cards under group headings, as one travel guide.
  const combined = groups.some((group) => group.title)
  return <GuideSection page={page} guide={{
    eyebrow: combined ? "Plan your journey" : "Airport terminals",
    heading: headingFor(section.title, combined ? `${name} Information and Travel Guide` : `${name} Terminals`),
    paragraphs: [],
    body,
    groups,
  }} />
}

/** Cards for the CMS Departures section; button text adds a booking button to the airport. */
function cmsDepartureCards(section: AirportPageContentSection): BriefCard[] {
  if (section.type !== "departures") return []
  return (section.items ?? []).filter((item) => item.title).map((item) => ({
    icon: TRAVELLER_ICONS[item.icon],
    title: item.title,
    text: item.text,
    ...(item.linkLabel ? { actions: [{ kind: "to" as const, label: item.linkLabel }] } : {}),
  }))
}

function CmsDeparturesSection({ section, page }: { section: AirportPageContentSection; page: AirportPagePresentation }) {
  const cards = cmsDepartureCards(section)
  if (!cards.length) return null
  return <DeparturesSection page={page} departures={{
    eyebrow: "Departures",
    heading: headingFor(section.title, `Taxi to ${airportName(page)} – Departures Made Simple`),
    paragraphs: [],
    body: hasBodyText(section) ? <RichText blocks={section.body} document={section.bodyDocument} /> : undefined,
    cards,
  }} />
}

function CmsTravellersSection({ section, page }: { section: AirportPageContentSection; page: AirportPagePresentation }) {
  const cards = cmsTravellerCards(section)
  if (!cards.length) return null
  const heading = headingFor(section.title, `${airportName(page)} Taxi Service for Families, Business Travellers and Groups`)
  return <TravellersSection page={page} travellers={{ heading, lead: "", body: hasBodyText(section) ? <RichText blocks={section.body} document={section.bodyDocument} /> : undefined, cards }} />
}

function CmsPlacesSection({ section, page }: { section: AirportPageContentSection; page: AirportPagePresentation }) {
  const places = cmsPlaces(section)
  if (!places.length) return null
  return <CitiesSection page={page} cities={{
    eyebrow: "Towns and cities",
    heading: headingFor(section.title, `${airportName(page)} Taxi Transfers to Towns and Cities`),
    paragraphs: [],
    body: hasBodyText(section) ? <RichText blocks={section.body} document={section.bodyDocument} /> : undefined,
    listHeading: section.fields.listHeading?.trim() || `You can arrange a taxi to ${page.shortName} from places like:`,
    places,
    closing: section.fields.closing?.trim() ?? "",
    cta: section.fields.cta?.trim() || `Get a Quote for Your ${page.shortName} Journey`,
  }} />
}

function terminalLabel(terminal: AirportPagePresentation["terminals"][number]) {
  return terminal.name.split(" - ")[1]?.trim() || terminal.name
}

/** "Terminals 2, 3, 4 and 5" or "North and South Terminals", or null for a single-terminal airport. */
function terminalsSummary(page: AirportPagePresentation) {
  if (page.terminals.length < 2) return null
  const parts = page.terminals.map(terminalLabel)
  const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0])
  const numbers = parts.map((part) => part.match(/^Terminal (\w+)$/i)?.[1])
  if (numbers.every(Boolean)) return `Terminals ${list(numbers as string[])}`
  return `${list(parts.map((part) => part.replace(/\s*Terminal$/i, "")))} Terminals`
}

function iataCode(page: AirportPagePresentation) {
  return page.terminals[0]?.name.match(/\(([A-Z]{3})\)/)?.[1]
}

/** Shows the opening paragraph and folds the rest into "Read more", so long CMS copy stays on the
 *  page (and in search) without becoming a wall of text. */
export function LeadAndMore({ blocks, document, extra, moreLabel }: { blocks: RichTextBlock[]; document?: TiptapDocument; extra?: React.ReactNode; moreLabel: string }) {
  let lead: React.ReactNode = null
  let rest: React.ReactNode = null
  let hasRest = false
  if (document) {
    const leadIndex = document.content.findIndex((node) => node.type === "paragraph")
    const restNodes = document.content.filter((_, index) => index !== leadIndex)
    if (leadIndex >= 0) lead = <TiptapRichText document={{ ...document, content: [document.content[leadIndex]] }} />
    if (restNodes.length > 0) { rest = <TiptapRichText document={{ ...document, content: restNodes }} />; hasRest = true }
  } else {
    const filled = blocks.filter((block) => block.text.trim())
    if (filled.length > 0) lead = <RichText blocks={filled.slice(0, 1)} />
    if (filled.length > 1) { rest = <RichText blocks={filled.slice(1)} />; hasRest = true }
  }
  return (
    <>
      {lead}
      {(hasRest || extra) && (
        <details className="airport-read-more">
          <summary>{moreLabel}</summary>
          <div className="mt-4 space-y-4">{rest}{extra}</div>
        </details>
      )}
    </>
  )
}

// Facts here mirror the Terms and FAQs; keep them in step.
const trustItems = [
  { icon: Banknote, title: "Fixed fares", text: "No meters, no surge" },
  { icon: PlaneTakeoff, title: "Flight tracking", text: "Moves with your flight" },
  { icon: UsersRound, title: "Meet & greet", text: "Add it when you book" },
  { icon: ShieldCheck, title: "Licensed drivers", text: "Licensed and vetted" },
  { icon: Headphones, title: "24/7 support", text: "Phone or WhatsApp" },
]

type InfoCard = { icon?: typeof Banknote; title: string; items: string[] }

export type AirportCopy = {
  heroHeading?: string
  heroSubhead?: string
  /** Adds "get a quote or call us" under the hero intro. */
  heroCallLine?: boolean
  heroNotes?: string[]
  benefitsHeading?: string
  benefitsSubhead?: string
  benefitCards?: { icon: typeof Banknote; title: string; text: string }[]
  guideHeading?: string
  guideLead?: string
  routesSubhead?: string
  vehiclesSubhead?: string
  vehicleFirst?: string
  bestFor?: Record<string, string>
  finalHeading?: string
  finalChip?: string
  /** Overrides the default on-board comfort cards shown after "Why book with us". */
  comfort?: { heading: string; subhead: string; cards: { icon: typeof Banknote; title: string; text: string }[] }
  /** Local travel facts as cards, shown before the pickup guide. */
  travelInfo?: { heading: string; lead: string | string[]; cards: InfoCard[]; closing: string }
  travelInfoOrder?: number
  /** Overrides the default driver vetting section shown after the pickup guide. */
  drivers?: { heading: string; paragraphs: string[]; checks: string[] }
  /** Replaces the "Get a free instant quote" line under the hero intro (the phone number follows it). */
  heroCallText?: string
  /** Replaces the CMS introduction heading, copy and button. */
  intro?: { heading: string; paragraphs: React.ReactNode[]; cta: string; points?: { title: string; text: string }[] }
  /** Replaces the fleet heading and copy; `descriptions` is keyed by vehicle id. */
  fleet?: { heading: string; paragraphs: React.ReactNode[]; closing: string; descriptions: Record<string, string>; pricing?: BriefPricing }
  /** Replaces the pickup guide copy beside the terminal map. */
  pickup?: { heading: string; lead: string[]; stepsHeading: string; steps: { title: string; text: string }[]; dropHeading: string; dropText: string }
  /** Replaces the final call to action copy. */
  final?: { heading: string; paragraphs: React.ReactNode[]; tagline: string }
  comfortOrder?: number
  /** Replace only the heading and subhead of the default comfort cards. */
  comfortHeading?: string
  comfortSubhead?: string
  /** A line under the "Why book with us" cards. */
  benefitsClosing?: string
  /** Airport-only sections placed into the page's reading order. */
  extraSections?: { key: string; order: number; Component: React.ComponentType<{ page: AirportPagePresentation }> }[]
  /** CMS sections this airport's own sections replace. */
  hiddenSections?: AirportPageContentSection["type"][]
}

// Each airport's own copy lives in airport-briefs.tsx.
const AIRPORT_COPY: Record<string, AirportCopy> = BRIEF_COPY

function airportCopy(page: AirportPagePresentation): AirportCopy {
  return AIRPORT_COPY[page.shortName] ?? {}
}

/** "Why book with us" cards on every airport and destination page; an airport can override them in AIRPORT_COPY. */
export const DEFAULT_BENEFIT_CARDS: { icon: typeof Banknote; title: string; text: string }[] = [
  { icon: Banknote, title: "Fixed Fare", text: "Your quoted fare includes pickup/drop-off charges, tolls, parking, and congestion charges. Optional Meet & Greet and additional waiting time are extra." },
  { icon: Headphones, title: "24/7 Support", text: "Our dedicated support team is available around the clock to assist you with any inquiries or issues." },
  { icon: ShieldCheck, title: "Licensed drivers", text: "Ride with confidence knowing our experienced and courteous drivers are committed to your comfort and safety." },
  { icon: PlaneTakeoff, title: "Flight tracking", text: "We track your flight status in real time to ensure timely pickups, even if your flight is delayed." },
  { icon: UsersRound, title: "Meet & Greet", text: "Drivers wait inside the airport up to 60 minutes; flight delays monitored." },
]

function whyBookCards(page: AirportPagePresentation) {
  return airportCopy(page).benefitCards ?? DEFAULT_BENEFIT_CARDS
}

function AirportHeroQuote({ page, stopPricing }: { page: AirportPagePresentation; stopPricing?: StopPricing }) {
  return (
    <div className="airport-quote-wrap">
      {page.bookingAvailable !== false && <h2 className="airport-quote-title">Instant {page.shortName} Taxi Quote</h2>}
      <AirportQuoteActions page={page} stopPricing={stopPricing} />
    </div>
  )
}

function AirportHeroCopy({ page, canonicalPath, googleRating }: { page: AirportPagePresentation; canonicalPath?: string; googleRating?: GoogleRating | null }) {
  return (
    <div className="airport-hero-copy">
      <div className="airport-hero-heading">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Airports", href: "/airport-transfers" }, { label: iataCode(page) ? `${page.shortName} (${iataCode(page)})` : page.shortName, href: canonicalPath }]} className="[&_span]:text-white/90 [&_svg]:text-white/40 [&_a]:text-white/70" />
        <p className="airport-rating"><PlaneLanding aria-hidden="true" /><span>{airportLabel(page)}{terminalsSummary(page) && <> · {terminalsSummary(page)}</>}</span></p>
        {/* One H1 pattern on every airport page; keyword-heavy wording belongs in the title tag. */}
        <h1>{airportCopy(page).heroHeading ?? <>{page.shortName} Airport Taxi &amp; Transfers</>}</h1>
      </div>
      <p className="airport-hero-intro">{airportCopy(page).heroSubhead ?? <>Fixed-price transfers to and from {page.terminals.length > 1 ? `every ${page.shortName} terminal` : `${page.shortName} Airport`}. We track your flight and confirm your fare before you pay.</>}</p>
      {airportCopy(page).heroCallLine && <p className="airport-hero-call">{airportCopy(page).heroCallText ?? `Get a free instant ${page.shortName} taxi quote today, or call our team on`} <a href={`tel:${CALL_NUMBER}`}>{CALL_NUMBER}</a>{airportCopy(page).heroCallText ? "." : " to book."}</p>}
      <div className="airport-hero-proof">
        <HeroOfferBox notes={airportCopy(page).heroNotes} />
        <p className="airport-hero-rating">
          {googleRating && <><span className="airport-hero-stars">{Array.from({ length: 5 }).map((_, i) => <Star aria-hidden="true" key={i} />)}</span><strong>Rated {googleRating.rating.toFixed(1)} on Google from {googleRating.reviewCount.toLocaleString("en-GB")} reviews</strong><span aria-hidden="true">·</span></>}
          <a href="#reviews">{googleRating ? "Read reviews" : "Read our Google reviews"}</a>
        </p>
      </div>
    </div>
  )
}

function StorySection({ section, index, page }: { section: AirportPageContentSection; index: number; page: AirportPagePresentation }) {
  const Icon = storyIcons[index % storyIcons.length]
  const reversed = index % 2 === 1
  const isCruise = section.type === "ferry_cruise"

  return (
    <section className={`airport-story ${reversed ? "airport-story-reversed" : ""}`} data-preview-section={section.type}>
      <div className="airport-container airport-story-grid">
        <div className="airport-story-copy">
          {isCruise && <p className="airport-eyebrow">Fly-cruise transfers</p>}
          <h2>{isCruise ? headingFor(section.title, `${page.shortName} to your cruise or ferry port`) : section.title}</h2>
          <div className="mt-5">{isCruise ? <LeadAndMore blocks={section.body} document={section.bodyDocument} moreLabel="Ports and journey details" /> : <RichText blocks={section.body} document={section.bodyDocument} />}</div>
          {Object.entries(section.fields).filter(([, value]) => value.trim()).length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {Object.entries(section.fields).filter(([, value]) => value.trim()).map(([key, value]) => (
                <div key={key} className="airport-story-note"><Icon aria-hidden="true" /><div><h3>{key.replace(/([A-Z])/g, " $1")}</h3><p>{value}</p></div></div>
              ))}
            </div>
          )}
        </div>
        {section.image ? (
          <div className="airport-story-media">
            <ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} />
          </div>
        ) : isCruise ? (
          <aside className="airport-cruise-panel">
            <span className="airport-cruise-icon"><Ship aria-hidden="true" /></span>
            <h3>Your sailing matters more than your flight time.</h3>
            <p>Tell us your boarding time and we&apos;ll plan the pickup around it.</p>
            <p className="airport-cruise-tip"><Luggage aria-hidden="true" />Travelling with cruise luggage? An Estate Car or MPV gives you room for it.</p>
            <Button nativeButton={false} render={<Link href={page.bookingLinks.fromAirport} />}>Get My Fixed Price <ArrowRight className="size-4" /></Button>
          </aside>
        ) : (
          <div className="airport-story-placeholder" aria-hidden="true"><Icon /><span>{sectionLabels[section.type] ?? "Airport transfer"}</span></div>
        )}
      </div>
    </section>
  )
}

/** The airport's own photo (or a chauffeur photo for a town route): used when the route has no CMS image, or it fails to load. */
function localRouteImage(related: AirportPagePresentation["relatedDestinations"][number]) {
  const slug = related.href.split("/").filter(Boolean).pop() ?? ""
  return AIRPORT_IMAGES[slug] ?? "/hero-airport-transfer.webp"
}

function RouteSection({ page, title }: { page: AirportPagePresentation; title?: string }) {
  if (page.relatedDestinations.length === 0) return null
  return <section className="airport-routes" data-preview-section="related_destinations"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">Most booked</p><h2>{headingFor(title, `Popular routes from ${page.shortName}`)}</h2></div><p>{airportCopy(page).routesSubhead ?? "Airport-to-airport and city transfers at fixed prices."}</p></div><div className="airport-route-grid">{page.relatedDestinations.map((related, index) => <article key={related.id} className="airport-route-card"><ResilientImage className="airport-route-image" src={related.image ?? localRouteImage(related)} fallbackSrc={localRouteImage(related)} alt={`${related.displayName} taxi transfer from ${airportName(page)}`} sizes="(min-width: 900px) 33vw, 100vw" /><div className="airport-route-overlay" /><div className="airport-route-content"><span>Route {String(index + 1).padStart(2, "0")}</span><h3><Link href={related.href}>{page.shortName} to {related.displayName}</Link></h3><p>{related.description}</p><Link className="airport-route-link" href={related.bookingLinks.toAirport}>See fares <ArrowRight aria-hidden="true" /></Link></div></article>)}</div></div></section>
}

function ReviewSection({ title }: { page: AirportPagePresentation; title?: string }) {
  return <GoogleBusinessReviewsWidget placeId={GOOGLE_REVIEW_PLACE_ID} variant="airport" title={headingFor(title, "Trusted by travellers across London.")} />
}

function FaqSection({ page, title }: { page: AirportPagePresentation; title?: string }) {
  return <section className="airport-faq" data-preview-section="faq"><div className="airport-container airport-faq-grid"><div className="airport-faq-heading"><p className="airport-eyebrow">Need to know</p><h2>{headingFor(title, `${page.shortName} Airport transfer FAQs`)}</h2><p>Quick answers before you fly into or out of {page.shortName}.</p><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">Still have a question? WhatsApp us <ArrowRight aria-hidden="true" /></a></div><Accordion className="airport-faq-list" multiple defaultValue={["faq-0"]}>{page.faqs.map((faq, index) => <AccordionItem key={`${faq.question}-${index}`} value={`faq-${index}`}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionPanel>{faq.answer}{faq.link && <> <Link className="font-semibold text-primary underline underline-offset-4" href={faq.link.href}>{faq.link.label}</Link>.</>}</AccordionPanel></AccordionItem>)}</Accordion></div></section>
}

// Six short standard cards on every airport page, so each one states the same, accurate terms.
export function BenefitCards({ cards }: { cards: { icon: typeof Banknote; title: string; text: string }[] }) {
  return (
    <div className="airport-facts-grid airport-benefit-card-grid">
      {cards.map(({ icon: Icon, title, text }, index) => (
        <Card key={title} className="airport-benefit-card">
          <CardHeader className="airport-benefit-card-header">
            <Icon aria-hidden="true" />
            <span className="airport-fact-number">{String(index + 1).padStart(2, "0")}</span>
          </CardHeader>
          <CardContent className="airport-benefit-card-content"><h3>{title}</h3><p>{text}</p></CardContent>
        </Card>
      ))}
    </div>
  )
}

function VehicleSection({ page, fleetSection }: { page: AirportPagePresentation; fleetSection?: AirportPageContentSection }) {
  const fleetHasBody = fleetSection ? hasContent(fleetSection) : false
  const copy = airportCopy(page)
  const orderedVehicles = copy.vehicleFirst ? [...page.vehicles].sort((a, b) => Number(b.id === copy.vehicleFirst) - Number(a.id === copy.vehicleFirst)) : page.vehicles

  return (
    <section id="vehicles" className="airport-vehicles airport-vehicles-combined" data-preview-section="fleet_pricing">
      <div className="airport-container">
        {/* The vehicle count sits at the bottom right of the intro, just above the cards. */}
        <div className="airport-vehicles-heading">
          <div>
            <p className="airport-eyebrow airport-eyebrow-light">Our fleet</p>
            <h2 className="text-balance">{copy.fleet?.heading ?? headingFor(fleetSection?.title, `The right car for your ${page.shortName} trip`)}</h2>
          </div>
        </div>
        <div className="airport-vehicles-intro">
          <div className="airport-vehicles-intro-copy">
          {copy.fleet ? copy.fleet.paragraphs.map((paragraph, index) => <p key={index} className={`airport-vehicles-heading-copy ${index > 0 ? "mt-3" : ""}`}>{paragraph}</p>) : <p className="airport-vehicles-heading-copy">{copy.vehiclesSubhead ?? "Compare seats and luggage space, then pick the car that fits your group."}</p>}
          {!copy.fleet && fleetSection && fleetHasBody && <div className="mt-4"><LeadAndMore blocks={fleetSection.body} document={fleetSection.bodyDocument} moreLabel={`More about ${page.shortName} fares and vehicles`} /></div>}
          </div>
          <p className="airport-vehicles-count">{page.vehicles.length} vehicles</p>
        </div>

        <div className="landing-fleet-grid">
          {orderedVehicles.map((vehicle, index) => <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} href={page.bookingLinks.toAirport} bestFor={copy.bestFor?.[vehicle.id]} description={copy.fleet?.descriptions[vehicle.id]} />)}
        </div>
        {copy.fleet && <p className="airport-vehicles-heading-copy mt-8">{copy.fleet.closing}</p>}
        {copy.fleet?.pricing && <BriefPricingPanel page={page} pricing={copy.fleet.pricing} />}
      </div>
    </section>
  )
}

/** On-board comfort cards shown on every airport and destination page; an airport can override them in AIRPORT_COPY. */
function defaultComfort(placeName: string): NonNullable<AirportCopy["comfort"]> {
  return {
    heading: "Comfort, every step of the way",
    subhead: `Small touches that make your ${placeName} transfer feel effortless.`,
    cards: [
      { icon: DoorOpen, title: "A Welcome Like No Other", text: "From the moment you arrive, the door is opened for you, and your luggage is taken care of — every detail considered to ensure your journey begins in comfort." },
      { icon: SlidersHorizontal, title: "You Set the Tone", text: "Settle back and relax. Where available, you’re welcome to adjust the cabin temperature, connect to onboard Wi-Fi, and play your own music to suit your preferences." },
      { icon: BatteryCharging, title: "Stay Connected on the Go", text: "Your devices stay powered throughout the journey, with iOS and Android charging options available in selected vehicles." },
      { icon: GlassWater, title: "The Little Extras", text: "Thoughtful touches come as standard — bottled water and tissues are provided to keep you refreshed and comfortable along the way." },
    ],
  }
}

function ComfortSection({ page }: { page: AirportPagePresentation }) {
  const copy = airportCopy(page)
  const comfort = copy.comfort ?? defaultComfort(page.shortName)
  return <ComfortCards comfort={{ ...comfort, heading: copy.comfortHeading ?? comfort.heading, subhead: copy.comfortSubhead ?? comfort.subhead }} />
}

/** The "Why book with us" section for a destination (place) page. */
export function PlaceWhyBookSection({ placeName }: { placeName: string }) {
  return (
    <section className="airport-benefits" data-preview-section="benefits">
      <div className="airport-container">
        <div className="airport-section-heading"><div><p className="airport-eyebrow">Why book with us</p><h2>Why travellers choose us for {placeName}</h2></div><p>Everything that makes a {placeName} pickup easy.</p></div>
        <div className="airport-benefits-grid"><div className="airport-benefit-copy"><BenefitCards cards={DEFAULT_BENEFIT_CARDS} /></div></div>
      </div>
    </section>
  )
}

/** The on-board comfort section for a destination (place) page. */
export function PlaceComfortSection({ placeName }: { placeName: string }) {
  return <ComfortCards comfort={defaultComfort(placeName)} />
}

function ComfortCards({ comfort }: { comfort: NonNullable<AirportCopy["comfort"]> }) {
  return (
    <section className="airport-comfort" data-preview-section="comfort">
      <div className="airport-container">
        <div className="airport-section-heading"><div><p className="airport-eyebrow">On board</p><h2>{comfort.heading}</h2></div><p>{comfort.subhead}</p></div>
        <div className="airport-benefits-grid"><div className="airport-benefit-copy">
          <div className="airport-facts-grid airport-benefit-card-grid">
            {comfort.cards.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="airport-benefit-card">
                <CardHeader className="airport-benefit-card-header"><Icon aria-hidden="true" /></CardHeader>
                <CardContent className="airport-benefit-card-content"><h3>{title}</h3><p>{text}</p></CardContent>
              </Card>
            ))}
          </div>
        </div></div>
      </div>
    </section>
  )
}

type TravelInfoContent = { heading: string; lead: React.ReactNode; cards: InfoCard[]; closing: string }

function TravelInfoPanel({ info }: { info: TravelInfoContent }) {
  return (
    <section className="airport-travel-info" data-preview-section="travel_information">
      <div className="airport-container">
        <div className="airport-travel-info-intro"><p className="airport-eyebrow">Plan your journey</p><h2>{info.heading}</h2>{info.lead}</div>
        <div className="airport-travel-info-grid">
          {info.cards.map(({ icon: Icon, title, items }, index) => (
            <article key={`${index}-${title}`} className="airport-travel-info-card">
              <h3>{Icon && <Icon aria-hidden="true" />}{title}</h3>
              <ul>{items.map((item, itemIndex) => {
                const [label, ...rest] = item.split(": ")
                return <li key={`${itemIndex}-${item}`}>{rest.length ? <><strong>{label}:</strong> {rest.join(": ")}</> : item}</li>
              })}</ul>
            </article>
          ))}
        </div>
        {info.closing && <p className="airport-travel-info-closing">{info.closing}</p>}
      </div>
    </section>
  )
}

function TravelInfoSection({ page }: { page: AirportPagePresentation }) {
  const info = airportCopy(page).travelInfo
  if (!info) return null
  return <TravelInfoPanel info={{ ...info, lead: [info.lead].flat().map((paragraph) => <p key={paragraph}>{paragraph}</p>) }} />
}

/** Cards for the CMS Travel information section: one bullet point per line, so a card needs a title and a line. */
function cmsTravelCards(section: AirportPageContentSection): InfoCard[] {
  if (section.type !== "travel_information") return []
  return (section.items ?? []).flatMap((item) => {
    const lines = item.text.split("\n").map((line) => line.trim()).filter(Boolean)
    return item.title && lines.length ? [{ icon: TRAVELLER_ICONS[item.icon], title: item.title, items: lines }] : []
  })
}

function CmsTravelInfoSection({ section, page }: { section: AirportPageContentSection; page: AirportPagePresentation }) {
  return <TravelInfoPanel info={{
    heading: headingFor(section.title, `${airportName(page)} Taxis and Transfers`),
    lead: hasBodyText(section) ? <RichText blocks={section.body} document={section.bodyDocument} /> : null,
    cards: cmsTravelCards(section),
    closing: section.fields.closing?.trim() ?? "",
  }} />
}

/** Driver vetting, shown on every airport and destination page; an airport can override it in AIRPORT_COPY. */
const DEFAULT_DRIVERS: NonNullable<AirportCopy["drivers"]> = {
  heading: "DBS Checked Drivers",
  paragraphs: [
    "Safety comes first. Every one of our drivers goes through a full Enhanced DBS background check before they start — no shortcuts. They also pass a medical, a local knowledge test, and a practical driving test to earn their private hire license. All checks are kept up to date, and every driver is fully insured.",
    "But there’s more to it than paperwork. Our drivers know the area really well, and they’re friendly faces who genuinely enjoy helping out. Need a restaurant tip? Wondering what to see? Just ask — they’re always happy to help.",
  ],
  checks: ["Enhanced DBS background check", "Medical assessment", "Local knowledge test", "Practical driving test", "Fully insured, checks kept up to date"],
}

function DriversSection({ page }: { page: AirportPagePresentation }) {
  return <DriversPanel drivers={airportCopy(page).drivers ?? DEFAULT_DRIVERS} />
}

/** The driver vetting section for a destination (place) page. */
export function PlaceDriversSection() {
  return <DriversPanel drivers={DEFAULT_DRIVERS} />
}

function DriversPanel({ drivers }: { drivers: NonNullable<AirportCopy["drivers"]> }) {
  return (
    <section className="airport-story" data-preview-section="drivers">
      <div className="airport-container airport-story-grid">
        <div className="airport-story-copy">
          <p className="airport-eyebrow">Your safety</p>
          <h2>{drivers.heading}</h2>
          <div className="mt-5 space-y-4 text-muted-foreground">{drivers.paragraphs.map((paragraph) => <p key={paragraph} className="leading-7">{paragraph}</p>)}</div>
        </div>
        <aside className="airport-cruise-panel">
          <span className="airport-cruise-icon"><BadgeCheck aria-hidden="true" /></span>
          <h3>Every driver, fully checked</h3>
          <ul className="airport-driver-checks">{drivers.checks.map((check) => <li key={check}><Check aria-hidden="true" />{check}</li>)}</ul>
        </aside>
      </div>
    </section>
  )
}

// Arrival steps for the pickup guide; facts mirror the Terms and FAQs.
const arrivalSteps = [
  { title: "Land and clear passport control.", text: "We're already tracking your flight, so there's no need to call." },
  { title: "Collect your bags.", text: "Your 60 minutes of free waiting starts when your flight lands." },
  { title: "Head to the meeting point.", text: "The exact spot is in your booking details. With meet & greet, your driver waits inside arrivals." },
  { title: "Walk to the car together.", text: "Your driver takes you door to door at your fixed fare." },
]

type PickupGuideContent = { heading: string; lead: React.ReactNode; stepsHeading: string; steps: { title: string; text: string }[]; dropHeading: string; dropText: string }

/** Steps for the CMS pickup guide; a step needs at least a title. */
function cmsPickupSteps(section: AirportPageContentSection) {
  return (section.items ?? []).filter((item) => item.title.trim()).map((item) => ({ title: item.title, text: item.text }))
}

function cmsPickup(section: AirportPageContentSection, page: AirportPagePresentation): PickupGuideContent {
  const name = airportName(page)
  return {
    heading: headingFor(section.title, `Taxi from ${name} – Meet Your Driver and Travel with Confidence`),
    lead: hasBodyText(section) ? <div className="airport-map-rich"><RichText blocks={section.body} document={section.bodyDocument} /></div> : null,
    stepsHeading: section.fields.stepsHeading?.trim() || `How Your ${name} Pickup Works`,
    steps: cmsPickupSteps(section),
    dropHeading: section.fields.dropHeading?.trim() || `${name} Drop-Off Service`,
    dropText: section.fields.dropText?.trim() || `If you are travelling to ${name} from elsewhere in the UK, your driver will take you to the terminal drop-off area. Allow enough time for traffic, check-in and airport security.`,
  }
}

/** "Know before you land": numbered pickup steps beside the airport map and a drop-off card. */
function PickupGuide({ page, pickup, reversed }: { page: AirportPagePresentation; pickup: PickupGuideContent; reversed: boolean }) {
  return (
    <section className={`airport-map-chapter ${reversed ? "airport-map-reversed" : ""}`} data-preview-section="map">
      <div className="airport-container">
        <div className="airport-pickup-head">
          <div>
            <p className="airport-eyebrow airport-eyebrow-light">Know before you land</p>
            <h2>{pickup.heading}</h2>
          </div>
          <div>{pickup.lead}</div>
        </div>
        <div className="airport-pickup-layout">
          <div>
            <h3 className="airport-pickup-title">{pickup.stepsHeading}</h3>
            <ol className="airport-pickup-cards">
              {pickup.steps.map((step, stepIndex) => <li key={`${stepIndex}-${step.title}`}><span>{String(stepIndex + 1).padStart(2, "0")}</span><h4>{step.title.replace(/\.$/, "")}</h4><p>{step.text}</p></li>)}
            </ol>
          </div>
          <div className="airport-pickup-side">
            {page.mapLocation && <AirportMapPreview location={page.mapLocation} terminals={page.terminals.length > 1 ? page.terminals.map((terminal) => ({ id: terminal.id, label: terminalLabel(terminal), latitude: terminal.latitude, longitude: terminal.longitude })) : []} />}
            <div className="airport-dropoff-card">
              <h3><PlaneTakeoff aria-hidden="true" />{pickup.dropHeading}</h3>
              <p>{pickup.dropText}</p>
              <div className="airport-card-actions">
                <Button nativeButton={false} render={<Link href={page.bookingLinks.fromAirport} />}>Book a {page.shortName} pickup <ArrowRight className="size-4" /></Button>
                <Button variant="secondary" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>Book a drop-off</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BuilderSection({ section, page, index }: { section: AirportPageContentSection; page: AirportPagePresentation; index: number }) {
  const reversed = index % 2 === 1
  if (section.type === "introduction") {
    // The CMS hero text is appended here unless the hero already shows this airport's own copy (no repeats).
    return <section className={`airport-introduction ${reversed ? "airport-introduction-reversed" : ""} ${airportCopy(page).intro ? "airport-introduction-long" : ""}`} data-preview-section="introduction"><div className="airport-container airport-introduction-grid"><div className="airport-introduction-copy"><p className="airport-eyebrow">{page.shortName} transfers at a glance</p><h2>{airportCopy(page).intro?.heading ?? headingFor(section.title, `${page.shortName} Airport transfers, priced before you book`)}</h2><div className="mt-5">{airportCopy(page).intro ? <div className="space-y-4 text-left text-muted-foreground">{airportCopy(page).intro!.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="leading-7">{paragraph}</p>)}{airportCopy(page).intro!.points && <ul className="airport-intro-points">{airportCopy(page).intro!.points!.map(({ title, text }) => <li key={title}><Check aria-hidden="true" /><span><strong>{title}</strong>{text}</span></li>)}</ul>}</div> : <LeadAndMore blocks={section.body} document={section.bodyDocument} moreLabel={`More about ${page.shortName} transfers`} extra={airportCopy(page).heroSubhead ? undefined : page.introDocument ? <TiptapRichText document={page.introDocument} /> : page.intro.length > 0 ? <div className="space-y-4 text-muted-foreground">{page.intro.map((paragraph) => <p key={paragraph} className="leading-7">{paragraph}</p>)}</div> : undefined} />}</div><Button className="mt-7" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>{airportCopy(page).intro?.cta ?? "Get My Fixed Price"} <ArrowRight className="size-4" /></Button></div>{section.image ? <div className="airport-introduction-media"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /><div className="airport-floating-note"><ShieldCheck aria-hidden="true" />{terminalsSummary(page) ? <span>Meet &amp; greet at {terminalsSummary(page)}<br /><small>Add it when you book</small></span> : <span>Door-to-door service<br /><small>Planned around your flight</small></span>}</div></div> : <div className="airport-introduction-media"><Image src="/hero-airport-transfer.webp" alt="A driver beside an executive car outside an airport terminal" fill sizes="(min-width: 900px) 50vw, 100vw" className="object-cover" /></div>}</div></section>
  }

  if (section.type === "benefits") {
    return <section className={`airport-benefits ${reversed ? "airport-benefits-reversed" : ""}`} data-preview-section="benefits"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">Why book with us</p><h2>{headingFor(section.title, airportCopy(page).benefitsHeading ?? `Why travellers choose us for ${page.shortName}`)}</h2></div><p>{airportCopy(page).benefitsSubhead ?? `Everything that makes a ${page.shortName} pickup easy.`}</p></div><div className="airport-benefits-grid"><div className="airport-benefit-copy"><BenefitCards cards={whyBookCards(page)} /></div>{section.image && <div className="airport-benefit-image"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /><div className="airport-image-caption"><ShieldCheck aria-hidden="true" /><span>Professional service, every mile</span></div></div>}</div>{airportCopy(page).benefitsClosing && <p className="airport-benefits-closing">{airportCopy(page).benefitsClosing}</p>}</div></section>
  }

  if (section.type === "fleet_pricing") {
    return null
  }

  // Guide cards show as "Plan your journey". The older text fields (food, hotels, Wi-Fi) don't help
  // someone booking a transfer, so an Airport Guide without cards shows nothing.
  if (section.type === "airport_guide" || section.type === "getting_to") return <CmsGuideSection section={section} page={page} />
  if (section.type === "departures") return <CmsDeparturesSection section={section} page={page} />

  // Pickup steps filled in on the CMS Airport map section replace the brief's pickup guide.
  if (section.type === "map" && cmsPickupSteps(section).length > 0) return <PickupGuide page={page} reversed={reversed} pickup={cmsPickup(section, page)} />
  const pickup = airportCopy(page).pickup
  if (section.type === "map" && pickup) return <PickupGuide page={page} reversed={reversed} pickup={{ ...pickup, lead: pickup.lead.map((paragraph) => <p key={paragraph} className="airport-map-lead">{paragraph}</p>) }} />

  if (section.type === "map") {
    return (
      <section className={`airport-map-chapter ${reversed ? "airport-map-reversed" : ""}`} data-preview-section="map">
        <div className="airport-container airport-map-grid">
          <div>
            <p className="airport-eyebrow airport-eyebrow-light">Know before you land</p>
            <h2>{headingFor(section.title, airportCopy(page).guideHeading ?? (page.terminals.length > 1 ? `Meeting your driver at ${page.shortName}` : `Your ${page.shortName} pickup, step by step`))}</h2>
            {page.terminals.length === 1 && <p className="airport-map-lead">{airportCopy(page).guideLead ?? `${airportLabel(page)} has a single terminal: one meeting point, and no terminal to choose when you book.`}</p>}
            {page.terminals.length > 1 && !hasContent(section) && <p className="airport-map-lead">{page.shortName} has {page.terminals.length} passenger terminals. Pick yours on the map to see exactly where it is before you land.</p>}
            {hasContent(section) && <div className="mt-5"><RichText blocks={section.body} document={section.bodyDocument} /></div>}
            <h3 className="airport-pickup-title">Arriving at {page.shortName}</h3>
            <ol className="airport-pickup-steps">
              {arrivalSteps.map((step, stepIndex) => <li key={step.title}><span>{stepIndex + 1}</span><p><strong>{step.title}</strong> {step.text}</p></li>)}
            </ol>
            <h3 className="airport-pickup-title">Departing from {page.shortName}</h3>
            <p className="airport-pickup-depart">Your driver drops you at the terminal drop-off area. For a short-haul flight, plan to arrive at least 2 hours before departure.</p>
          </div>
          {page.mapLocation && <AirportMapPreview location={page.mapLocation} terminals={page.terminals.length > 1 ? page.terminals.map((terminal) => ({ id: terminal.id, label: terminalLabel(terminal), latitude: terminal.latitude, longitude: terminal.longitude })) : []} />}
        </div>
      </section>
    )
  }

  if (cmsTravelCards(section).length > 0) return <CmsTravelInfoSection section={section} page={page} />
  // Plan Your Journey cards with no bullet points yet show nothing; one without a card list keeps the older text layout.
  if (section.type === "travel_information" && Array.isArray(section.items) && !hasBodyText(section)) return null
  if (section.type === "traveller_types") return <CmsTravellersSection section={section} page={page} />
  if (section.type === "place_links") return <CmsPlacesSection section={section} page={page} />
  if (hasPortCards(section)) return <CmsPortsSection section={section} page={page} />
  if (section.type === "reviews") return <ReviewSection page={page} title={section.title} />
  if (section.type === "related_destinations") return <RouteSection page={page} title={section.title} />
  if (section.type === "faq") return <FaqSection page={page} title={section.title} />
  return <StorySection section={section} index={index} page={page} />
}

// Fixed reading order: what it costs, why book, vehicles, how pickup works, routes, proof, then
// last-minute questions. Sections the CMS adds without a slot here sit after the pickup guide.
const SECTION_ORDER: Partial<Record<AirportPageContentSection["type"], number>> = {
  introduction: 10,
  benefits: 20,
  airport_guide: 40,
  getting_to: 41,
  departures: 44,
  map: 50,
  traveller_types: 62,
  place_links: 64,
  ferry_cruise: 68,
  related_destinations: 70,
  reviews: 80,
  faq: 90,
}
const COMFORT_ORDER = 25
const VEHICLES_ORDER = 30
const TRAVEL_INFO_ORDER = 45
const DRIVERS_ORDER = 55
const DEFAULT_ORDER = 60

export function AirportPageRenderer({ page, canonicalPath, showFooter = true, googleRating, stopPricing }: { page: AirportPagePresentation; canonicalPath?: string; showFooter?: boolean; googleRating?: GoogleRating | null; stopPricing?: StopPricing }) {
  const copy = airportCopy(page)
  const hidden = new Set(copy.hiddenSections ?? [])
  // A brief that hides the CMS Ferry & cruise text still shows CMS port cards, which replace the brief's own ports.
  const visibleSections = page.sections.filter((section) => section.visible && (!hidden.has(section.type) || (hasPortCards(section) && cmsPlaces(section).length > 0)))
  const configuredSectionTypes = new Set(page.sections.map((section) => section.type))
  // CMS travel information cards take the slot of the brief's travel information, which they replace.
  const cmsTravelInfo = visibleSections.some((section) => cmsTravelCards(section).length > 0)
  const rank = (section: AirportPageContentSection) => cmsTravelCards(section).length > 0 ? copy.travelInfoOrder ?? TRAVEL_INFO_ORDER : SECTION_ORDER[section.type] ?? DEFAULT_ORDER
  const orderedSections = visibleSections.map((section, position) => ({ section, position })).sort((a, b) => rank(a.section) - rank(b.section) || a.position - b.position).map(({ section }) => section)

  const blocks: [number, React.ReactNode][] = orderedSections.map((section, index) => [rank(section), <BuilderSection key={section.id} section={section} page={page} index={index} />])
  // A filled-in CMS section replaces the same section from the airport's code brief, so it isn't shown twice.
  const cmsReplaces = (type: AirportPageContentSection["type"], cards: (section: AirportPageContentSection) => unknown[]) => visibleSections.some((section) => section.type === type && cards(section).length > 0)
  const replacedBriefKeys = [(cmsReplaces("airport_guide", cmsGuideGroups) || cmsReplaces("getting_to", cmsGuideGroups)) && "-guide", cmsReplaces("departures", cmsDepartureCards) && "-departures",cmsReplaces("traveller_types", cmsTravellerCards) && "-travellers", cmsReplaces("place_links", cmsPlaces) && "-cities", cmsReplaces("ferry_cruise", (section) => hasPortCards(section) ? cmsPlaces(section) : []) && "-ports"].filter((suffix): suffix is string => Boolean(suffix))
  for (const { key, order, Component } of copy.extraSections ?? []) if (!replacedBriefKeys.some((suffix) => key.endsWith(suffix))) blocks.push([order, <Component key={key} page={page} />])
  blocks.push([copy.comfortOrder ?? COMFORT_ORDER, <ComfortSection key="comfort" page={page} />])
  if (!cmsTravelInfo) blocks.push([copy.travelInfoOrder ?? TRAVEL_INFO_ORDER, <TravelInfoSection key="travel-info" page={page} />])
  blocks.push([DRIVERS_ORDER, <DriversSection key="drivers" page={page} />])
  blocks.push([VEHICLES_ORDER, <VehicleSection key="vehicles" page={page} fleetSection={visibleSections.find((section) => section.type === "fleet_pricing")} />])
  if (!configuredSectionTypes.has("related_destinations") && !hidden.has("related_destinations")) blocks.push([SECTION_ORDER.related_destinations!, <RouteSection key="routes" page={page} />])
  if (!configuredSectionTypes.has("reviews")) blocks.push([SECTION_ORDER.reviews!, <ReviewSection key="reviews" page={page} />])
  if (!configuredSectionTypes.has("faq")) blocks.push([SECTION_ORDER.faq!, <FaqSection key="faq" page={page} />])
  blocks.sort((a, b) => a[0] - b[0])
  const finalCtaHasBody = page.finalCta.bodyDocument ? JSON.stringify(page.finalCta.bodyDocument).includes("\"text\"") : page.finalCta.body.some((block) => block.text.trim())

  return (
    <div className="airport-page flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {page.heroImage ? (
          <section className="airport-hero">
            <div className="airport-hero-image"><ResilientImage className="size-full object-cover" src={page.heroImage.secureUrl} alt={page.heroImage.altText} sizes="(max-width: 639px) 75vw, 100vw" priority overlay /></div>
            <div className="airport-hero-shade" />
            <div className="airport-container airport-hero-content">
              <AirportHeroCopy page={page} canonicalPath={canonicalPath} googleRating={googleRating} />
              <AirportHeroQuote page={page} stopPricing={stopPricing} />
            </div>
            <div className="airport-trust-rail"><div className="airport-container airport-trust-grid">{trustItems.map(({ icon: TrustIcon, title, text }) => <div key={title}><TrustIcon aria-hidden="true" /><span><strong>{title}</strong><small>{text}</small></span></div>)}</div></div>
          </section>
        ) : (
          <section className="airport-hero airport-hero-fallback"><div className="airport-container airport-hero-content"><AirportHeroCopy page={page} canonicalPath={canonicalPath} googleRating={googleRating} /><AirportHeroQuote page={page} stopPricing={stopPricing} /></div></section>
        )}

        {blocks.map(([, block]) => block)}

        <section className="airport-final-wrap">
          <div className="airport-container">
            <div className="airport-final-cta">
              <div className="airport-final-copy">
                <p className="airport-eyebrow airport-eyebrow-light">{page.shortName} airport transfers</p>
                <h2>{page.bookingAvailable === false ? "Need help with your airport transfer?" : copy.final?.heading ?? headingFor(page.finalCta.heading, copy.finalHeading ?? (page.terminals.length > 1 ? `Landing at ${page.shortName}? Your driver's ready.` : `Flying into ${page.shortName}? Your driver's ready.`))}</h2>
                {page.bookingAvailable === false ? <p>Online booking is temporarily unavailable. Our team can help with your journey.</p> : copy.final ? <div className="space-y-4">{copy.final.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<p><strong>{copy.final.tagline}</strong></p></div> : finalCtaHasBody ? <div><RichText blocks={page.finalCta.body} document={page.finalCta.bodyDocument} /></div> : <p>{page.terminals.length > 1 ? "Know who's meeting you, at which terminal and exactly what you'll pay, before you fly." : "Know where your driver will be and exactly what you'll pay, before you even pack. We track your flight and adjust your pickup if you land early or late."}</p>}
                <div className="airport-final-points">
                  <span><Check aria-hidden="true" /> Fixed fare</span>
                  <span><Check aria-hidden="true" /> Flight tracked</span>
                  <span><Check aria-hidden="true" /> {airportCopy(page).finalChip ?? (page.terminals.length > 1 ? "All terminals" : "60 min free waiting")}</span>
                </div>
              </div>
              <div className="airport-final-action">
                <span className="airport-final-icon"><PlaneLanding aria-hidden="true" /></span>
                <h3>Your {page.shortName} fixed price is 30 seconds away.</h3>
                <p>Enter your route, see your fare, book in a few taps.</p>
                <Button size="lg" variant="secondary" nativeButton={false} render={<Link href={page.bookingAvailable === false ? "/Contact-Us" : page.bookingLinks.toAirport} />}>{page.bookingAvailable === false ? "Contact our team" : "Get My Fixed Price"}<ArrowRight className="size-4" /></Button>
                {page.bookingAvailable !== false && <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="airport-final-secondary">Prefer to talk? WhatsApp us <ArrowRight aria-hidden="true" /></a>}
              </div>
            </div>
          </div>
        </section>
      </main>
      {showFooter && <SiteFooter />}
    </div>
  )
}
