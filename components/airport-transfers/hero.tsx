import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FareEstimator } from "@/components/fare-estimator"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/breadcrumbs"
import type { StopPricing } from "@/lib/types"

export function AirportTransfersHero({ stopPricing }: { stopPricing: StopPricing }) {
  return (
    <section className="relative overflow-hidden bg-foreground">
      <div className="absolute inset-0">
        <Image
          src="/airport-transfers/hero.webp"
          alt="Chauffeur welcoming airport passengers beside a car"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/30" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-8 sm:pt-10 lg:pt-12">
        <div className="max-w-2xl text-background">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Airport Transfers" }]}
            className="text-background/70 [&_span]:text-background/90 [&_svg]:text-background/40"
          />
          <span className="text-xs font-semibold tracking-[0.14em] text-background/70 uppercase">
            All London airports
          </span>
          <h1 className="mt-3 max-w-xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Fixed-price airport transfers across London
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-background/80 sm:text-lg">
            Choose your airport, get a fixed price for your route, and travel with
            a professional chauffeur who tracks your flight.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={<Link href="/book" />}>
              Get your fixed price
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              nativeButton={false}
              render={<Link href="/track" />}
            >
              Track an existing booking
            </Button>
          </div>
        </div>

        <div className="relative z-10 mt-10 translate-y-10 lg:mt-12">
          <div className="mb-3 px-1 text-lg font-semibold text-background">
            Where are you travelling?
          </div>
          <FareEstimator stopPricing={stopPricing} layout="hub" />
          <div className="flex flex-wrap gap-x-5 gap-y-2 px-2 pb-1 pt-3 text-xs text-background/75">
            <span>No account needed</span>
            <span>No surge pricing</span>
            <span>Free flight tracking</span>
          </div>
        </div>
      </div>
      <div className="h-16 lg:h-20" aria-hidden="true" />
    </section>
  )
}
