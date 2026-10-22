import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, MapPin, PlaneTakeoff } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ResilientImage } from "@/components/airport-page/resilient-image"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { AIRPORT_IMAGES } from "@/lib/airport-images"
import type { PlacePagePresentation } from "@/lib/place-page-data"
import type { StopPricing } from "@/lib/types"
import { PlaceQuoteForm } from "@/components/place-page/place-quote-form"
import { PlacePageAnalytics } from "@/components/place-page/place-page-analytics"
import { PlaceStorySection } from "@/components/place-page/place-story-section"
import { PlaceComfortSection, PlaceDriversSection } from "@/components/airport-page/airport-page-renderer"

function Blocks({ blocks }: { blocks: { text: string; type: string; href?: string; label?: string }[] }) {
  return <div className="space-y-3 text-muted-foreground">{blocks.map((block, index) => block.type === "link" && block.href ? <Link key={index} className="block font-semibold text-primary underline" href={block.href}>{block.label || block.text}</Link> : <p key={index} className={block.type === "bold" ? "font-semibold text-foreground" : "leading-7"}>{block.text}</p>)}</div>
}

export function PlacePageRenderer({ page, canonicalPath, showFooter = true, analyticsEnabled = true, fallback = false, stopPricing }: { page: PlacePagePresentation; canonicalPath?: string; showFooter?: boolean; analyticsEnabled?: boolean; fallback?: boolean; stopPricing?: StopPricing }) {
  const visibleSections = page.sections.filter((section) => section.visible)
  return <div className="airport-page flex min-h-screen flex-col">{analyticsEnabled && <PlacePageAnalytics sourcePlaceId={page.sourcePlaceId} sourcePlaceSlug={page.sourcePlaceSlug} fallback={fallback} />}<SiteHeader /><main className="flex-1">
    <section className={`airport-hero ${page.heroImage ? "place-hero-with-image" : "airport-hero-fallback"}`}>
      {page.heroImage && <><div className="airport-hero-image"><ResilientImage className="size-full object-cover" src={page.heroImage.secureUrl} alt={page.heroImage.altText} sizes="100vw" priority /></div><div className="airport-hero-shade" /></>}
      <div className="airport-container airport-hero-content place-hero-content">
        <div className="airport-hero-copy place-hero-copy">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Destinations", href: "/destinations" }, { label: page.displayName, href: canonicalPath }]} includeStructuredData={false} className="[&_span]:text-white/90 [&_svg]:text-white/40 [&_a]:text-white/70" />
          <h1 className="airport-hero-heading">{page.heading}</h1>
          <div className="airport-hero-intro"><Blocks blocks={page.intro} /></div>
        </div>
        <div className="airport-quote-wrap place-hero-quote">
          <PlaceQuoteForm sourcePlaceId={page.sourcePlaceId} sourcePlaceSlug={page.sourcePlaceSlug} analyticsEnabled={analyticsEnabled} stopPricing={stopPricing} />
        </div>
      </div>
    </section>
    {visibleSections.map((section, index) => <PlaceStorySection key={section.id} section={section} page={page} index={index} />)}
    <PlaceComfortSection placeName={page.displayName.replace(/\s+taxi$/i, "")} />
    <PlaceDriversSection />
    <section className="airport-routes"><div className="airport-container"><div className="airport-section-heading"><div><p className="airport-eyebrow">Supported Airports</p><h2>Book from {page.displayName.replace(/\s+taxi$/i, "")}</h2></div></div><div className="airport-route-grid">{page.supportedAirports.map((airport) => <article key={airport.id} className="airport-route-card">{AIRPORT_IMAGES[airport.slug] && <Image className="airport-route-image" src={AIRPORT_IMAGES[airport.slug]} alt="" fill sizes="(min-width: 900px) 40vw, 100vw" />}<div className="airport-route-overlay" /><div className="airport-route-content"><PlaneTakeoff aria-hidden="true" /><h3><Link href={`/airport-transfers/${airport.slug}`}>{airport.displayName}</Link></h3><p>{airport.description}</p>{airport.bookingAvailable && airport.primaryTerminal ? <p className="mt-3 text-sm text-muted-foreground">Online booking is available.</p> : <p className="mt-3 text-sm text-muted-foreground">Online booking is temporarily unavailable. <Link className="underline" href="/contact">Contact our team</Link>.</p>}</div></article>)}</div></div></section>
    {page.nearbyPlaces.length > 0 && <section className="airport-facts"><div className="airport-container"><p className="airport-eyebrow">Explore nearby</p><h2>Nearby Places</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{page.nearbyPlaces.map((place) => <Link key={place.id} className="rounded-xl border p-5 hover:border-primary" href={`/destinations/${place.slug}`}><MapPin className="size-5 text-primary" /><h3 className="mt-3 font-semibold">{place.displayName}</h3><p className="mt-1 text-sm text-muted-foreground">{place.description}</p></Link>)}</div></div></section>}
    {page.localFaqs.length + page.globalFaqs.length > 0 && <section className="airport-faq"><div className="airport-container airport-faq-grid"><div className="airport-faq-heading"><p className="airport-eyebrow">Need to know</p><h2 className="place-faq-title">Questions about {page.displayName.replace(/\s+taxi$/i, "")}</h2></div><Accordion className="airport-faq-list" multiple>{[...page.globalFaqs, ...page.localFaqs].map((faq, index) => <AccordionItem key={`${faq.question}-${index}`} value={`faq-${index}`}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionPanel>{faq.answer}</AccordionPanel></AccordionItem>)}</Accordion></div></section>}
    <section className="airport-final-wrap"><div className="airport-container"><div className="airport-final-cta"><div className="airport-final-copy"><p className="airport-eyebrow airport-eyebrow-light">{page.displayName} airport transfers</p><h2>{page.finalCta.heading}</h2><Blocks blocks={page.finalCta.body} /><div className="airport-final-points"><span><Check aria-hidden="true" /> Fixed, clear pricing</span><span><Check aria-hidden="true" /> Exact address pickup</span><span><Check aria-hidden="true" /> Professional chauffeur</span></div></div><div className="airport-final-action"><h3>Ready to travel?</h3><p>Get your fixed price in a few minutes.</p><Button size="lg" variant="secondary" nativeButton={false} render={<Link href="/book" />}>Get my fixed price <ArrowRight className="size-4" /></Button></div></div></div></section>
  </main>{showFooter && <SiteFooter />}</div>
}
