import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { FareEstimator } from "@/components/fare-estimator"
import { FaqCategorySection } from "@/components/faq-page/faq-category-section"
import { buttonVariants } from "@/components/ui/button"
import { getStopPricing } from "@/lib/actions"
import { AIRPORT_GUIDE_FAQS, CHOOSE_AIRPORT_TIPS, GUIDE_AIRPORTS, PICKUP_STEPS, TRAVEL_TIPS, UK_GUIDE_AIRPORTS, type GuideAirport } from "@/lib/airport-guide"
import { serializeJsonLd } from "@/lib/json-ld"
import { airportImageAlt } from "@/lib/airport-images"
import { cn } from "@/lib/utils"
import { HeroOfferBox } from "@/components/hero-offer-box"

export const revalidate = 300

const SEO_TITLE = "London Airport Guide & Other UK Airports | ONE Airport Taxi"
const H1 = "London Airport Guide: London and Other UK Airports"
const DESCRIPTION =
  "Explore our London airport guide covering Heathrow, Gatwick, Stansted, Luton, London City and Southend, plus Manchester, Birmingham and other UK airports. Discover terminals, travel options and taxi transfers."

// openGraph and twitter replace the root layout ones wholesale, so the shared fields are repeated here.
export const metadata: Metadata = {
  title: { absolute: SEO_TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/airport-guide" },
  openGraph: {
    type: "article",
    locale: "en_GB",
    url: "/airport-guide",
    siteName: "ONE Airport Taxi",
    title: SEO_TITLE,
    description: DESCRIPTION,
    images: [{ url: "/hero-airport-transfer-og.jpg", alt: "ONE Airport Taxi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: DESCRIPTION,
    images: ["/hero-airport-transfer-og.jpg"],
  },
}

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AIRPORT_GUIDE_FAQS.items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a.join(" ") },
  })),
}

const linkClass = "font-medium text-primary underline-offset-4 hover:underline"

