import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Banknote,
  Check,
  Clock3,
  Headphones,
  Luggage,
  MapPin,
  Navigation,
  PlaneLanding,
  PlaneTakeoff,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react"
import { AirportMapPreview } from "@/components/airport-page/airport-map-preview"
import { VEHICLE_BEST_FOR } from "@/lib/fleet"
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
import { WHATSAPP_LINK } from "@/lib/contact"
import type { GoogleRating } from "@/lib/google-rating"
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
const PLACEHOLDER_TITLES = new Set(["introduction", "benefits & service facts", "airport guide", "airport map", "popular transfer routes", "google reviews", "airport faqs", "frequently asked questions", "fleet & pricing", "find the right vehicle for your journey", "ready to book your airport transfer?"])

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

// Facts here mirror the Terms and Help Centre; keep them in step.
const trustItems = [
  { icon: Banknote, title: "Fixed fares", text: "No meters, no surge" },
  { icon: PlaneTakeoff, title: "Flight tracking", text: "Moves with your flight" },
  { icon: UsersRound, title: "Meet & greet", text: "Add it when you book" },
  { icon: ShieldCheck, title: "Licensed drivers", text: "Licensed and vetted" },
  { icon: Headphones, title: "24/7 support", text: "Phone or WhatsApp" },
]

const whyBookCards = [
  { icon: Banknote, title: "A fixed fare, confirmed before you pay", text: "Your price is set by your exact route, with no surge pricing and no meter running in traffic." },
  { icon: PlaneTakeoff, title: "Flight tracking", text: "We track your flight live and move your pickup if you land early or late. Add meet & greet to be met inside arrivals." },
  { icon: Clock3, title: "45 minutes free waiting", text: "Counted from when your flight actually lands, so passport control and baggage reclaim are covered." },
  { icon: Headphones, title: "24/7 UK support", text: "Call or WhatsApp a real person at any hour, including before an early departure." },
]

function AirportHeroQuote({ page }: { page: AirportPagePresentation }) {
  return (
    <div className="airport-quote-wrap">
      <h2 className="airport-quote-heading">Get your {page.shortName} fixed price in 30 seconds</h2>
      <AirportQuoteActions page={page} onDarkBackground />
    </div>
  )
}

function AirportHeroCopy({ page, canonicalPath, googleRating }: { page: AirportPagePresentation; canonicalPath?: string; googleRating?: GoogleRating | null }) {
  return (
    <div className="airport-hero-copy">
      <div className="airport-hero-heading">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Airport Transfers", href: "/airport-transfers" }, { label: page.shortName, href: canonicalPath }]} className="[&_span]:text-white/90 [&_svg]:text-white/40 [&_a]:text-white/70" />
        <p className="airport-rating"><PlaneLanding aria-hidden="true" /><span>{airportLabel(page)}</span></p>
        <h1>{page.heading}</h1>
      </div>
      {page.introDocument ? <div className="airport-hero-intro"><TiptapRichText document={page.introDocument} /></div> : page.intro.map((paragraph) => <p key={paragraph} className="airport-hero-intro">{paragraph}</p>)}
      <div className="airport-hero-proof">
        <p className="airport-quote-notes">
          <span>No account needed</span>
          <span>No surge pricing</span>
          <span>Free flight tracking</span>
        </p>
        <p className="airport-hero-rating">
          {googleRating && <><span className="airport-hero-stars">{Array.from({ length: 5 }).map((_, i) => <Star aria-hidden="true" key={i} />)}</span><strong>Rated {googleRating.rating.toFixed(1)} on Google from {googleRating.reviewCount.toLocaleString("en-GB")} reviews</strong><span aria-hidden="true">·</span></>}
          <a href="#reviews">{googleRating ? "Read reviews" : "Read our Google reviews"}</a>
        </p>
      </div>
    </div>
  )
}

function StorySection({ section, index }: { section: AirportPageContentSection; index: number }) {
  const Icon = storyIcons[index % storyIcons.length]
  const reversed = index % 2 === 1

  return (
    <section className={`airport-story ${reversed ? "airport-story-reversed" : ""}`} data-preview-section={section.type}>
      <div className="airport-container airport-story-grid">
        <div className="airport-story-copy">
          <h2>{section.title}</h2>
          <div className="mt-5"><RichText blocks={section.body} document={section.bodyDocument} /></div>
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
        ) : (
          <div className="airport-story-placeholder" aria-hidden="true"><Icon /><span>{sectionLabels[section.type] ?? "Airport transfer"}</span></div>
        )}
      </div>
    </section>
  )
}

