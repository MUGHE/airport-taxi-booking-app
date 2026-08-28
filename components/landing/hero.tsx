import Image from "next/image"
import { ShieldCheck, Star, Clock, Sparkles } from "lucide-react"
import { FareEstimator } from "@/components/fare-estimator"
import { getSitePromotion } from "@/lib/actions"

export async function Hero() {
  const promotion = await getSitePromotion()
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-airport-transfer.png"
          alt="Chauffeur standing beside a premium sedan outside an airport terminal at dusk"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div className="max-w-xl">
          {promotion.active ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="size-3.5" />
              Limited time: {promotion.discountPercent}% off every airport transfer
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Star className="size-3.5 fill-accent text-accent" />
              Rated 4.9/5 by 12,000+ travelers
            </span>
          )}
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Airport transfers, done right.
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Fixed prices, flight tracking, and professional chauffeurs waiting at
            arrivals. Book your airport taxi in under a minute — no surge pricing,
            ever.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <li className="flex items-center gap-2 font-medium">
              <ShieldCheck className="size-5 text-primary" />
              Fixed, all-inclusive fares
            </li>
            <li className="flex items-center gap-2 font-medium">
              <Clock className="size-5 text-primary" />
              Free flight tracking & wait
            </li>
            <li className="flex items-center gap-2 font-medium">
              <Star className="size-5 text-primary" />
              Vetted pro drivers
            </li>
          </ul>
        </div>

        <div className="lg:justify-self-end lg:max-w-md w-full">
        <FareEstimator />
        </div>
      </div>
    </section>
  )
}
