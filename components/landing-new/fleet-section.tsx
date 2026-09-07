import Image from "next/image"
import Link from "next/link"
import { Briefcase, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VEHICLE_CLASSES } from "@/lib/fleet"
import { getVehicleFleet } from "@/lib/actions"

export async function FleetSection() {
  const vehicles = (await getVehicleFleet()) ?? VEHICLE_CLASSES
  return (
    <section id="fleet" className="scroll-mt-20 bg-card/60 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            Travel your way
          </span>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose the right vehicle after you get your quote
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            A range of high-quality, comfortable vehicles to suit your needs.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="hover-lift overflow-hidden rounded-2xl border border-border/70 bg-background"
            >
              <div className="relative aspect-[4/3] bg-secondary">
                <Image
                  src={v.image || "/placeholder.svg"}
                  alt={v.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{v.name}</h3>
                <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" /> {v.capacity} passengers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-4" /> {v.luggage} suitcases
                  </span>
                </div>
                <Button
                  variant="secondary"
                  className="mt-5 w-full"
                  nativeButton={false}
                  render={<Link href="/book" />}
                >
                  Select after quote
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