export default async function AirportGuidePage() {
  const stopPricing = await getStopPricing()
  return (
    <div className="faq-page flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(FAQ_SCHEMA) }} />
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:py-14">
            <div>
              <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Airport Guide" }]} />
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{H1}</h1>
              <h2 className="mt-6 text-lg font-semibold">London airports explained</h2>
              <p className="mt-2 max-w-xl leading-7 text-muted-foreground text-pretty">
                This London airport guide covers Heathrow, Gatwick, Stansted, Luton, London City and Southend: where each airport is, which terminals it has, how long it takes to reach central London and what to expect at pickup. If you would rather skip trains, tubes and coaches, you can book a fixed-price airport transfer to or from any of them with ONE Airport Taxi.
              </p>
              <p className="mt-3 max-w-xl leading-7 text-muted-foreground text-pretty">
                We run 24 hours a day, 365 days a year, with licensed drivers, live flight tracking and 24/7 UK support.
              </p>
              <HeroOfferBox />
              <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
                Get my fixed price <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl ring-1 ring-border shadow-lg">
              <Image
                src="/airport-transfers/chauffeur-terminal-hero.webp"
                alt="ONE Airport Taxi chauffeur beside an executive car outside an airport terminal"
                fill
                preload
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-14 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0 space-y-14">
            <section id="at-a-glance" className="scroll-mt-24" aria-labelledby="at-a-glance-title">
              <h2 id="at-a-glance-title" className="text-2xl font-semibold tracking-tight">London airports at a glance: terminals and journey times</h2>
              <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="bg-secondary/60 text-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Airport</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Where it is</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Terminals</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Typical journey to central London</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-muted-foreground">
                    {GUIDE_AIRPORTS.map((airport) => (
                      <tr key={airport.id}>
                        <th scope="row" className="px-4 py-3 font-medium text-foreground">
                          <a href={`#${airport.id}`} className="hover:text-primary">{airport.name} ({airport.code})</a>
                        </th>
                        <td className="px-4 py-3">{airport.where}</td>
                        <td className="px-4 py-3">{airport.terminals}</td>
                        <td className="px-4 py-3">{airport.journey}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm italic text-muted-foreground">Journey times are typical estimates and change with traffic, time of day and your exact destination.</p>
            </section>

            {GUIDE_AIRPORTS.map((airport) => (
              <AirportCard key={airport.id} airport={airport} />
            ))}

            <section id="other-uk-airports" className="scroll-mt-24 space-y-14" aria-labelledby="other-uk-airports-title">
              <div>
                <h2 id="other-uk-airports-title" className="text-2xl font-semibold tracking-tight">Other UK airports: Birmingham, Bristol and Manchester</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  We also run fixed-price transfers to and from major airports outside London. Here is where each one is, how long it takes to reach its city centre and how far it is from central London.
                </p>
                <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card">
                  <table className="w-full min-w-[40rem] text-left text-sm">
                    <thead className="bg-secondary/60 text-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Airport</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Where it is</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Terminals</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Typical journey to the city centre</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Typical journey to central London</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                      {UK_GUIDE_AIRPORTS.map((airport) => (
                        <tr key={airport.id}>
                          <th scope="row" className="px-4 py-3 font-medium text-foreground">
                            <a href={`#${airport.id}`} className="hover:text-primary">{airport.name} ({airport.code})</a>
                          </th>
                          <td className="px-4 py-3">{airport.where}</td>
                          <td className="px-4 py-3">{airport.terminals}</td>
                          <td className="px-4 py-3">{airport.journey} to {airport.city}</td>
                          <td className="px-4 py-3">{airport.londonJourney}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm italic text-muted-foreground">Journey times are typical estimates and change with traffic, time of day and your exact destination.</p>
              </div>

              {UK_GUIDE_AIRPORTS.map((airport) => (
                <AirportCard key={airport.id} airport={airport} />
              ))}
            </section>

            <section aria-labelledby="choose-title">
              <h2 id="choose-title" className="text-2xl font-semibold tracking-tight">How to choose the right London airport</h2>
              <ul className="mt-4 space-y-3">
                {CHOOSE_AIRPORT_TIPS.map((tip) => (
                  <li key={tip.lead} className="flex gap-2.5 leading-7 text-muted-foreground">
                    <Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-primary" />
                    <span><strong className="font-semibold text-foreground">{tip.lead}</strong> {tip.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="pickup-title">
              <h2 id="pickup-title" className="text-2xl font-semibold tracking-tight">How your airport taxi pickup works</h2>
              <ol className="mt-5 grid gap-4 sm:grid-cols-2">
                {PICKUP_STEPS.map((step, i) => (
                  <li key={step.lead} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span>
                    <p className="leading-7 text-muted-foreground"><strong className="font-semibold text-foreground">{step.lead}</strong> {step.text}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-4 leading-7 text-muted-foreground">
                For drop-offs to the airport, leave plenty of time for traffic and check-in. Most airlines recommend arriving at least 2 to 3 hours before an international flight.
              </p>
            </section>

            <section aria-labelledby="tips-title">
              <h2 id="tips-title" className="text-2xl font-semibold tracking-tight">London airport travel tips</h2>
              <ul className="mt-4 space-y-3">
                {TRAVEL_TIPS.map((tip) => (
                  <li key={tip} className="flex gap-2.5 leading-7 text-muted-foreground">
                    <Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-primary" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div>
              <FaqCategorySection category={AIRPORT_GUIDE_FAQS} />
              <Link href="/book" className={cn(linkClass, "mt-3 inline-flex items-center gap-1.5 text-sm")}>
                Get my fixed price <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>

          <aside aria-label="Get a quote">
            <div className="lg:sticky lg:top-24">
              <div className="landing-quote-card overflow-visible! shadow-lg!">
                <FareEstimator stopPricing={stopPricing} />
              </div>
            </div>
          </aside>
        </div>

        <section className="mx-auto max-w-7xl px-4 pb-14 lg:pb-20" aria-labelledby="every-airport-title">
          <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <h2 id="every-airport-title" className="text-2xl font-semibold tracking-tight">Fixed-price airport taxi transfers to every London airport</h2>
              <p className="mt-2 text-muted-foreground">
                Whether you are flying from Heathrow, Gatwick, Stansted, Luton, London City or Southend, ONE Airport Taxi offers fixed prices, licensed drivers, live flight tracking and 24/7 UK support.
              </p>
              <p className="mt-2 text-muted-foreground">
                <Link href="/airport-transfers" className={linkClass}>Explore all airport transfers</Link>, browse{" "}
                <Link href="/destinations" className={linkClass}>popular destinations</Link> or{" "}
                <Link href="/track" className={linkClass}>track your booking</Link>.
              </p>
            </div>
            <Link href="/book" className={buttonVariants({ size: "lg" })}>
              Get my fixed price <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function AirportCard({ airport }: { airport: GuideAirport }) {
  return (
    <section id={airport.id} className="scroll-mt-24" aria-labelledby={`${airport.id}-title`}>
      <div className={cn("grid gap-6 rounded-2xl border border-border bg-card p-5 sm:p-6", airport.image && "md:grid-cols-[minmax(0,1fr)_17rem]")}>
        <div>
          <h2 id={`${airport.id}-title`} className="text-xl font-semibold tracking-tight sm:text-2xl">{airport.heading}</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{airport.intro}</p>
          <h3 className="mt-5 font-semibold">Good to know:</h3>
          <ul className="mt-2 space-y-2">
            {airport.goodToKnow.map((tip) => (
              <li key={tip} className="flex gap-2.5 leading-7 text-muted-foreground">
                <Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-primary" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <Link href={airport.href} className={cn(buttonVariants({ variant: "outline" }), "mt-5")}>
            {airport.bookLabel} <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        {/* The 1000x625 landscape photo is cover-cropped into a 4:5 box, so it is drawn at about
            twice the box width: request that, and keep the box short enough for the source on 2x screens. */}
        {airport.image && (
          <div className="relative hidden aspect-[4/5] self-center overflow-hidden rounded-xl md:block">
            <Image src={airport.image} alt={airportImageAlt(airport.name)} fill sizes="34rem" className="object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}
