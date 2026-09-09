import Image from "next/image"
import Link from "next/link"
import { Banknote, PlaneLanding, ShieldCheck } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CallToAction } from "@/components/landing/cta"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import type { AirportPagePresentation } from "@/lib/airport-page-data"
import { formatCurrency } from "@/lib/fleet"
import { AirportQuoteActions } from "@/components/airport-page/airport-quote-actions"
import type { RichTextBlock } from "@/lib/destination-content"

function RichText({ blocks }: { blocks: RichTextBlock[] }) {
  return <div className="space-y-3 text-left text-muted-foreground">{blocks.map((block, index) => {
    if (block.type === "link" && block.href) return <Link key={`${block.text}-${index}`} className="block text-primary underline" href={block.href}>{block.label || block.text}</Link>
    if (block.type === "heading") return <h3 key={`${block.text}-${index}`} className="font-semibold text-foreground">{block.text}</h3>
    if (block.type === "bold") return <p key={`${block.text}-${index}`} className="font-semibold text-foreground">{block.text}</p>
    if (block.type === "list") return <li key={`${block.text}-${index}`} className="ml-5 list-disc">{block.text}</li>
    return <p key={`${block.text}-${index}`} className="leading-relaxed">{block.text}</p>
  })}</div>
}

export function AirportPageRenderer({ page, canonicalPath }: { page: AirportPagePresentation; canonicalPath?: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {page.heroImage ? <section className="relative overflow-hidden bg-foreground">
          <div className="absolute inset-0">
            <img className="size-full object-cover object-center" src={page.heroImage.secureUrl} alt={page.heroImage.altText} />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/30" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-12 text-background sm:py-16 lg:py-20">
            <div className="max-w-3xl">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Airport Transfers", href: "/airport-transfers" },
                  { label: page.shortName, href: canonicalPath },
                ]}
                className="[&_span]:text-background/90 [&_svg]:text-background/40 [&_a]:text-background/70"
              />
              <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{page.heading}</h1>
              {page.intro.map((paragraph) => <p key={paragraph} className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-background/80">{paragraph}</p>)}
              <AirportQuoteActions page={page} onDarkBackground />
            </div>
          </div>
        </section> : <div className="mx-auto max-w-3xl px-4 pt-14 pb-4 text-center lg:pt-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Airport Transfers", href: "/airport-transfers" },
              { label: page.shortName, href: canonicalPath },
            ]}
            className="justify-center"
          />
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {page.heading}
          </h1>
          {page.intro.map((paragraph) => (
            <p key={paragraph} className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
          <AirportQuoteActions page={page} />
        </div>}

        {page.sections.filter((section) => section.visible).map((section) => <section key={section.id} className="mx-auto max-w-5xl px-4 py-10 lg:py-16" data-preview-section={section.type}>
          <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{section.title}</h2>
            {section.image && <img className="mt-6 max-h-80 w-full rounded-xl object-cover" src={section.image.secureUrl} alt={section.image.altText} />}
            <div className="mt-5"><RichText blocks={section.body} /></div>
            {section.type === "airport_guide" && <div className="mt-6 grid gap-4 sm:grid-cols-2">{Object.entries(section.fields).filter(([key, value]) => key !== "sourceNotes" && value.trim()).map(([key, value]) => <div key={key}><h3 className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{value}</p></div>)}</div>}
            {section.type === "map" && <div className="mt-6 rounded-xl bg-secondary p-5"><p className="font-medium">Airport map</p><p className="mt-1 text-sm text-muted-foreground">Showing the saved airport location at {page.terminals[0]?.latitude ?? "—"}, {page.terminals[0]?.longitude ?? "—"}.</p></div>}
          </div>
        </section>)}

        {page.terminals.length > 0 && (
          <div className="mx-auto max-w-4xl px-4 py-10">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Terminals we cover</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {page.terminals.map((terminal) => (
                <div key={terminal.id} className="rounded-2xl border border-border/70 bg-card p-5">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <PlaneLanding className="size-4.5" />
                  </span>
                  <p className="mt-3 font-medium">{terminal.name}</p>
                  <p className="text-sm text-muted-foreground">{terminal.area}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {page.relatedDestinations.length > 0 && <div className="mx-auto max-w-5xl px-4 py-10 lg:py-16"><h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">Related destinations</h2><div className="mt-8 grid gap-5 sm:grid-cols-2">{page.relatedDestinations.map((related) => <article key={related.id} className="rounded-2xl border border-border/70 bg-card p-5">{related.image && <img className="mb-4 aspect-video w-full rounded-xl object-cover" src={related.image} alt={related.displayName} />}<h3 className="text-xl font-semibold"><Link className="hover:underline" href={related.href}>{related.heading}</Link></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{related.description}</p><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" nativeButton={false} render={<Link href={related.bookingLinks.toAirport} />}>Get fixed price to {related.displayName}</Button><Button size="sm" variant="outline" nativeButton={false} render={<Link href={related.bookingLinks.fromAirport} />}>From {related.displayName}</Button></div></article>)}</div></div>}

        {page.serviceFacts.length > 0 && <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
          <div className="mx-auto max-w-2xl text-center"><h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Our service facts</h2></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{page.serviceFacts.map((fact) => <div key={fact.id} className="rounded-2xl border border-border/70 bg-card p-5"><h3 className="font-semibold">{fact.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{fact.description}</p></div>)}</div>
        </div>}

        <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Why book with us</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {page.benefits.map((benefit) => (
              <div key={benefit.title} className="hover-lift rounded-2xl border border-border/70 bg-card p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {benefit.icon === "fare" ? <Banknote className="size-5" /> : <ShieldCheck className="size-5" />}
                </span>
                <h3 className="mt-4 font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Choose your vehicle</h2>
            <p className="mt-3 text-pretty text-muted-foreground">Fares for {page.shortName} transfers start from:</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.vehicles.map((vehicle) => (
              <div key={vehicle.id} className="hover-lift rounded-2xl border border-border/70 bg-card p-5">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-secondary/40">
                  <Image src={vehicle.image} alt={vehicle.name} fill className="object-contain p-4" />
                </div>
                <h3 className="mt-4 font-semibold">{vehicle.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{vehicle.description}</p>
                <p className="mt-3 text-sm font-medium">From {formatCurrency(vehicle.minFare)}</p>
              </div>
            ))}
          </div>
        </div>

        {page.reviews.length > 0 && <div className="mx-auto max-w-4xl px-4 py-10 lg:py-16">
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">Verified reviews</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">{page.reviews.map((review) => <blockquote key={review.id} className="rounded-2xl border border-border/70 bg-card p-5"><p className="leading-relaxed">“{review.quote}”</p><footer className="mt-3 text-sm text-muted-foreground">{review.author} · {review.source}</footer></blockquote>)}</div>
        </div>}

        <div className="mx-auto max-w-3xl px-4 py-10 lg:py-16">
          <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-8">
            {page.globalFaqs.length > 0 && <div><p className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Shared FAQs</p><div className="space-y-6">{page.globalFaqs.map((faq) => <div key={faq.id}><h3 className="font-semibold">{faq.question}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p></div>)}</div></div>}
            {(page.airportFaqs.length > 0 || page.globalFaqs.length === 0) && <div><p className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Airport-specific FAQs</p><div className="space-y-6">{(page.airportFaqs.length > 0 ? page.airportFaqs : page.faqs).map((faq) => <div key={faq.question}><h3 className="font-semibold">{faq.question}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p></div>)}</div></div>}
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 text-center lg:py-16"><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.finalCta.heading}</h2><RichText blocks={page.finalCta.body} /></div>
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  )
}
