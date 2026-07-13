import Image from "next/image"
import Link from "next/link"
import { Briefcase, Check, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VEHICLE_CLASSES, formatCurrency } from "@/lib/fleet"
import { getVehicleFleet } from "@/lib/actions"

export async function FleetSection() {
  const vehicles = (await getVehicleFleet()) ?? []
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

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VEHICLE_CLASSES.map((v) => (
            <div
              key={v.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-background"
            >
              <div className="relative aspect-[4/3] bg-secondary">
                <Image
                  src={v.image || "/placeholder.svg"}
                  alt={v.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{v.name}</h3>
                  <span className="text-sm font-medium text-muted-foreground">
                    from {formatCurrency(v.minFare)}
                  </span> 
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {v.description}
                </p>

                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" /> {v.capacity}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-4" /> {v.luggage}
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {v.features.slice(0, 3).map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="size-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  nativeButton={false}
                  render={<Link href={`/book?vehicle=${v.id}`} />}
                >
                  Select {v.name}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
