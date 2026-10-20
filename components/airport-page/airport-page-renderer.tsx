import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BatteryCharging,
  Car,
  Check,
  Clock3,
  DoorOpen,
  GlassWater,
  Headphones,
  Luggage,
  MapPin,
  Navigation,
  PlaneLanding,
  PlaneTakeoff,
  ShieldCheck,
  Baby,
  Ship,
  SlidersHorizontal,
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
import { GOOGLE_REVIEW_PLACE_ID } from "@/lib/company"
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

function TiptapRichText({ document }: { document: TiptapDocument }) {
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
const PLACEHOLDER_TITLES = new Set(["introduction", "benefits & service facts", "airport guide", "airport map", "popular transfer routes", "google reviews", "airport faqs", "frequently asked questions", "fleet & pricing", "find the right vehicle for your journey", "ready to book your airport transfer?", "ferry & cruise information"])

function headingFor(title: string | undefined, fallback: string) {
  return title && !PLACEHOLDER_TITLES.has(title.trim().toLowerCase()) ? title : fallback
}

/** "London Luton (LTN)" -> "London Luton Airport (LTN)", from the primary terminal's name. */
function airportLabel(page: AirportPagePresentation) {
  const name = (page.terminals.find((terminal) => terminal.isPrimary) ?? page.terminals[0])?.name.split(" - ")[0]
  return name ? name.replace(/\s*\(([A-Z]{3})\)/, " Airport ($1)") : `${page.shortName} Airport`
}

function hasContent(section: AirportPageContentSection) {
  const text = section.bodyDocument ? JSON.stringify(section.bodyDocument).includes('"text"') : section.body.some((block) => block.text.trim())
  return text || Object.values(section.fields).some((value) => value.trim())
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
function LeadAndMore({ blocks, document, extra, moreLabel }: { blocks: RichTextBlock[]; document?: TiptapDocument; extra?: React.ReactNode; moreLabel: string }) {
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

// Facts here mirror the Terms and Help Centre; keep them in step.
const trustItems = [
  { icon: Banknote, title: "Fixed fares", text: "No meters, no surge" },
  { icon: PlaneTakeoff, title: "Flight tracking", text: "Moves with your flight" },
  { icon: UsersRound, title: "Meet & greet", text: "Add it when you book" },
  { icon: ShieldCheck, title: "Licensed drivers", text: "Licensed and vetted" },
  { icon: Headphones, title: "24/7 support", text: "Phone or WhatsApp" },
]

type InfoCard = { icon: typeof Banknote; title: string; items: string[] }

type AirportCopy = {
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
  /** On-board comfort cards, shown after "Why book with us". */
  comfort?: { heading: string; subhead: string; cards: { icon: typeof Banknote; title: string; text: string }[] }
  /** Local travel facts as cards, shown before the pickup guide. */
  travelInfo?: { heading: string; lead: string; cards: InfoCard[]; closing: string }
  /** Driver vetting, shown after the pickup guide. */
  drivers?: { heading: string; paragraphs: string[]; checks: string[] }
}

const AIRPORT_COPY: Record<string, AirportCopy> = {
  Heathrow: {
    heroHeading: "Reliable Heathrow Transfers - to and from Airport",
    heroSubhead: "Book a reliable taxi to Heathrow Airport with One Airport Taxi and travel at a fixed price agreed in advance. Whether you need a Heathrow airport taxi to Terminal 2, 3, 4 or 5, or a taxi from Heathrow to London and beyond, we track your flight, meet you on arrival and include up to 60 minutes of complimentary waiting time. Choose from saloon cars, executive cars, MPVs and 8-seater minibuses, with no hidden fees.",
    heroCallLine: true,
    benefitCards: [
      { icon: Banknote, title: "Fixed Fare", text: "Your quoted fare includes pickup/drop-off charges, tolls, parking, and congestion charges. Optional Meet & Greet and additional waiting time are extra." },
      { icon: Headphones, title: "24/7 Support", text: "Our dedicated support team is available around the clock to assist you with any inquiries or issues." },
      { icon: ShieldCheck, title: "Licensed drivers", text: "Ride with confidence knowing our experienced and courteous drivers are committed to your comfort and safety." },
      { icon: PlaneTakeoff, title: "Flight tracking", text: "We track your flight status in real time to ensure timely pickups, even if your flight is delayed." },
      { icon: UsersRound, title: "Meet & Greet", text: "Drivers wait inside the airport up to 60 minutes; flight delays monitored." },
    ],
    comfort: {
      heading: "Comfort, every step of the way",
      subhead: "Small touches that make your Heathrow transfer feel effortless.",
      cards: [
        { icon: DoorOpen, title: "A Welcome Like No Other", text: "From the moment you arrive, the door is opened for you, and your luggage is taken care of — every detail considered to ensure your journey begins in comfort." },
        { icon: SlidersHorizontal, title: "You Set the Tone", text: "Settle back and relax. Where available, you’re welcome to adjust the cabin temperature, connect to onboard Wi-Fi, and play your own music to suit your preferences." },
        { icon: BatteryCharging, title: "Stay Connected on the Go", text: "Your devices stay powered throughout the journey, with iOS and Android charging options available in selected vehicles." },
        { icon: GlassWater, title: "The Little Extras", text: "Thoughtful touches come as standard — bottled water and tissues are provided to keep you refreshed and comfortable along the way." },
      ],
    },
    travelInfo: {
      heading: "Heathrow Airport Taxis and Transfers",
      lead: "Located in West London, Heathrow is the UK’s busiest airport and one of the busiest in the world, serving over 80 million passengers a year across four terminals. Book online for a reliable ride, Meet and Greet service, and free waiting time for flight delays.",
      cards: [
        { icon: TrainFront, title: "Key Travel Info", items: [
          "Airports nearby: London City Airport (22 miles) and Gatwick Airport (40 miles).",
          "Rail links: Heathrow Express (15 mins to Paddington), Elizabeth line (45 mins to Central London), and the Piccadilly line serve all terminals.",
          "Road access: M25 (Junctions 14 & 15) for routes across the UK, M4 for direct city access, and A4 Bath Road for the northern terminals.",
          "Drop-off charges included: Heathrow charges £7 per drop-off at the terminal forecourts (10-minute max stay). When you book with us, the drop-off charge is already included in your fixed fare — no surprise fees at the airport.",
        ] },
        { icon: Car, title: "Driving Times to Major Cities", items: [
          "Oxford: 1 hour 40 minutes – 2 hours 15 minutes (65 miles)",
          "Cambridge: 1 hour 5 minutes – 1 hour 25 minutes (56 miles)",
          "Brighton: 1 hour 45 minutes – 2 hours 20 minutes (74 miles)",
          "Southampton: 2 hours 10 minutes – 2 hours 50 minutes (88 miles)",
          "Bristol: 2 hours 30 minutes – 3 hours 20 minutes (134 miles)",
        ] },
      ],
      closing: "From early morning departures at Terminal 5 to late-night long-haul arrivals, book your Heathrow Airport taxi in advance for a fixed fare and a driver ready and waiting — no matter what time you fly.",
    },
    drivers: {
      heading: "DBS Checked Drivers",
      paragraphs: [
        "Safety comes first. Every one of our drivers goes through a full Enhanced DBS background check before they start — no shortcuts. They also pass a medical, a local knowledge test, and a practical driving test to earn their private hire license. All checks are kept up to date, and every driver is fully insured.",
        "But there’s more to it than paperwork. Our drivers know the area really well, and they’re friendly faces who genuinely enjoy helping out. Need a restaurant tip? Wondering what to see? Just ask — they’re always happy to help.",
      ],
      checks: ["Enhanced DBS background check", "Medical assessment", "Local knowledge test", "Practical driving test", "Fully insured, checks kept up to date"],
    },
  },
  // A short-hop, business-heavy airport by Canary Wharf and the City: speed, punctuality, a smart car.
  "London City": {
    heroSubhead: "Fixed-price transfers from London City to Canary Wharf, the City and beyond. Your driver tracks your flight and is ready when you walk out.",
    heroNotes: ["No account needed", "Invoice on request", "No surge pricing"],
    benefitsHeading: "Built for fast, on-time City trips",
    benefitsSubhead: "From landing to your meeting with no fuss, at a price agreed in advance.",
    benefitCards: [
      { icon: Banknote, title: "One fixed fare", text: "Set by your route and locked in when you book. No meter running in City traffic." },
      { icon: PlaneTakeoff, title: "Ready when you walk out", text: "We track your flight, so your driver is ready as you come through arrivals." },
      { icon: UsersRound, title: "Executive cars on request", text: "A premium car for client meetings or a smarter arrival." },
      { icon: Headphones, title: "Invoices for expense claims", text: "Ask and we'll email an invoice for any trip, ready for your expense claim." },
    ],
    guideHeading: "Your London City pickup",
    guideLead: "One compact terminal, so you'll be with your driver within minutes of landing. No terminal to choose when you book.",
    routesSubhead: "Business districts, Central London and airport connections at fixed prices.",
    vehiclesSubhead: "Executive cars available for business travel. Compare seats and luggage space, then pick the car that fits.",
    vehicleFirst: "executive",
    bestFor: { executive: "Best for client meetings and business travel" },
    finalHeading: "Landing at London City? Your driver's ready.",
    finalChip: "Executive cars",
  },
}

function airportCopy(page: AirportPagePresentation): AirportCopy {
  return AIRPORT_COPY[page.shortName] ?? {}
}

function whyBookCards(page: AirportPagePresentation) {
  const custom = airportCopy(page).benefitCards
  if (custom) return custom
  return [
    { icon: Banknote, title: "A fixed fare, confirmed before you pay", text: "Set by your exact route, with no surge pricing and no meter running in traffic." },
    { icon: PlaneTakeoff, title: "Flight tracking", text: "We follow your flight live and adjust your pickup if you land early or late." },
    { icon: UsersRound, title: page.terminals.length > 1 ? "Meet & greet at every terminal" : "Meet & greet in arrivals", text: "Add it when you book and your driver waits for you inside arrivals with your name." },
    { icon: Clock3, title: "60 minutes free waiting", text: "Counted from landing, so passport control and baggage reclaim are covered." },
    { icon: Baby, title: "Child seats on request", text: "Add a child seat when you book and it's fitted before pickup." },
    { icon: Headphones, title: "24/7 UK support", text: "Call or WhatsApp a real person, day or night." },
  ]
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
      {airportCopy(page).heroCallLine && <p className="airport-hero-call">Get a free instant {page.shortName} taxi quote today, or call our team on <a href={`tel:${CALL_NUMBER}`}>{CALL_NUMBER}</a> to book.</p>}
      <div className="airport-hero-proof">
        <p className="airport-quote-notes">
          {(airportCopy(page).heroNotes ?? ["No account needed", "No surge pricing", "Free flight tracking"]).map((note) => <span key={note}>{note}</span>)}
        </p>
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

function RouteSection({ page, title }: { page: AirportPagePresentation; title?: string }) {
  if (page.relatedDestinations.length === 0) return null
  return <section className="airport-routes" data-preview-section="related_destinations"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">Most booked</p><h2>{headingFor(title, `Popular routes from ${page.shortName}`)}</h2></div><p>{airportCopy(page).routesSubhead ?? "Airport-to-airport and city transfers at fixed prices."}</p></div><div className="airport-route-grid">{page.relatedDestinations.map((related, index) => <article key={related.id} className="airport-route-card">{related.image ? <ResilientImage className="airport-route-image" src={related.image} alt={related.displayName} /> : <div className="airport-route-image airport-route-placeholder"><Navigation aria-hidden="true" /></div>}<div className="airport-route-overlay" /><div className="airport-route-content"><span>Route {String(index + 1).padStart(2, "0")}</span><h3><Link href={related.href}>{page.shortName} to {related.displayName}</Link></h3><p>{related.description}</p><Link className="airport-route-link" href={related.bookingLinks.toAirport}>See fares <ArrowRight aria-hidden="true" /></Link></div></article>)}</div></div></section>
}

function ReviewSection({ title }: { page: AirportPagePresentation; title?: string }) {
  return <GoogleBusinessReviewsWidget placeId={GOOGLE_REVIEW_PLACE_ID} variant="airport" title={headingFor(title, "Trusted by travellers across London.")} />
}

function FaqSection({ page, title }: { page: AirportPagePresentation; title?: string }) {
  return <section className="airport-faq" data-preview-section="faq"><div className="airport-container airport-faq-grid"><div className="airport-faq-heading"><p className="airport-eyebrow">Need to know</p><h2>{headingFor(title, `${page.shortName} Airport transfer FAQs`)}</h2><p>Quick answers before you fly into or out of {page.shortName}.</p><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">Still have a question? WhatsApp us <ArrowRight aria-hidden="true" /></a></div><Accordion className="airport-faq-list" multiple defaultValue={["faq-0"]}>{page.faqs.map((faq, index) => <AccordionItem key={`${faq.question}-${index}`} value={`faq-${index}`}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionPanel>{faq.answer}{faq.link && <> <Link className="font-semibold text-primary underline underline-offset-4" href={faq.link.href}>{faq.link.label}</Link>.</>}</AccordionPanel></AccordionItem>)}</Accordion></div></section>
}

// Six short standard cards on every airport page, so each one states the same, accurate terms.
function BenefitCards({ page }: { page: AirportPagePresentation }) {
  return (
    <div className="airport-facts-grid airport-benefit-card-grid">
      {whyBookCards(page).map(({ icon: Icon, title, text }, index) => (
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
            <h2 className="text-balance">{headingFor(fleetSection?.title, `The right car for your ${page.shortName} trip`)}</h2>
          </div>
        </div>
        <div className="airport-vehicles-intro">
          <div className="airport-vehicles-intro-copy">
          <p className="airport-vehicles-heading-copy">{airportCopy(page).vehiclesSubhead ?? "Compare seats and luggage space, then pick the car that fits your group."}</p>
          {fleetSection && fleetHasBody && <div className="mt-4"><LeadAndMore blocks={fleetSection.body} document={fleetSection.bodyDocument} moreLabel={`More about ${page.shortName} fares and vehicles`} /></div>}
          </div>
          <p className="airport-vehicles-count">{page.vehicles.length} vehicles</p>
        </div>

        <div className="landing-fleet-grid">
          {orderedVehicles.map((vehicle, index) => <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} href={page.bookingLinks.toAirport} bestFor={copy.bestFor?.[vehicle.id]} />)}
        </div>
      </div>
    </section>
  )
}

function ComfortSection({ page }: { page: AirportPagePresentation }) {
  const comfort = airportCopy(page).comfort
  if (!comfort) return null
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

function TravelInfoSection({ page }: { page: AirportPagePresentation }) {
  const info = airportCopy(page).travelInfo
  if (!info) return null
  return (
    <section className="airport-travel-info" data-preview-section="travel_information">
      <div className="airport-container">
        <div className="airport-travel-info-intro"><p className="airport-eyebrow">Plan your journey</p><h2>{info.heading}</h2><p>{info.lead}</p></div>
        <div className="airport-travel-info-grid">
          {info.cards.map(({ icon: Icon, title, items }) => (
            <article key={title} className="airport-travel-info-card">
              <h3><Icon aria-hidden="true" />{title}</h3>
              <ul>{items.map((item) => {
                const [label, ...rest] = item.split(": ")
                return <li key={item}>{rest.length ? <><strong>{label}:</strong> {rest.join(": ")}</> : item}</li>
              })}</ul>
            </article>
          ))}
        </div>
        <p className="airport-travel-info-closing">{info.closing}</p>
      </div>
    </section>
  )
}

function DriversSection({ page }: { page: AirportPagePresentation }) {
  const drivers = airportCopy(page).drivers
  if (!drivers) return null
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

// Arrival steps for the pickup guide; facts mirror the Terms and Help Centre.
const arrivalSteps = [
  { title: "Land and clear passport control.", text: "We're already tracking your flight, so there's no need to call." },
  { title: "Collect your bags.", text: "Your 60 minutes of free waiting starts when your flight lands." },
  { title: "Head to the meeting point.", text: "The exact spot is in your booking details. With meet & greet, your driver waits inside arrivals." },
  { title: "Walk to the car together.", text: "Your driver takes you door to door at your fixed fare." },
]

function BuilderSection({ section, page, index }: { section: AirportPageContentSection; page: AirportPagePresentation; index: number }) {
  const reversed = index % 2 === 1
  if (section.type === "introduction") {
    return <section className={`airport-introduction ${reversed ? "airport-introduction-reversed" : ""}`} data-preview-section="introduction"><div className="airport-container airport-introduction-grid"><div className="airport-introduction-copy"><p className="airport-eyebrow">{page.shortName} transfers at a glance</p><h2>{headingFor(section.title, `${page.shortName} Airport transfers, priced before you book`)}</h2><div className="mt-5"><LeadAndMore blocks={section.body} document={section.bodyDocument} moreLabel={`More about ${page.shortName} transfers`} extra={page.introDocument ? <TiptapRichText document={page.introDocument} /> : page.intro.length > 0 ? <div className="space-y-4 text-muted-foreground">{page.intro.map((paragraph) => <p key={paragraph} className="leading-7">{paragraph}</p>)}</div> : undefined} /></div><Button className="mt-7" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>Get My Fixed Price <ArrowRight className="size-4" /></Button></div>{section.image ? <div className="airport-introduction-media"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /><div className="airport-floating-note"><ShieldCheck aria-hidden="true" />{terminalsSummary(page) ? <span>Meet &amp; greet at {terminalsSummary(page)}<br /><small>Add it when you book</small></span> : <span>Door-to-door service<br /><small>Planned around your flight</small></span>}</div></div> : <div className="airport-introduction-media"><Image src="/hero-airport-transfer.png" alt="A driver beside an executive car outside an airport terminal" fill sizes="(min-width: 900px) 50vw, 100vw" className="object-cover" /></div>}</div></section>
  }

  if (section.type === "benefits") {
    return <section className={`airport-benefits ${reversed ? "airport-benefits-reversed" : ""}`} data-preview-section="benefits"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">Why book with us</p><h2>{headingFor(section.title, airportCopy(page).benefitsHeading ?? `Why travellers choose us for ${page.shortName}`)}</h2></div><p>{airportCopy(page).benefitsSubhead ?? `Everything that makes a ${page.shortName} pickup easy.`}</p></div><div className="airport-benefits-grid"><div className="airport-benefit-copy"><BenefitCards page={page} /></div>{section.image && <div className="airport-benefit-image"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /><div className="airport-image-caption"><ShieldCheck aria-hidden="true" /><span>Professional service, every mile</span></div></div>}</div></div></section>
  }

  if (section.type === "fleet_pricing") {
    return null
  }

  // Facility cards (food, hotels, Wi-Fi) don't help someone booking a transfer; the pickup guide in
  // the map section answers "where do I meet my driver?" instead.
  if (section.type === "airport_guide") return null

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
  map: 50,
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
  const visibleSections = page.sections.filter((section) => section.visible)
  const configuredSectionTypes = new Set(page.sections.map((section) => section.type))
  const rank = (section: AirportPageContentSection) => SECTION_ORDER[section.type] ?? DEFAULT_ORDER
  const orderedSections = visibleSections.map((section, position) => ({ section, position })).sort((a, b) => rank(a.section) - rank(b.section) || a.position - b.position).map(({ section }) => section)

  const blocks: [number, React.ReactNode][] = orderedSections.map((section, index) => [rank(section), <BuilderSection key={section.id} section={section} page={page} index={index} />])
  blocks.push([COMFORT_ORDER, <ComfortSection key="comfort" page={page} />])
  blocks.push([TRAVEL_INFO_ORDER, <TravelInfoSection key="travel-info" page={page} />])
  blocks.push([DRIVERS_ORDER, <DriversSection key="drivers" page={page} />])
  blocks.push([VEHICLES_ORDER, <VehicleSection key="vehicles" page={page} fleetSection={visibleSections.find((section) => section.type === "fleet_pricing")} />])
  if (!configuredSectionTypes.has("related_destinations")) blocks.push([SECTION_ORDER.related_destinations!, <RouteSection key="routes" page={page} />])
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
            <div className="airport-hero-image"><ResilientImage className="size-full object-cover" src={page.heroImage.secureUrl} alt={page.heroImage.altText} /></div>
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
                <h2>{page.bookingAvailable === false ? "Need help with your airport transfer?" : headingFor(page.finalCta.heading, airportCopy(page).finalHeading ?? (page.terminals.length > 1 ? `Landing at ${page.shortName}? Your driver's ready.` : `Flying into ${page.shortName}? Your driver's ready.`))}</h2>
                {page.bookingAvailable === false ? <p>Online booking is temporarily unavailable. Our team can help with your journey.</p> : finalCtaHasBody ? <div><RichText blocks={page.finalCta.body} document={page.finalCta.bodyDocument} /></div> : <p>{page.terminals.length > 1 ? "Know who's meeting you, at which terminal and exactly what you'll pay, before you fly." : "Know where your driver will be and exactly what you'll pay, before you even pack. We track your flight and adjust your pickup if you land early or late."}</p>}
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
                <Button size="lg" variant="secondary" nativeButton={false} render={<Link href={page.bookingAvailable === false ? "/contact" : page.bookingLinks.toAirport} />}>{page.bookingAvailable === false ? "Contact our team" : "Get My Fixed Price"}<ArrowRight className="size-4" /></Button>
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
