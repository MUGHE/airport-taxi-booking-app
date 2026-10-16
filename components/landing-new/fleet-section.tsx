import Image from "next/image"
import Link from "next/link"
import { Briefcase, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VEHICLE_CLASSES, formatCurrency } from "@/lib/fleet"
import { getVehicleFleet } from "@/lib/actions"

// One line per vehicle class to help visitors pick by group size and luggage.
const BEST_FOR: Record<string, string> = {
  standard: "Best for solo travellers and couples",
  executive: "Best for business and premium travel",
  estate: "Best for small groups with luggage",
  mpv_4seater: "Best for families who want legroom",
  mpv: "Best for larger families and sports kit",
  minibus_8seater: "Best for groups, teams and events",
}

export async function FleetSection() {
  const vehicles = (await getVehicleFleet()) ?? VEHICLE_CLASSES
  return (
    <section id="fleet" className="landing-fleet scroll-mt-20">
      <div className="landing-container">
        <div className="landing-section-heading">
          <div><span className="landing-eyebrow landing-eyebrow-light">Our fleet</span><h2>The right car for every trip.</h2></div>
          <p>Solo business trip or family of eight with luggage, there&apos;s a car that fits.</p>
        </div>

        <div className="landing-fleet-grid">
          {vehicles.map((v, index) => (
            <article key={v.id} className="landing-vehicle-card">
              <div className="landing-vehicle-top"><span>Class {String(index + 1).padStart(2, "0")}</span><span>From {formatCurrency(v.minFare)}</span></div>
              <div className="landing-vehicle-image relative" style={{ position: "relative" }}>
                <Image
                  src={v.image || "/placeholder.svg"}
                  alt={v.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="landing-vehicle-copy">
                <h3>{v.name}</h3>
                {BEST_FOR[v.id] && <p className="landing-vehicle-best">{BEST_FOR[v.id]}</p>}
                <div className="landing-vehicle-meta">
                  <span><Users aria-hidden="true" /> {v.capacity} passengers
                  </span>
                  <span><Briefcase aria-hidden="true" /> {v.luggage} suitcases
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="landing-vehicle-button"
                  nativeButton={false}
                  render={<Link href="/book" />}
                >
                  Get a Price
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
