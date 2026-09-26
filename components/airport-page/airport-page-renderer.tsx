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
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react"
import { AirportMapPreview } from "@/components/airport-page/airport-map-preview"
import { AirportQuoteActions } from "@/components/airport-page/airport-quote-actions"
import { ResilientImage } from "@/components/airport-page/resilient-image"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

function StorySection({ section, index }: { section: AirportPageContentSection; index: number }) {
  const Icon = storyIcons[index % storyIcons.length]
  const reversed = index % 2 === 1

  return (
    <section className={`airport-story ${reversed ? "airport-story-reversed" : ""}`} data-preview-section={section.type}>
      <div className="airport-container airport-story-grid">
        <div className="airport-story-copy">
          <div className="airport-chapter"><span>{String(index + 1).padStart(2, "0")}</span><span>{sectionLabels[section.type] ?? section.type.replace(/_/g, " ")}</span></div>
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
            <span className="airport-image-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} />
          </div>
        ) : (
          <div className="airport-story-placeholder" aria-hidden="true"><Icon /><span>{sectionLabels[section.type] ?? "Airport transfer"}</span></div>
        )}
      </div>
    </section>
  )
}

function RouteSection({ page, title = "Popular transfer routes" }: { page: AirportPagePresentation; title?: string }) {
  if (page.relatedDestinations.length === 0) return null
  return <section className="airport-routes" data-preview-section="related_destinations"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">Keep moving</p><h2>{title}</h2></div><p>Direct airport connections, ready to book.</p></div><div className="airport-route-grid">{page.relatedDestinations.map((related, index) => <article key={related.id} className="airport-route-card">{related.image ? <ResilientImage className="airport-route-image" src={related.image} alt={related.displayName} /> : <div className="airport-route-image airport-route-placeholder"><Navigation aria-hidden="true" /></div>}<div className="airport-route-overlay" /><div className="airport-route-content"><span>Route {String(index + 1).padStart(2, "0")}</span><h3><Link href={related.href}>{related.heading}</Link></h3><p>{related.description}</p><Link className="airport-route-link" href={related.bookingLinks.toAirport}>Get a fixed price <ArrowRight aria-hidden="true" /></Link></div></article>)}</div></div></section>
}

