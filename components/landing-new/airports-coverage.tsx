import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { listFeaturedAirports } from "@/lib/airport-directory"

const AIRPORT_IMAGES: Record<string, string> = {
  "heathrow-airport-taxi": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=70&auto=format&fit=crop",
  "gatwick-airport-taxi": "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&q=70&auto=format&fit=crop",
  "stansted-airport-taxi": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=70&auto=format&fit=crop",
  "luton-airport-taxi": "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=800&q=70&auto=format&fit=crop",
  "london-city-airport-taxi": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=70&auto=format&fit=crop",
  "southend-airport-taxi": "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=800&q=70&auto=format&fit=crop",
}

// One distinct stock photo per existing airport card; new airports use the placeholder.
export async function AirportsCoverage() {
  const airports = await listFeaturedAirports()
  return (
    <section className="landing-airports">
      <div className="landing-container">
      <div className="landing-section-heading">
        <div><span className="landing-eyebrow">All London airports</span><h2>Your airport. Your driver. Right on time.</h2></div>
        <p>Door-to-door transfers across every major London airport and the places beyond.</p>
      </div>

      <div className="landing-airport-grid">
        {airports.map((airport, index) => (
          <Link
            key={airport.slug}
            href={`/airport-transfers/${airport.slug}`}
            className="landing-airport-card group"
          >
            <div className="landing-airport-image absolute inset-0" style={{ position: "absolute" }}>
              <Image src={AIRPORT_IMAGES[airport.slug] ?? "/placeholder.svg"} alt={`${airport.displayName} airport`} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
            </div>
            <div className="landing-airport-copy">
              <small>Airport {String(index + 1).padStart(2, "0")}</small>
              <h3>{airport.displayName} <span>({airport.iataCode})</span></h3>
              <p>Serving {airport.serviceArea}</p>
              <span className="landing-arrow-link">Explore transfers <ArrowRight aria-hidden="true" /></span>
            </div>
          </Link>
        ))}
      </div>
      <div className="landing-airports-action"><Link href="/airport-transfers" className="landing-arrow-link">View every airport <ArrowRight aria-hidden="true" /></Link></div>
      </div>
    </section>
  )
}