function RouteSection({ page, title }: { page: AirportPagePresentation; title?: string }) {
  if (page.relatedDestinations.length === 0) return null
  return <section className="airport-routes" data-preview-section="related_destinations"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">Most booked</p><h2>{headingFor(title, `Popular routes from ${page.shortName}`)}</h2></div><p>Airport-to-airport and city transfers at fixed prices.</p></div><div className="airport-route-grid">{page.relatedDestinations.map((related, index) => <article key={related.id} className="airport-route-card">{related.image ? <ResilientImage className="airport-route-image" src={related.image} alt={related.displayName} /> : <div className="airport-route-image airport-route-placeholder"><Navigation aria-hidden="true" /></div>}<div className="airport-route-overlay" /><div className="airport-route-content"><span>Route {String(index + 1).padStart(2, "0")}</span><h3><Link href={related.href}>{page.shortName} to {related.displayName}</Link></h3><p>{related.description}</p><Link className="airport-route-link" href={related.bookingLinks.toAirport}>See fares <ArrowRight aria-hidden="true" /></Link></div></article>)}</div></div></section>
}

function ReviewSection({ title }: { page: AirportPagePresentation; title?: string }) {
  return <GoogleBusinessReviewsWidget placeId={GOOGLE_REVIEW_PLACE_ID} variant="airport" title={headingFor(title, "Trusted by travellers across London.")} />
}

function FaqSection({ page, title }: { page: AirportPagePresentation; title?: string }) {
  return <section className="airport-faq" data-preview-section="faq"><div className="airport-container airport-faq-grid"><div className="airport-faq-heading"><p className="airport-eyebrow">Need to know</p><h2>{headingFor(title, `${page.shortName} Airport transfer FAQs`)}</h2><p>Quick answers before you fly into or out of {page.shortName}.</p><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">Still have a question? WhatsApp us <ArrowRight aria-hidden="true" /></a></div><Accordion className="airport-faq-list" multiple defaultValue={["faq-0"]}>{page.faqs.map((faq, index) => <AccordionItem key={`${faq.question}-${index}`} value={`faq-${index}`}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionPanel>{faq.answer}</AccordionPanel></AccordionItem>)}</Accordion></div></section>
}

