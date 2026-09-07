import Image from "next/image"
import { Star } from "lucide-react"
import { FareEstimator } from "@/components/fare-estimator"
import { getSitePromotion, getStopPricing } from "@/lib/actions"

export async function Hero() {
  const [promotion, stopPricing] = await Promise.all([getSitePromotion(), getStopPricing()])
  return (
    <section className="relative overflow-hidden bg-foreground">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=70&auto=format&fit=crop"
          alt="Airport arrivals hall with travelers"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/85 to-foreground/40" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div className="max-w-xl text-background">
          <span className="text-xs font-semibold tracking-wide text-background/70 uppercase">
            London airport transfers
          </span>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Your fixed-price airport transfer, ready when you land.
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-background/80">
            Reliable transfers to and from all London airports, with professional
            licensed chauffeurs, flight tracking and meet &amp; greet.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-accent" />
              ))}
            </span>
            <span className="font-semibold">Excellent 4.9/5</span>
            <span className="text-background/60">·</span>
            <a href="#reviews" className="font-medium underline-offset-4 hover:underline">
              Read verified reviews
            </a>
          </div>

          {promotion.active && (
            <p className="mt-4 text-sm font-medium text-accent">
              Limited time: {promotion.discountPercent}% off every airport transfer
            </p>
          )}
        </div>

        <div className="w-full lg:justify-self-end lg:max-w-md">
          <h2 className="mb-3 text-lg font-semibold text-background">
            Get your fixed airport-transfer price
          </h2>
          <FareEstimator stopPricing={stopPricing} />
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-background/70">
            <span>No account needed</span>
            <span>No surge pricing</span>
            <span>Free flight tracking</span>
          </p>
        </div>
      </div>
    </section>
  )
}
