import Image from "next/image"
import Link from "next/link"
import { Briefcase, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VEHICLE_BEST_FOR } from "@/lib/fleet"
import type { VehicleClass } from "@/lib/types"

/** Fleet card shared by the homepage and every airport page; sits in a `.landing-fleet-grid`. */
export function VehicleCard({
  vehicle,
  index,
  href,
  bestFor,
}: {
  vehicle: Pick<VehicleClass, "id" | "name" | "image" | "capacity" | "luggage">
  index: number
  href: string
  bestFor?: string
}) {
  const line = bestFor ?? VEHICLE_BEST_FOR[vehicle.id]
  return (
    <article className="landing-vehicle-card">
      <div className="landing-vehicle-top"><span>Class {String(index + 1).padStart(2, "0")}</span><span>{vehicle.capacity} seats</span></div>
      <div className="landing-vehicle-image relative" style={{ position: "relative" }}>
        <Image
          src={vehicle.image || "/placeholder.svg"}
          alt={vehicle.name}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="landing-vehicle-copy">
        <h3>{vehicle.name}</h3>
        {line && <p className="landing-vehicle-best">{line}</p>}
        <div className="landing-vehicle-meta">
          <span><Users aria-hidden="true" /> {vehicle.capacity} passengers</span>
          <span><Briefcase aria-hidden="true" /> {vehicle.luggage} suitcases</span>
        </div>
        <Button variant="outline" className="landing-vehicle-button" nativeButton={false} render={<Link href={href} />}>
          Get a Price
        </Button>
      </div>
    </article>
  )
}