function ReviewSection({ page, title = "Verified reviews" }: { page: AirportPagePresentation; title?: string }) {
  if (page.reviews.length === 0) return null
  return <section className="airport-reviews" data-preview-section="reviews"><div className="airport-container"><div className="airport-review-heading"><p className="airport-eyebrow">Real journeys</p><h2>{title}</h2><p>Feedback from travellers who booked with us.</p></div><div className="airport-review-grid">{page.reviews.map((review, index) => <blockquote key={review.id} className="airport-review-card"><Quote aria-hidden="true" /><div className="airport-review-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, star) => <Star key={star} />)}</div><p>“{review.quote}”</p><footer><span>{review.author}</span><small><Check aria-hidden="true" /> Verified · {review.source}</small></footer><span className="airport-review-number">{String(index + 1).padStart(2, "0")}</span></blockquote>)}</div></div></section>
}

function FaqSection({ page, title = "Frequently asked questions" }: { page: AirportPagePresentation; title?: string }) {
  return <section className="airport-faq" data-preview-section="faq"><div className="airport-container airport-faq-grid"><div className="airport-faq-heading"><p className="airport-eyebrow">Need to know</p><h2>{title}</h2><p>Clear answers before you travel.</p><Link href="/contact">Still have a question? Talk to us <ArrowRight aria-hidden="true" /></Link></div><Accordion className="airport-faq-list" multiple>{page.faqs.map((faq, index) => <AccordionItem key={`${faq.question}-${index}`} value={`faq-${index}`}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionPanel>{faq.answer}</AccordionPanel></AccordionItem>)}</Accordion></div></section>
}

function BenefitCards({ section }: { section: AirportPageContentSection }) {
  const icons = [ShieldCheck, PlaneTakeoff, Clock3, UsersRound, Sparkles]
  const documentItems = section.bodyDocument?.content.filter((node) => node.type === "paragraph" || node.type === "heading") ?? []
  const items = documentItems.length > 0 ? documentItems : section.body

  return (
    <div className="airport-facts-grid airport-benefit-card-grid">
      {items.map((item, index) => {
        const Icon = icons[index % icons.length]
        const content = "type" in item && "content" in item
          ? <TiptapRichText document={{ type: "doc", content: [item] as TiptapNode[] }} />
          : <p>{item.text}</p>

        return (
          <Card key={`${item.type}-${index}`} className="airport-benefit-card">
            <CardHeader className="airport-benefit-card-header">
              <Icon aria-hidden="true" />
              <span className="airport-fact-number">{String(index + 1).padStart(2, "0")}</span>
            </CardHeader>
            <CardContent className="airport-benefit-card-content">{content}</CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function VehicleSection({ page, fleetSection }: { page: AirportPagePresentation; fleetSection?: AirportPageContentSection }) {
  const sectionTitle = fleetSection?.title?.toLowerCase() === "fleet & pricing"
    ? "Find the right vehicle for your journey"
    : fleetSection?.title ?? "Find the right vehicle for your journey"

  return (
    <section id="vehicles" className="airport-vehicles airport-vehicles-combined" data-preview-section="fleet_pricing">
      <div className="airport-container">
        <div className={`airport-vehicles-lead ${fleetSection?.image ? "airport-vehicles-lead-with-media" : ""}`}>
          <div className="airport-vehicles-lead-copy">
            <p className="airport-eyebrow airport-eyebrow-light">Find your best fit</p>
            <h2 className="text-balance">{sectionTitle}</h2>
            {fleetSection && <div className="mt-5"><RichText blocks={fleetSection.body} document={fleetSection.bodyDocument} /></div>}
          </div>
          {fleetSection?.image && (
            <div className="airport-vehicles-lead-media">
              <ResilientImage className="size-full object-cover" src={fleetSection.image.secureUrl} alt={fleetSection.image.altText} />
            </div>
          )}
        </div>

        <div className="airport-vehicles-heading">
          <div>
            <p className="airport-eyebrow">Your options</p>
            <p className="airport-vehicles-heading-copy">Compare passenger and luggage space, then choose the vehicle that fits your group.</p>
          </div>
          <p className="airport-vehicles-count">{page.vehicles.length} vehicle options</p>
        </div>

        <div className="airport-vehicle-grid">
          {page.vehicles.map((vehicle, index) => (
            <article key={vehicle.id} className="airport-vehicle-card">
              <div className="airport-vehicle-top"><span>{String(index + 1).padStart(2, "0")}</span><span><UsersRound aria-hidden="true" /> Chauffeur driven</span></div>
              <div className="airport-vehicle-image"><Image src={vehicle.image} alt={vehicle.name} fill sizes="(min-width: 900px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-contain" /></div>
              <h3>{vehicle.name}</h3>
              <p>{vehicle.description}</p>
              <div className="airport-vehicle-action"><Button size="sm" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>Choose vehicle <ArrowRight className="size-3.5" /></Button></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function BuilderSection({ section, page, index }: { section: AirportPageContentSection; page: AirportPagePresentation; index: number }) {
  if (section.type === "introduction") {
    return <section className="airport-introduction" data-preview-section="introduction"><div className="airport-container airport-introduction-grid"><div className="airport-introduction-copy"><p className="airport-eyebrow">Your journey, handled</p><h2>{section.title}</h2><div className="mt-5"><RichText blocks={section.body} document={section.bodyDocument} /></div><Button className="mt-7" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>Plan my transfer <ArrowRight className="size-4" /></Button></div>{section.image && <div className="airport-introduction-media"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /><div className="airport-floating-note"><ShieldCheck aria-hidden="true" /><span>Door-to-door service<br /><small>Planned around your flight</small></span></div></div>}</div></section>
  }

  if (section.type === "benefits") {
    return <section className="airport-benefits" data-preview-section="benefits"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">The ONE difference</p><h2>{section.title}</h2></div><p>Calm, dependable travel from booking to drop-off.</p></div><div className="airport-benefits-grid"><div className="airport-benefit-copy"><BenefitCards section={section} /></div>{section.image && <div className="airport-benefit-image"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /><div className="airport-image-caption"><Sparkles aria-hidden="true" /><span>Professional service, every mile</span></div></div>}</div></div></section>
  }

  if (section.type === "fleet_pricing") {
    return null
  }

  if (section.type === "airport_guide") {
    const guideFields = Object.entries(section.fields).filter(([key, value]) => key !== "sourceNotes" && value.trim())
    return <section className="airport-guide" data-preview-section="airport_guide"><div className="airport-container"><div className="airport-guide-lead"><div><p className="airport-eyebrow">Know before you land</p><h2>{section.title}</h2><div className="mt-5"><RichText blocks={section.body} document={section.bodyDocument} /></div></div>{section.image && <div className="airport-guide-image"><ResilientImage className="size-full object-cover" src={section.image.secureUrl} alt={section.image.altText} /></div>}</div><div className="airport-guide-grid">{guideFields.map(([key, value], fieldIndex) => { const Icon = storyIcons[fieldIndex % storyIcons.length]; return <article key={key} className="airport-guide-card"><span>{String(fieldIndex + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /><h3>{key.replace(/([A-Z])/g, " $1")}</h3><p>{value}</p></article> })}</div></div></section>
  }

  if (section.type === "map") {
    return <section className="airport-map-chapter" data-preview-section="map"><div className="airport-container airport-map-grid"><div><p className="airport-eyebrow airport-eyebrow-light">Meet your driver with confidence</p><h2>{section.title}</h2><div className="mt-5"><RichText blocks={section.body} document={section.bodyDocument} /></div><div className="airport-map-promise"><Clock3 aria-hidden="true" /><span><strong>Flight-aware pickup</strong><small>Your pickup adjusts when your flight does.</small></span></div></div>{page.mapLocation && <AirportMapPreview location={page.mapLocation} />}</div></section>
  }

  if (section.type === "reviews") return <ReviewSection page={page} title={section.title} />
  if (section.type === "related_destinations") return <RouteSection page={page} title={section.title} />
  if (section.type === "faq") return <FaqSection page={page} title={section.title} />
  return <StorySection section={section} index={index} />
}

export function AirportPageRenderer({ page, canonicalPath, showFooter = true }: { page: AirportPagePresentation; canonicalPath?: string; showFooter?: boolean }) {
  const visibleSections = page.sections.filter((section) => section.visible)
  const configuredSectionTypes = new Set(page.sections.map((section) => section.type))

  return (
    <div className="airport-page flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {page.heroImage ? (
          <section className="airport-hero">
            <div className="airport-hero-image"><ResilientImage className="size-full object-cover" src={page.heroImage.secureUrl} alt={page.heroImage.altText} /></div>
            <div className="airport-hero-shade" />
            <div className="airport-container airport-hero-content">
              <div className="airport-hero-copy">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Airport Transfers", href: "/airport-transfers" }, { label: page.shortName, href: canonicalPath }]} className="[&_span]:text-white/90 [&_svg]:text-white/40 [&_a]:text-white/70" />
                <div className="airport-rating"><ShieldCheck aria-hidden="true" /><span>Professional airport transfers</span></div>
                <h1>{page.heading}</h1>
                {page.introDocument ? <div className="airport-hero-intro"><TiptapRichText document={page.introDocument} /></div> : page.intro.map((paragraph) => <p key={paragraph} className="airport-hero-intro">{paragraph}</p>)}
              </div>
              <AirportQuoteActions page={page} onDarkBackground />
            </div>
            <div className="airport-trust-rail"><div className="airport-container airport-trust-grid">{[[Banknote, "Fixed fares", "Know the price before you ride"], [PlaneTakeoff, "Flight tracking", "Pickup timed to your arrival"], [Headphones, "Human support", "Help whenever plans change"]].map(([Icon, title, description]) => { const FeatureIcon = Icon as typeof Banknote; return <div key={title as string}><FeatureIcon aria-hidden="true" /><span><strong>{title as string}</strong><small>{description as string}</small></span></div> })}</div></div>
          </section>
        ) : (
          <section className="airport-hero airport-hero-fallback"><div className="airport-container airport-hero-content"><div className="airport-hero-copy"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Airport Transfers", href: "/airport-transfers" }, { label: page.shortName, href: canonicalPath }]} className="[&_span]:text-white/90 [&_svg]:text-white/40 [&_a]:text-white/70" /><h1>{page.heading}</h1>{page.introDocument ? <div className="airport-hero-intro"><TiptapRichText document={page.introDocument} /></div> : page.intro.map((paragraph) => <p key={paragraph} className="airport-hero-intro">{paragraph}</p>)}</div><AirportQuoteActions page={page} onDarkBackground /></div></section>
        )}

        {visibleSections.map((section, index) => <BuilderSection key={section.id} section={section} page={page} index={index} />)}

        {page.terminals.length > 0 && <section className="airport-terminals"><div className="airport-container airport-terminal-grid"><div className="airport-terminal-heading"><p className="airport-eyebrow">Door to terminal</p><h2>Terminals we cover</h2><p>Choose your terminal while booking. We’ll plan the correct pickup point.</p></div><div className="airport-terminal-list">{page.terminals.map((terminal, index) => <div key={terminal.id} className="airport-terminal-card"><span><PlaneLanding aria-hidden="true" /></span><div><small>Terminal {String(index + 1).padStart(2, "0")}</small><h3>{terminal.name}</h3><p>{terminal.area}</p></div>{terminal.isPrimary && <strong>Primary</strong>}</div>)}</div></div></section>}

        {!configuredSectionTypes.has("related_destinations") && <RouteSection page={page} />}

        <section className="airport-confidence-section"><div className="airport-container airport-confidence-grid"><div><p className="airport-eyebrow airport-eyebrow-light">The promise</p><h2>Why book with us</h2></div>{page.benefits.map((benefit) => <div key={benefit.title} className="airport-confidence-item"><span>{benefit.icon === "fare" ? <Banknote aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}</span><div><h3>{benefit.title}</h3><p>{benefit.description}</p></div></div>)}</div></section>

        <VehicleSection page={page} fleetSection={visibleSections.find((section) => section.type === "fleet_pricing")} />

        {!configuredSectionTypes.has("reviews") && <ReviewSection page={page} />}
        {!configuredSectionTypes.has("faq") && <FaqSection page={page} />}

        <section className="airport-final-wrap">
          <div className="airport-container">
            <div className="airport-final-cta">
              <div className="airport-final-copy">
                <p className="airport-eyebrow airport-eyebrow-light">{page.shortName} airport transfers</p>
                <h2>{page.bookingAvailable === false ? "Need help with your airport transfer?" : page.finalCta.heading}</h2>
                {page.bookingAvailable === false ? <p>Online booking is temporarily unavailable. Our team can help with your journey.</p> : <div><RichText blocks={page.finalCta.body} document={page.finalCta.bodyDocument} /></div>}
                <div className="airport-final-points">
                  <span><Check aria-hidden="true" /> Fixed, clear pricing</span>
                  <span><Check aria-hidden="true" /> Flight-aware pickup</span>
                  <span><Check aria-hidden="true" /> Professional chauffeur</span>
                </div>
              </div>
              <div className="airport-final-action">
                <span className="airport-final-icon"><PlaneLanding aria-hidden="true" /></span>
                <h3>Ready when your flight lands</h3>
                <p>Book in a few minutes. We’ll handle the airport journey.</p>
                <Button size="lg" variant="secondary" nativeButton={false} render={<Link href={page.bookingAvailable === false ? "/contact" : page.bookingLinks.toAirport} />}>{page.bookingAvailable === false ? "Contact our team" : "Get my fixed price"}<ArrowRight className="size-4" /></Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      {showFooter && <SiteFooter />}
    </div>
  )
}
