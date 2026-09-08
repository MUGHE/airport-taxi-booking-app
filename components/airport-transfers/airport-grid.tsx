import Image from "next/image"
import Link from "next/link"
import { ArrowRight, PlaneTakeoff } from "lucide-react"
import { AIRPORT_PAGES } from "@/lib/airport-content"

const AIRPORT_IMAGES: Record<string, string> = {
  heathrow: "/hero-airport-transfer.png",
  gatwick: "/airport-transfers/gatwick.webp",
  stansted: "/airport-transfers/gatwick.webp",
  luton: "/airport-transfers/luton.webp",
  "london-city": "/airport-transfers/london-city.webp",
  southend: "/airport-transfers/southend.webp",
}

const TERMINAL_LABEL: Record<string, string> = {
  heathrow: "Terminals 2, 3, 4 & 5",
  gatwick: "North & South Terminals",
  stansted: "Main terminal",
  luton: "Main terminal",
  "london-city": "Main terminal",
  southend: "Main terminal",
}

export function AirportGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            London airports
          </span>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose your airport
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground">
            Meet &amp; greet transfers to and from London&apos;s major airports.
          </p>
        </div>
        <Link
          href="/airport-transfers"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          All airports
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {AIRPORT_PAGES.map((airport) => (
          <Link
            key={airport.slug}
            href={`/airport-transfers/${airport.slug}`}
            style={{ animationDelay: `${AIRPORT_PAGES.indexOf(airport) * 90}ms` }}
            className="animate-card-in hover-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card outline-none transition-colors hover:border-primary/50 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={AIRPORT_IMAGES[airport.slug] ?? "/placeholder.svg"}
                alt={`${airport.shortName} airport transfer service`}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-focus-visible:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-transparent to-foreground/10" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                <span className="flex items-center gap-1.5 text-xs font-medium text-background/90">
                  <PlaneTakeoff className="size-3.5" />
                  London airport
                </span>
                <span className="rounded-full border border-background/30 bg-background/90 px-2.5 py-1 text-xs font-bold tracking-wide text-foreground shadow-sm backdrop-blur-sm">
                  {airport.code}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div>
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">Airport transfers</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  {airport.shortName}
                </h3>
              </div>
              <div className="mt-3 inline-flex w-fit items-center rounded-full bg-primary/8 px-3 py-1.5 text-sm text-muted-foreground">
                {TERMINAL_LABEL[airport.slug]}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4 text-sm font-medium text-primary">
                <span>Get a fixed price</span>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary group-focus-visible:bg-primary group-hover:text-primary-foreground group-focus-visible:text-primary-foreground">
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
