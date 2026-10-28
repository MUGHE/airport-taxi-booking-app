import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { FareEstimator } from "@/components/fare-estimator"
import { FaqCategoryNav } from "@/components/faq-page/faq-category-nav"
import { FaqCategorySection } from "@/components/faq-page/faq-category-section"
import { OpenFaqFromHash } from "@/components/faq-page/open-faq-from-hash"
import { SupportCard } from "@/components/faq-page/support-card"
import { getStopPricing } from "@/lib/actions"
import { FAQ_PAGE_CATEGORIES } from "@/lib/faqs"
import { HELP_GUIDE } from "@/lib/help-content"
import { serializeJsonLd } from "@/lib/json-ld"

export const revalidate = 300

const TITLE = "Help Centre & FAQs"
const DESCRIPTION =
  "Quick help with booking, fares, flight tracking, payment and managing your ONE Airport Taxi booking, plus detailed answers to our most common questions."

// openGraph and twitter replace the root layout ones wholesale, so the shared fields are repeated here.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/help" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/help",
    siteName: "ONE Airport Taxi",
    title: `${TITLE} | ONE Airport Taxi`,
    description: DESCRIPTION,
    images: [{ url: "/hero-airport-transfer-og.jpg", alt: "ONE Airport Taxi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ONE Airport Taxi`,
    description: DESCRIPTION,
    images: ["/hero-airport-transfer-og.jpg"],
  },
}

// FAQ section and question ids get their own prefixes so they never clash with the Help Centre ones.
const faqId = (id: string) => `faq-${id}`
const FAQ_QUESTION_PREFIX = "faq-q-"

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  // Only the FAQs: the Help Centre quick guide points to these same answers, so it is left out.
  mainEntity: FAQ_PAGE_CATEGORIES.flatMap((category) => category.items).map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a.join(" ") },
  })),
}

export default async function HelpPage() {
  const stopPricing = await getStopPricing()
  return (
    <div className="faq-page flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(FAQ_SCHEMA) }} />
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:py-14">
            <div>
              <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help Centre" }]} />
              <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Help &amp; answers</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Help Centre</h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground text-pretty">
                Answers to the questions we hear most, based on exactly how booking with us works.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Already booked?{" "}
                <Link href="/track" className="font-medium text-primary hover:underline">Track your booking</Link>
              </p>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl ring-1 ring-border shadow-lg">
              <Image
                src="/airport-transfers/chauffeur-terminal-hero.webp"
                alt="A driver beside an executive car outside an airport terminal"
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

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-14 xl:grid-cols-[13rem_minmax(0,1fr)_23rem]">
          <aside className="lg:col-span-2 xl:col-span-1">
            <div className="xl:sticky xl:top-24">
              <FaqCategoryNav
                groups={[
                  { title: "Help Centre", categories: HELP_GUIDE.map(({ id, title }) => ({ id, title })) },
                  { title: "FAQs", categories: FAQ_PAGE_CATEGORIES.map(({ id, title }) => ({ id: faqId(id), title })) },
                ]}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Quick guide</p>
            <div className="mt-4 space-y-10">
              {HELP_GUIDE.map((category) => (
                <section key={category.id} id={category.id} className="scroll-mt-24" aria-labelledby={`${category.id}-title`}>
                  <h2 id={`${category.id}-title`} className="text-xl font-semibold tracking-tight">{category.title}</h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {category.items.map((item) => (
                      <li key={item.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                        <h3 className="font-semibold">{item.title}</h3>
                        <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                          {item.body.map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                        {item.faq && (
                          <a href={`#${FAQ_QUESTION_PREFIX}${item.faq}`} aria-label={`Read the full answer about ${item.title.toLowerCase()}`} className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary hover:underline">
                            Read the full answer <ArrowRight aria-hidden="true" className="size-3.5" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="mt-14 border-t border-border pt-10">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">FAQs</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Frequently Asked Questions</h2>
              <p className="mt-2 text-muted-foreground">
                Find answers to our most common questions about bookings, payments, airport pickups, and more.
              </p>
              <div className="mt-8 space-y-10">
                {FAQ_PAGE_CATEGORIES.map((category) => (
                  <FaqCategorySection key={category.id} category={category} id={faqId(category.id)} itemIdPrefix={FAQ_QUESTION_PREFIX} />
                ))}
              </div>
            </div>
          </div>

          <aside aria-label="Get a quote">
            <div className="lg:sticky lg:top-24">
              <p className="mb-3 text-sm font-semibold">Ready to book? Get your fixed price</p>
              <div className="landing-quote-card overflow-visible! shadow-lg!">
                <FareEstimator stopPricing={stopPricing} />
              </div>
            </div>
          </aside>
        </div>

        <SupportCard />
        <OpenFaqFromHash prefix={FAQ_QUESTION_PREFIX} />
      </main>
      <SiteFooter />
    </div>
  )
}
