import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Banknote, PlaneLanding, ShieldCheck } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CallToAction } from "@/components/landing/cta"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import type { AirportPagePresentation } from "@/lib/airport-page-data"
import { formatCurrency } from "@/lib/fleet"

export function AirportPageRenderer({ page }: { page: AirportPagePresentation }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-4 text-center lg:pt-20">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Airport Transfers", href: "/airport-transfers" },
              { label: page.shortName },
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
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={<Link href={page.bookingLinks.toAirport} />}>
              Get a fixed price to {page.shortName}
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href={page.bookingLinks.fromAirport} />}>
              {page.shortName} to your destination
            </Button>
          </div>
        </div>

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

        <div className="mx-auto max-w-3xl px-4 py-10 lg:py-16">
          <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-6">
            {page.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  )
}
