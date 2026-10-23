import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { listPublishedAirportDirectory } from "@/lib/airport-directory"
import { AIRPORT_IMAGES } from "@/lib/airport-images"

// Terminals travellers recognise, shown instead of the council-area service name.
const AIRPORT_TERMINALS: Record<string, string> = {
  "heathrow-airport-taxi": "Terminals 2, 3, 4 and 5",
  "gatwick-airport-taxi": "North and South Terminals",
}

const MAX_AIRPORT_CARDS = 6

// Every published airport, featured ones first: a wide + narrow pair on top, then four compact cards.
export async function AirportsCoverage() {
  const published = await listPublishedAirportDirectory()
  const airports = [...published.filter((a) => a.featured), ...published.filter((a) => !a.featured)].slice(0, MAX_AIRPORT_CARDS)
  return (
    <section className="landing-airports">
      <div className="landing-container">
      <div className="landing-section-heading">
        <div><span className="landing-eyebrow">Every London airport</span><h2>Your airport. Your driver. Right on time.</h2></div>
        <p>Heathrow, Gatwick, Stansted, Luton, City and Southend, to anywhere in London and across the UK.</p>
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
      </div>
    </section>
  )
}
