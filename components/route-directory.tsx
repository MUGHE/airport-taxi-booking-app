"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeftRight } from "lucide-react"

export type RouteDirectoryEntry = { slug: string; fromName: string; toName: string }

export function RouteDirectory({ routes }: { routes: RouteDirectoryEntry[] }) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean)
    return routes.filter((route) => {
      const text = `${route.fromName} ${route.toName}`.toLocaleLowerCase()
      return words.every((word) => text.includes(word))
    })
  }, [query, routes])

  return (
    <section aria-labelledby="route-directory-heading" className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Popular journeys</p>
        <h1 id="route-directory-heading" className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Taxi routes</h1>
        <p className="mt-4 text-pretty text-muted-foreground">Fixed-price private taxis between airports, towns and cities. Every route works in both directions.</p>
      </div>
      <div className="mt-10 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <label className="text-sm font-medium">Search routes
          <input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="e.g. Heathrow or Birmingham" className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
        </label>
      </div>
      <p className="mt-8 text-sm text-muted-foreground" role="status">{filtered.length} {filtered.length === 1 ? "route" : "routes"}</p>
      {filtered.length ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((route) => (
            <li key={route.slug}>
              <Link href={`/${route.slug}`} className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 outline-none transition hover:-translate-y-0.5 hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/25">
                <span className="text-lg font-semibold tracking-tight group-hover:text-primary">{route.fromName} to {route.toName}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><ArrowLeftRight aria-hidden="true" className="size-4" />Also {route.toName} to {route.fromName}</span>
                <span className="mt-auto pt-5 text-sm font-medium text-primary">See prices →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border px-5 py-10 text-center text-muted-foreground" role="status">No routes match your search.</p>
      )}
    </section>
  )
}
