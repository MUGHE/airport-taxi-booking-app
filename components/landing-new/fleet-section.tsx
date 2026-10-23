import { VehicleCard } from "@/components/vehicle-card"
import { VEHICLE_CLASSES } from "@/lib/fleet"
import { getVehicleFleet } from "@/lib/actions"

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
          {vehicles.map((v, index) => <VehicleCard key={v.id} vehicle={v} index={index} href="/book" />)}
        </div>
      </div>
    </section>
  )
}
