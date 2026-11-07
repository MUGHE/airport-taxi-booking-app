import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Route } from "lucide-react"
import { listPublishedAirportDirectory } from "@/lib/airport-directory"
import { AIRPORT_IMAGES } from "@/lib/airport-images"

// Terminals travellers recognise, shown instead of the council-area service name.
const AIRPORT_TERMINALS: Record<string, string> = {
  "heathrow-airport-taxi": "Terminals 2, 3, 4 and 5",
  "gatwick-airport-taxi": "North and South Terminals",
}

const MAX_AIRPORT_CARDS = 6

// The London airports always lead, Heathrow first as the wide card; any space left goes to featured airports.
const LONDON_AIRPORTS = ["heathrow-airport-taxi", "gatwick-airport-taxi", "luton-airport-taxi", "stansted-airport-taxi", "london-city-airport-taxi"]

// Long-distance destinations in the notice under the cards. Airport pages link only once published.
const LONG_DISTANCE: { label: string; href?: string; airportSlug?: string }[] = [
  { label: "Birmingham", airportSlug: "birmingham-airport-taxi" },
  { label: "Bristol", href: "/destinations/bristol-taxi" },
  { label: "Manchester", airportSlug: "manchester-airport-taxi" },
  { label: "Southampton Cruise Port", href: "/destinations/southampton-taxi" },
]

function listJoin(items: React.ReactNode[]) {
  return items.flatMap((item, index) => index === 0 ? [item] : [index === items.length - 1 ? ", and " : ", ", item])
}

// A wide + narrow pair on top, then four compact cards.
export async function AirportsCoverage() {
  const published = await listPublishedAirportDirectory()
  const rank = (slug: string) => { const index = LONDON_AIRPORTS.indexOf(slug); return index === -1 ? LONDON_AIRPORTS.length : index }
  const airports = [...published].sort((a, b) => rank(a.slug) - rank(b.slug) || Number(b.featured) - Number(a.featured)).slice(0, MAX_AIRPORT_CARDS)
  const publishedSlugs = new Set(published.map((airport) => airport.slug))
  const longDistance = LONG_DISTANCE.map(({ label, href, airportSlug }) => {
    const link = href ?? (airportSlug && publishedSlugs.has(airportSlug) ? `/airport-transfers/${airportSlug}` : undefined)
    return link ? <Link key={label} href={link}>{label}</Link> : <span key={label}>{label}</span>
  })
  return (
    <section className="landing-airports">
      <div className="landing-container">
      <div className="landing-section-heading">
        <div><span className="landing-eyebrow">Every London airport</span><h2>Your airport. Your driver. Right on time.</h2></div>
        <p>London Heathrow (LHR), Gatwick, Luton, Stansted and London City, to anywhere in London and across the UK.</p>
      </div>

      <div className="landing-airport-grid">
        {airports.map((airport, index) => (
          <Link
            key={airport.slug}
            href={`/airport-transfers/${airport.slug}`}
            className={`landing-airport-card group ${index === 0 ? "is-wide" : index === 1 ? "is-side" : "is-compact"}`}
          >
            <div className="landing-airport-image absolute inset-0" style={{ position: "absolute" }}>
              <Image src={AIRPORT_IMAGES[airport.slug] ?? "/placeholder.svg"} alt="" fill className="object-cover" sizes={index === 0 ? "(max-width: 900px) 100vw, 75vw" : "(max-width: 640px) 50vw, 25vw"} />
            </div>
            <div className="landing-airport-copy">
              <small>Airport {String(index + 1).padStart(2, "0")}</small>
              <h3>{airport.displayName} <span>({airport.iataCode})</span></h3>
              <p>{AIRPORT_TERMINALS[airport.slug] ?? "Door-to-door transfers"}</p>
              <span className="landing-arrow-link"><span>See <span className="landing-airport-link-name">{airport.displayName} </span>fares</span> <ArrowRight aria-hidden="true" /></span>
            </div>
          </Link>
        ))}
      </div>

      <aside className="landing-long-distance" aria-label="Long-distance transfers">
        <span className="landing-long-distance-badge"><Route aria-hidden="true" /> Long-distance</span>
        <p>Need transfers beyond London? We provide nationwide long-distance airport transfers to {listJoin(longDistance)}.</p>
      </aside>
      </div>
    </section>
  )
}
