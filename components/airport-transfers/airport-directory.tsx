"use client"

import Link from "next/link"
import { ArrowRight, PlaneTakeoff } from "lucide-react"
import { useMemo, useState } from "react"
import type { AirportDirectoryEntry } from "@/lib/airport-directory"

const AIRPORT_IMAGES: Record<string, string> = {
  "heathrow-airport-taxi": "/hero-airport-transfer.png",
  "gatwick-airport-taxi": "/airport-transfers/gatwick.webp",
  "stansted-airport-taxi": "/airport-transfers/gatwick.webp",
  "luton-airport-taxi": "/airport-transfers/luton.webp",
  "london-city-airport-taxi": "/airport-transfers/london-city.webp",
  "southend-airport-taxi": "/airport-transfers/southend.webp",
}

function matchesSearch(airport: AirportDirectoryEntry, query: string) {
  const searchable = `${airport.displayName} ${airport.iataCode} ${airport.serviceArea}`.toLowerCase()
  return searchable.includes(query.trim().toLowerCase())
}

export function AirportDirectory({ airports }: { airports: AirportDirectoryEntry[] }) {
  const [query, setQuery] = useState("")
  const filteredAirports = useMemo(() => airports.filter((airport) => matchesSearch(airport, query)), [airports, query])

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24" aria-labelledby="airport-directory-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">London airports</span>
          <h2 id="airport-directory-heading" className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Find your airport
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground">Browse every Published Airport Page or search by airport, code, or service area.</p>
        </div>
        <div className="w-full sm:max-w-xs">
          <label htmlFor="airport-search" className="text-sm font-medium">Search airports</label>
          <input
            id="airport-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Name, code, or area"
            className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {filteredAirports.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAirports.map((airport, index) => (
            <Link
              key={airport.id}
              href={`/airport-transfers/${airport.slug}`}
              style={{ animationDelay: `${index * 90}ms` }}
              className="animate-card-in hover-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card outline-none transition-colors hover:border-primary/50 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={AIRPORT_IMAGES[airport.slug] ?? "/placeholder.svg"}
                  alt={`${airport.displayName} airport transfer service`}
                  className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-focus-visible:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-transparent to-foreground/10" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-background/90"><PlaneTakeoff className="size-3.5" />London airport</span>
                  <span className="rounded-full border border-background/30 bg-background/90 px-2.5 py-1 text-xs font-bold tracking-wide text-foreground shadow-sm backdrop-blur-sm">{airport.iataCode}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">Airport transfers</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">{airport.displayName}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Serving {airport.serviceArea}</p>
                <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4 text-sm font-medium text-primary"><span>Get a fixed price</span><span className="flex size-8 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary group-focus-visible:bg-primary group-hover:text-primary-foreground group-focus-visible:text-primary-foreground"><ArrowRight className="size-4" /></span></div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p role="status" className="mt-10 rounded-xl border border-dashed border-border px-5 py-10 text-center text-muted-foreground">No Published Airport Pages match “{query}”. Try an airport name, IATA code, or service area.</p>
      )}
    </section>
  )
}
