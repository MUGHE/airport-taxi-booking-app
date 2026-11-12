import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Car, Check, Clock, Luggage, MapPin, PlaneLanding, PlaneTakeoff, Route, Users } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { PlaceDriversSection } from "@/components/airport-page/airport-page-renderer"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { formatRouteDuration, type RouteEndpoint } from "@/lib/route-page-content"
import type { RoutePagePresentation } from "@/lib/route-pages"

function EndpointIcon({ endpoint, arriving }: { endpoint: RouteEndpoint; arriving?: boolean }) {
  if (endpoint.type !== "airport") return <MapPin aria-hidden="true" />
  return arriving ? <PlaneTakeoff aria-hidden="true" /> : <PlaneLanding aria-hidden="true" />
}

export function RoutePageRenderer({ page }: { page: RoutePagePresentation }) {
  const { a, b } = page
  return (
    <div className="airport-page route-page flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="airport-hero airport-hero-fallback route-hero">
          <div className="airport-container route-hero-grid">
            <div className="route-hero-copy">
              <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `${a.name} ⇄ ${b.name}`, href: `/${page.slug}` }]} includeStructuredData={false} className="[&_span]:text-white/90 [&_svg]:text-white/40 [&_a]:text-white/70" />
              <h1>{page.heading}</h1>
              <p className="route-hero-reverse">and {b.name} to {a.name}</p>
              <p className="route-hero-intro">{page.intro}</p>
              <ul className="route-hero-facts">
                {page.distanceMiles != null && <li><Route aria-hidden="true" />{Math.round(page.distanceMiles)} miles</li>}
                {page.durationMinutes != null && <li><Clock aria-hidden="true" />About {formatRouteDuration(page.durationMinutes)}</li>}
                {page.fromFare != null && <li><Car aria-hidden="true" />From £{page.fromFare}</li>}
              </ul>
            </div>
            <div className="route-hero-card">
              <p className="route-hero-card-title">Which way are you going?</p>
              {page.directions.map((direction) => (
                <Link key={direction.from.id} href={direction.bookHref} className="route-direction-link">
                  <span><EndpointIcon endpoint={direction.from} /> {direction.from.name}</span>
                  <ArrowRight aria-hidden="true" className="route-direction-arrow" />
                  <span><EndpointIcon endpoint={direction.to} arriving /> {direction.to.name}</span>
                  <small>Get my fixed price <ArrowRight aria-hidden="true" /></small>
                </Link>
              ))}
              <p className="route-hero-card-note">Your exact address and travel date come next. No payment needed to see the price.</p>
            </div>
          </div>
        </section>

        <section className="route-directions">
          <div className="airport-container">
            <div className="airport-section-heading"><div><p className="airport-eyebrow">Both directions</p><h2>One route, either way</h2></div></div>
            <div className="route-direction-grid">
              {page.directions.map((direction) => (
                <article key={direction.from.id} className="route-direction-card">
                  <h3>{direction.from.name} to {direction.to.name}</h3>
                  <p>{direction.text}</p>
                  <Button className="mt-5" nativeButton={false} render={<Link href={direction.bookHref} />}>Book {direction.from.name} to {direction.to.name} <ArrowRight className="size-4" /></Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {page.fares.length > 0 && (
          <section className="route-fares">
            <div className="airport-container">
              <div className="airport-section-heading"><div><p className="airport-eyebrow">Fares</p><h2>Prices for this route</h2></div><p>The same price applies in both directions. Your final fixed price depends on your exact addresses and is shown before you book.</p></div>
              <ul className="route-fare-grid">
                {page.fares.map((vehicle) => (
                  <li key={vehicle.id} className="route-fare-card">
                    <div className="route-fare-image"><Image src={vehicle.image} alt={vehicle.name} fill sizes="(min-width: 900px) 20vw, 45vw" className="object-contain" /></div>
                    <h3>{vehicle.name}</h3>
                    <p className="route-fare-meta"><span><Users aria-hidden="true" />{vehicle.capacity}</span><span><Luggage aria-hidden="true" />{vehicle.luggage}</span></p>
                    <p className="route-fare-price"><small>from</small> £{vehicle.fare}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="route-places">
          <div className="airport-container">
            <div className="airport-section-heading"><div><p className="airport-eyebrow">The two ends</p><h2>About {a.name} and {b.name}</h2></div></div>
            <div className="route-direction-grid">
              {[a, b].map((endpoint) => (
                <Link key={endpoint.id} href={endpoint.href} className="route-place-card">
                  <EndpointIcon endpoint={endpoint} />
                  <h3>{endpoint.name}</h3>
                  <p>{endpoint.type === "airport" ? `Terminals, pickup points and all our transfers to and from ${endpoint.name}.` : `All our taxi and airport transfers from ${endpoint.name}.`}</p>
                  <span className="route-place-link">See {endpoint.name} <ArrowRight aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <PlaceDriversSection />

        {page.faqs.length > 0 && (
          <section className="airport-faq">
            <div className="airport-container airport-faq-grid">
              <div className="airport-faq-heading"><p className="airport-eyebrow">Need to know</p><h2 className="route-faq-title">{a.name} to {b.name} questions</h2></div>
              <Accordion className="airport-faq-list" multiple>
                {page.faqs.map((faq, index) => <AccordionItem key={`${faq.question}-${index}`} value={`faq-${index}`}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionPanel>{faq.answer}</AccordionPanel></AccordionItem>)}
              </Accordion>
            </div>
          </section>
        )}

        {page.relatedRoutes.length > 0 && (
          <section className="route-related">
            <div className="airport-container">
              <p className="airport-eyebrow">More routes</p>
              <h2 className="route-related-title">Other journeys from {a.name} and {b.name}</h2>
              <ul className="route-related-list">{page.relatedRoutes.map((route) => <li key={route.slug}><Link href={`/${route.slug}`}><Route aria-hidden="true" />{route.title}</Link></li>)}</ul>
            </div>
          </section>
        )}

        <section className="airport-final-wrap">
          <div className="airport-container">
            <div className="airport-final-cta">
              <div className="airport-final-copy">
                <p className="airport-eyebrow airport-eyebrow-light">{a.name} ⇄ {b.name}</p>
                <h2>Ready to book your transfer?</h2>
                <div className="airport-final-points"><span><Check aria-hidden="true" /> Fixed, clear pricing</span><span><Check aria-hidden="true" /> Door-to-door</span><span><Check aria-hidden="true" /> Professional chauffeur</span></div>
              </div>
              <div className="airport-final-action">
                <h3>Choose your direction</h3>
                {page.directions.map((direction) => <Button key={direction.from.id} className="route-final-button" size="lg" variant="secondary" nativeButton={false} render={<Link href={direction.bookHref} />}>{direction.from.name} to {direction.to.name} <ArrowRight className="size-4" /></Button>)}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
