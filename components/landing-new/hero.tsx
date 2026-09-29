import Image from "next/image"
import { BadgePercent, Check, Star } from "lucide-react"
import { FareEstimator } from "@/components/fare-estimator"
import { getSitePromotion, getStopPricing } from "@/lib/actions"

export async function Hero() {
  const [promotion, stopPricing] = await Promise.all([getSitePromotion(), getStopPricing()])
  return (
    <section className="landing-hero">
      <div className="landing-hero-image absolute inset-0" style={{ position: "absolute" }}>
        <Image
          src="/airport-transfers/chauffeur-terminal-hero.png"
          alt="A chauffeur beside an executive car outside an airport terminal"
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
            Premium London airport transfers
          </span>
          <h1>
            Your chauffeur is ready when you land.
          </h1>
          <p className="landing-hero-intro">
            Book a door-to-door London airport transfer with one clear price and
            a professional welcome at arrivals.
          </p>

          <ul className="landing-hero-benefits" aria-label="Included with every transfer">
            <li><Check aria-hidden="true" />Fixed price, confirmed before you book</li>
            <li><Check aria-hidden="true" />Live flight tracking and meet &amp; greet</li>
            <li><Check aria-hidden="true" />Professional, vetted chauffeur</li>
          </ul>

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

        </div>

        <div className="landing-quote-wrap">
          <div className="landing-quote-heading">
            <span>Book your transfer</span>
            <strong>See your fixed price in minutes</strong>
          </div>
          <div className="landing-quote-card"><FareEstimator stopPricing={stopPricing} /></div>
          <div className="landing-quote-reassurance">
            {promotion.active && (
              <p className="landing-quote-offer"><BadgePercent aria-hidden="true" />{promotion.discountPercent}% off your airport transfer</p>
            )}
            <p className="landing-quote-notes">
              <span>No account needed</span>
              <span>No surge pricing</span>
              <span>Free flight tracking</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
