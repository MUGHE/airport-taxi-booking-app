import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, MapPin, PlaneLanding } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CallToAction } from "@/components/landing/cta"
import { AIRPORT_PAGES } from "@/lib/airport-content"

export const metadata: Metadata = {
  title: "Airport Transfers",
  description:
    "Fixed-price taxi transfers to and from London's airports — Heathrow, Gatwick, Stansted, Luton, London City and Southend. Meet & greet and flight tracking on every trip.",
  alternates: { canonical: "/airport-transfers" },
}

export default function AirportTransfersHubPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-4 text-center lg:pt-20">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Airport Transfers" }]}
            className="justify-center"
          />
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Fixed-price airport transfers across London
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Choose your airport for terminal details, an instant quote, and a
            professional chauffeur who tracks your flight and meets you at
            arrivals.
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AIRPORT_PAGES.map((airport) => (
              <Link
                key={airport.slug}
                href={`/airport-transfers/${airport.slug}`}
                className="hover-lift group rounded-2xl border border-border/70 bg-card p-6 transition-colors hover:border-primary/40"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PlaneLanding className="size-5" />
                </span>
                <h2 className="mt-4 font-semibold">{airport.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {airport.area} &middot; {airport.code}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {airport.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  View {airport.shortName} transfers
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  )
}
