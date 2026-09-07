import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AIRPORT_PAGES } from "@/lib/airport-content"

// Placeholder photography (see components/landing-new plan) — one distinct stock photo per
// airport card, keyed by AIRPORT_PAGES slug. Swap for real/generated terminal photos later.
const AIRPORT_IMAGES: Record<string, string> = {
  heathrow: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=70&auto=format&fit=crop",
  gatwick: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&q=70&auto=format&fit=crop",
  stansted: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=70&auto=format&fit=crop",
  luton: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=800&q=70&auto=format&fit=crop",
  "london-city": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=70&auto=format&fit=crop",
  southend: "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=800&q=70&auto=format&fit=crop",
}

const TERMINAL_LABEL: Record<string, string> = {
  heathrow: "Terminals 2, 3, 4, 5",
  gatwick: "North & South Terminals",
  stansted: "All terminals",
  luton: "All terminals",
  "london-city": "All terminals",
  southend: "All terminals",
}

export function AirportsCoverage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          All London airports
        </span>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Find your airport
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          We provide airport transfers to and from all major London airports.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {AIRPORT_PAGES.map((airport) => (
          <Link
            key={airport.slug}
            href={`/airport-transfers/${airport.slug}`}
            className="hover-lift group overflow-hidden rounded-2xl border border-border/70 bg-card transition-colors hover:border-primary/40"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={AIRPORT_IMAGES[airport.slug] ?? "/placeholder.svg"}
                alt={airport.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <p className="font-semibold">
                {airport.shortName} <span className="text-muted-foreground">({airport.code})</span>
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{TERMINAL_LABEL[airport.slug]}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Get a quote
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
