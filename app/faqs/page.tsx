import type { Metadata } from "next"
import Image from "next/image"
import { Mail, MessageCircle, Phone } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { FareEstimator } from "@/components/fare-estimator"
import { FaqCategoryNav } from "@/components/faq-page/faq-category-nav"
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { getStopPricing } from "@/lib/actions"
import { CALL_LINK, CALL_NUMBER, CONTACT_EMAIL, EMAIL_LINK, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/contact"
import { FAQ_PAGE_CATEGORIES } from "@/lib/faqs"
import { serializeJsonLd } from "@/lib/json-ld"
import { cn } from "@/lib/utils"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to our most common questions about bookings, payments, airport pickups, vehicles and policies at ONE Airport Taxi.",
  alternates: { canonical: "/faqs" },
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
              <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Help &amp; answers</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Frequently Asked Questions</h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground text-pretty">
                Find answers to our most common questions about bookings, payments, airport pickups, and more.
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
              <FaqCategoryNav categories={FAQ_PAGE_CATEGORIES.map(({ id, title }) => ({ id, title }))} />
            </div>
          </aside>

          <div className="min-w-0 space-y-10">
            {FAQ_PAGE_CATEGORIES.map((category) => (
              <section key={category.id} id={category.id} className="scroll-mt-24" aria-labelledby={`${category.id}-title`}>
                <h2 id={`${category.id}-title`} className="text-xl font-semibold tracking-tight">{category.title}</h2>
                <Accordion className="mt-4 rounded-2xl border border-border bg-card px-5" multiple>
                  {category.items.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger>{item.q}</AccordionTrigger>
                      <AccordionPanel>
                        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                          {item.a.map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
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

        <section className="mx-auto max-w-7xl px-4 pb-14 lg:pb-20" aria-labelledby="still-questions">
          <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <h2 id="still-questions" className="text-2xl font-semibold tracking-tight">Still have questions?</h2>
              <p className="mt-2 text-muted-foreground">
                Our support team is available 24/7 to assist you with bookings, changes, or special requests.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <a href={CALL_LINK} className={cn(buttonVariants({ size: "lg" }), "h-auto flex-col gap-0.5 py-3")}>
                <span className="flex items-center gap-2"><Phone aria-hidden="true" className="size-4" /> Call us</span>
                <span className="text-xs font-normal opacity-85">{CALL_NUMBER}</span>
              </a>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-auto flex-col gap-0.5 py-3")}>
                <span className="flex items-center gap-2"><MessageCircle aria-hidden="true" className="size-4" /> WhatsApp</span>
                <span className="text-xs font-normal text-muted-foreground">+{WHATSAPP_NUMBER.replace(/^\+/, "")}</span>
              </a>
              <a href={EMAIL_LINK} className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-auto flex-col gap-0.5 py-3")}>
                <span className="flex items-center gap-2"><Mail aria-hidden="true" className="size-4" /> Email</span>
                <span className="text-xs font-normal text-muted-foreground">{CONTACT_EMAIL}</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
