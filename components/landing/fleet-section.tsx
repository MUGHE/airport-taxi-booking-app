import { VEHICLE_CLASSES } from "@/lib/fleet"
import { getVehicleFleet } from "@/lib/actions"
import { FleetCarousel } from "@/components/landing/fleet-carousel"

export async function FleetSection() {
  const vehicles = (await getVehicleFleet()) ?? VEHICLE_CLASSES
  return (
    <section id="fleet" className="scroll-mt-20 bg-card/60 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose your class of comfort
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            From everyday sedans to first-class luxury, every vehicle is clean,
            insured, and driven by a vetted professional.
          </p>
        </div>

        <FleetCarousel vehicles={vehicles} />
      </div>
    </section>
  )
}
