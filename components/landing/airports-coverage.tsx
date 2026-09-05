import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AIRPORT_PAGES } from "@/lib/airport-content"

export function AirportsCoverage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Airports we cover
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          Fixed-price transfers to and from every major London airport.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AIRPORT_PAGES.map((airport) => (
          <Link
            key={airport.slug}
            href={`/airport-transfers/${airport.slug}`}
            className="hover-lift group flex items-center justify-between rounded-xl border border-border/70 bg-card px-5 py-4 transition-colors hover:border-primary/40"
          >
            <span className="font-medium">{airport.name}</span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  )
}
