import type { Metadata } from "next"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { FareEstimator } from "@/components/fare-estimator"
import { FaqCategoryNav } from "@/components/faq-page/faq-category-nav"
import { FaqCategorySection } from "@/components/faq-page/faq-category-section"
import { SupportCard } from "@/components/faq-page/support-card"
import { getStopPricing } from "@/lib/actions"
import { FAQ_PAGE_CATEGORIES } from "@/lib/faqs"
import { serializeJsonLd } from "@/lib/json-ld"

export const revalidate = 300

const TITLE = "Frequently Asked Questions"
const DESCRIPTION = "Find answers to our most common questions about bookings, payments, airport pickups, and more."

// openGraph and twitter replace the root layout ones wholesale, so the shared fields are repeated here.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/faqs" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/faqs",
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

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_PAGE_CATEGORIES.flatMap((category) => category.items).map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a.join(" ") },
  })),
}

export default async function FaqsPage() {
  const stopPricing = await getStopPricing()
  return (
    <div className="faq-page flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(FAQ_SCHEMA) }} />
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:py-14">
            <div>
              <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQs" }]} />
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{TITLE}</h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground text-pretty">{DESCRIPTION}</p>
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
              <FaqCategoryNav groups={[{ title: "Categories", categories: FAQ_PAGE_CATEGORIES.map(({ id, title }) => ({ id, title })) }]} />
            </div>
          </aside>

          <div className="min-w-0 space-y-10">
            {FAQ_PAGE_CATEGORIES.map((category) => (
              <FaqCategorySection key={category.id} category={category} />
            ))}
          </div>

          <aside aria-label="Get a quote">
            <div className="lg:sticky lg:top-24">
              <div className="landing-quote-card overflow-visible! shadow-lg!">
                <FareEstimator stopPricing={stopPricing} />
              </div>
            </div>
          </aside>
        </div>

        <SupportCard />
      </main>
      <SiteFooter />
    </div>
  )
}
