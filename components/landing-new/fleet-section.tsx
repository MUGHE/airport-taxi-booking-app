import Image from "next/image"
import Link from "next/link"
import { Briefcase, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VEHICLE_CLASSES } from "@/lib/fleet"
import { getVehicleFleet } from "@/lib/actions"

export async function FleetSection() {
  const vehicles = (await getVehicleFleet()) ?? VEHICLE_CLASSES
  return (
    <section id="fleet" className="landing-fleet scroll-mt-20">
      <div className="landing-container">
        <div className="landing-section-heading">
          <div><span className="landing-eyebrow landing-eyebrow-light">Travel your way</span><h2>A vehicle for every kind of arrival.</h2></div>
          <p>From a quiet ride for one to space for the whole group. Choose after seeing your fixed price.</p>
        </div>

        <div className="landing-fleet-grid">
          {vehicles.map((v, index) => (
            <article key={v.id} className="landing-vehicle-card">
              <div className="landing-vehicle-top"><span>Class {String(index + 1).padStart(2, "0")}</span><span>{v.capacity} seats</span></div>
              <div className="landing-vehicle-image relative" style={{ position: "relative" }}>
                <Image
                  src={v.image || "/placeholder.svg"}
                  alt={v.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="landing-vehicle-copy">
                <h3>{v.name}</h3>
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
                  Get a fixed price
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
