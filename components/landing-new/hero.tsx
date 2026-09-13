import Image from "next/image"
import { Star } from "lucide-react"
import { FareEstimator } from "@/components/fare-estimator"
import { getSitePromotion, getStopPricing } from "@/lib/actions"

export async function Hero() {
  const [promotion, stopPricing] = await Promise.all([getSitePromotion(), getStopPricing()])
  return (
    <section className="landing-hero">
      <div className="landing-hero-image absolute inset-0" style={{ position: "absolute" }}>
        <Image
          src="/airport-transfers/hero.webp"
          alt="A professional airport transfer car waiting outside a London terminal"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="landing-hero-shade" />

      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow landing-eyebrow-light">
            London airport transfers
          </span>
          <h1>
            The calmest part of your journey starts here.
          </h1>
          <p className="landing-hero-intro">
            Fixed-price London airport transfers with a professional chauffeur,
            live flight tracking, and a welcome waiting at arrivals.
          </p>

          <div className="landing-rating">
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star aria-hidden="true" key={i} className="fill-current" />
              ))}
            </span>
            <span className="font-semibold">Excellent 4.9/5</span>
            <span aria-hidden="true">·</span>
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

        <div className="landing-quote-wrap">
          <div className="landing-quote-heading">
            <span>Plan your transfer</span>
            <strong>Get your fixed price</strong>
          </div>
          <div className="landing-quote-card"><FareEstimator stopPricing={stopPricing} /></div>
          <p className="landing-quote-notes">
            <span>No account needed</span>
            <span>No surge pricing</span>
            <span>Free flight tracking</span>
          </p>
        </div>
      </div>
    </section>
  )
}