// Standard fact cards rather than per-page CMS copy, so every airport page states the same, accurate terms.
function BenefitCards() {
  return (
    <div className="airport-facts-grid airport-benefit-card-grid">
      {whyBookCards.map(({ icon: Icon, title, text }, index) => (
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

  return (
    <section id="vehicles" className="airport-vehicles airport-vehicles-combined" data-preview-section="fleet_pricing">
      <div className="airport-container">
        <div className="airport-vehicles-heading">
          <div>
            <p className="airport-eyebrow">Our fleet</p>
            <h2 className="text-balance">{headingFor(fleetSection?.title, `The right car for your ${page.shortName} trip`)}</h2>
            <p className="airport-vehicles-heading-copy">Compare seats and luggage space, then pick the car that fits your group.</p>
            {fleetSection && fleetHasBody && <div className="mt-4"><RichText blocks={fleetSection.body} document={fleetSection.bodyDocument} /></div>}
          </div>
          <p className="airport-vehicles-count">{page.vehicles.length} vehicles</p>
        </div>

        <div className="airport-vehicle-grid">
          {page.vehicles.map((vehicle, index) => (
            <article key={vehicle.id} className="airport-vehicle-card">
              <div className="airport-vehicle-top"><span>{String(index + 1).padStart(2, "0")}</span><span><UsersRound aria-hidden="true" /> Chauffeur driven</span></div>
              <div className="airport-vehicle-image"><Image src={vehicle.image} alt={vehicle.name} fill sizes="(min-width: 900px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-contain" /></div>
              <h3>{vehicle.name}</h3>
              {VEHICLE_BEST_FOR[vehicle.id] && <p className="airport-vehicle-best">{VEHICLE_BEST_FOR[vehicle.id]}</p>}
              <div className="airport-vehicle-meta"><span><UsersRound aria-hidden="true" />{vehicle.capacity} passengers</span><span><Luggage aria-hidden="true" />{vehicle.luggage} suitcases</span></div>
              <div className="airport-vehicle-action"><Button size="sm" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>Get a Price <ArrowRight className="size-3.5" /></Button></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// Arrival steps for the pickup guide; facts mirror the Terms and Help Centre.
const arrivalSteps = [
  { title: "Land and clear passport control.", text: "We're already tracking your flight, so there's no need to call." },
  { title: "Collect your bags.", text: "Your 45 minutes of free waiting starts when your flight lands." },
  { title: "Head to the meeting point.", text: "The exact spot is in your booking details. With meet & greet, your driver waits inside arrivals." },
  { title: "Walk to the car together.", text: "Your driver takes you door to door at your fixed fare." },
]

function BuilderSection({ section, page, index }: { section: AirportPageContentSection; page: AirportPagePresentation; index: number }) {
  const reversed = index % 2 === 1
  if (section.type === "introduction") {
    return <section className={`airport-introduction ${reversed ? "airport-introduction-reversed" : ""}`} data-preview-section="introduction"><div className="airport-container airport-introduction-grid"><div className="airport-introduction-copy"><p className="airport-eyebrow">{page.shortName} transfers at a glance</p><h2>{headingFor(section.title, `${page.shortName} Airport transfers, priced before you book`)}</h2><div className="mt-5"><RichText blocks={section.body} document={section.bodyDocument} /></div><Button className="mt-7" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>Get My Fixed Price <ArrowRight className="size-4" /></Button></div>{section.image ? <div className="airport-introduction-media"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /><div className="airport-floating-note"><ShieldCheck aria-hidden="true" /><span>Door-to-door service<br /><small>Planned around your flight</small></span></div></div> : <div className="airport-introduction-media"><Image src="/hero-airport-transfer.png" alt="A driver beside an executive car outside an airport terminal" fill sizes="(min-width: 900px) 50vw, 100vw" className="object-cover" /></div>}</div></section>
  }

  if (section.type === "benefits") {
    return <section className={`airport-benefits ${reversed ? "airport-benefits-reversed" : ""}`} data-preview-section="benefits"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">Why book with us</p><h2>{headingFor(section.title, `Why travellers choose us for ${page.shortName}`)}</h2></div><p>Everything that makes a {page.shortName} pickup easy.</p></div><div className="airport-benefits-grid"><div className="airport-benefit-copy"><BenefitCards /></div>{section.image && <div className="airport-benefit-image"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /><div className="airport-image-caption"><ShieldCheck aria-hidden="true" /><span>Professional service, every mile</span></div></div>}</div></div></section>
  }

  if (section.type === "fleet_pricing") {
    return null
  }

  if (section.type === "airport_guide") {
    // An empty guide reads as a broken page, so it only renders once it has content.
    if (!hasContent(section)) return null
    const guideFields = Object.entries(section.fields).filter(([key, value]) => key !== "sourceNotes" && value.trim())
    return <section className={`airport-guide ${reversed ? "airport-guide-reversed" : ""}`} data-preview-section="airport_guide"><div className="airport-container"><div className="airport-guide-lead"><div><p className="airport-eyebrow">Know before you land</p><h2>{headingFor(section.title, `Your ${page.shortName} Airport guide`)}</h2><div className="mt-5"><RichText blocks={section.body} document={section.bodyDocument} /></div></div>{section.image && <div className="airport-guide-image"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /></div>}</div><div className="airport-guide-grid">{guideFields.map(([key, value], fieldIndex) => { const Icon = storyIcons[fieldIndex % storyIcons.length]; return <article key={key} className="airport-guide-card"><span>{String(fieldIndex + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /><h3>{key.replace(/([A-Z])/g, " $1")}</h3><p>{value}</p></article> })}</div></div></section>
  }

  if (section.type === "map") {
    return (
      <section className={`airport-map-chapter ${reversed ? "airport-map-reversed" : ""}`} data-preview-section="map">
        <div className="airport-container airport-map-grid">
          <div>
            <p className="airport-eyebrow airport-eyebrow-light">Know before you land</p>
            <h2>{headingFor(section.title, `Your ${page.shortName} pickup, step by step`)}</h2>
            {page.terminals.length === 1 && <p className="airport-map-lead">{airportLabel(page)} has a single terminal: one meeting point, and no terminal to choose when you book.</p>}
            {hasContent(section) && <div className="mt-5"><RichText blocks={section.body} document={section.bodyDocument} /></div>}
            <h3 className="airport-pickup-title">Arriving at {page.shortName}</h3>
            <ol className="airport-pickup-steps">
              {arrivalSteps.map((step, stepIndex) => <li key={step.title}><span>{stepIndex + 1}</span><p><strong>{step.title}</strong> {step.text}</p></li>)}
            </ol>
            <h3 className="airport-pickup-title">Departing from {page.shortName}</h3>
            <p className="airport-pickup-depart">Your driver drops you at the terminal drop-off area. For a short-haul flight, plan to arrive at least 2 hours before departure.</p>
          </div>
          {page.mapLocation && <AirportMapPreview location={page.mapLocation} />}
        </div>
      </section>
    )
  }

  if (section.type === "reviews") return <ReviewSection page={page} title={section.title} />
  if (section.type === "related_destinations") return <RouteSection page={page} title={section.title} />
  if (section.type === "faq") return <FaqSection page={page} title={section.title} />
  return <StorySection section={section} index={index} />
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
const VEHICLES_ORDER = 30
const TERMINALS_ORDER = 55
const DEFAULT_ORDER = 60

export function AirportPageRenderer({ page, canonicalPath, showFooter = true, googleRating }: { page: AirportPagePresentation; canonicalPath?: string; showFooter?: boolean; googleRating?: GoogleRating | null }) {
  const visibleSections = page.sections.filter((section) => section.visible)
  const configuredSectionTypes = new Set(page.sections.map((section) => section.type))
  const rank = (section: AirportPageContentSection) => SECTION_ORDER[section.type] ?? DEFAULT_ORDER
  const orderedSections = visibleSections.map((section, position) => ({ section, position })).sort((a, b) => rank(a.section) - rank(b.section) || a.position - b.position).map(({ section }) => section)

  const blocks: [number, React.ReactNode][] = orderedSections.map((section, index) => [rank(section), <BuilderSection key={section.id} section={section} page={page} index={index} />])
  blocks.push([VEHICLES_ORDER, <VehicleSection key="vehicles" page={page} fleetSection={visibleSections.find((section) => section.type === "fleet_pricing")} />])
  // A single terminal is covered by one line in the pickup guide; a full section is only worth it for several.
  if (page.terminals.length > 1) blocks.push([TERMINALS_ORDER, <section key="terminals" className="airport-terminals"><div className="airport-container airport-terminal-grid"><div className="airport-terminal-heading"><p className="airport-eyebrow">Door to terminal</p><h2>Terminals we cover</h2><p>Choose your terminal while booking. We’ll plan the correct pickup point.</p></div><div className="airport-terminal-list">{page.terminals.map((terminal, index) => <div key={terminal.id} className="airport-terminal-card"><span><PlaneLanding aria-hidden="true" /></span><div><small>Terminal {String(index + 1).padStart(2, "0")}</small><h3>{terminal.name}</h3><p>{terminal.area}</p></div>{terminal.isPrimary && <strong>Primary</strong>}</div>)}</div></div></section>])
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
              <AirportHeroQuote page={page} />
            </div>
            <div className="airport-trust-rail"><div className="airport-container airport-trust-grid">{trustItems.map(({ icon: TrustIcon, title, text }) => <div key={title}><TrustIcon aria-hidden="true" /><span><strong>{title}</strong><small>{text}</small></span></div>)}</div></div>
          </section>
        ) : (
          <section className="airport-hero airport-hero-fallback"><div className="airport-container airport-hero-content"><AirportHeroCopy page={page} canonicalPath={canonicalPath} googleRating={googleRating} /><AirportHeroQuote page={page} /></div></section>
        )}

        {blocks.map(([, block]) => block)}

        <section className="airport-final-wrap">
          <div className="airport-container">
            <div className="airport-final-cta">
              <div className="airport-final-copy">
                <p className="airport-eyebrow airport-eyebrow-light">{page.shortName} airport transfers</p>
                <h2>{page.bookingAvailable === false ? "Need help with your airport transfer?" : headingFor(page.finalCta.heading, `Flying into ${page.shortName}? Your driver's ready.`)}</h2>
                {page.bookingAvailable === false ? <p>Online booking is temporarily unavailable. Our team can help with your journey.</p> : finalCtaHasBody ? <div><RichText blocks={page.finalCta.body} document={page.finalCta.bodyDocument} /></div> : <p>Know where your driver will be and exactly what you&apos;ll pay, before you even pack. We track your flight and adjust your pickup if you land early or late.</p>}
                <div className="airport-final-points">
                  <span><Check aria-hidden="true" /> Fixed fare</span>
                  <span><Check aria-hidden="true" /> Flight tracked</span>
                  <span><Check aria-hidden="true" /> 45 min free waiting</span>
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
