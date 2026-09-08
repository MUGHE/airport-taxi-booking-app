import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FleetGuidance() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
          <Image
            src="/hero-airport-transfer.png"
            alt="Chauffeur loading luggage beside an airport transfer car"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>
        <div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            Travel comfortably
          </span>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Need help choosing the right vehicle?
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            From solo travellers to larger groups, we have a range of modern,
            comfortable vehicles to suit your journey.
          </p>
          <Button className="mt-6" nativeButton={false} render={<Link href="/#fleet" />}>
            Compare our fleet
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
