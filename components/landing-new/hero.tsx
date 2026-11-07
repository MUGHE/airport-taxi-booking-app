import Image from "next/image"
import { BadgePercent, Star } from "lucide-react"
import { FareEstimator } from "@/components/fare-estimator"
import { getSitePromotion, getStopPricing } from "@/lib/actions"
import { getGoogleRating } from "@/lib/google-rating"

export async function Hero() {
  const [promotion, stopPricing, googleRating] = await Promise.all([getSitePromotion(), getStopPricing(), getGoogleRating()])
  return (
    <section className="landing-hero">
      <div className="landing-hero-image absolute inset-0" style={{ position: "absolute" }}>
        <Image
          src="/airport-transfers/chauffeur-terminal-hero.webp"
          alt="ONE Airport Taxi chauffeur beside an executive car outside an airport terminal"
          fill
          preload
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="landing-hero-shade" />

      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow landing-eyebrow-light">
            Taxi transfers to and from all UK airports
          </span>
          {/* The page's only h1: what we do and where, for search as much as for visitors. */}
          <h1>
            <span className="landing-hero-line">Heathrow &amp; London</span>{" "}
            <span className="landing-hero-line">Airport Transfers</span>{" "}
            <span className="landing-hero-line">at Fixed Prices</span>
          </h1>
          <p className="landing-hero-intro">
            Flight delayed? Your driver still waits and your fare stays the same. We track your
            flight and adjust your pickup, with 60 minutes&apos; free waiting from landing.
          </p>

          <div className="landing-hero-proof">
            <div className="landing-quote-reassurance">
              {promotion.active && (
                <p className="landing-quote-offer"><BadgePercent aria-hidden="true" />{promotion.discountPercent}% off every booking, applied at checkout</p>
              )}
              <p className="landing-quote-notes">
                <span>No account needed</span>
                <span>No surge pricing</span>
                <span>Free flight tracking</span>
              </p>
            </div>

            <div className="landing-rating">
              {googleRating && (
                <>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star aria-hidden="true" key={i} className="fill-current" />
                    ))}
                  </span>
                  <span className="font-semibold">
                    Rated {googleRating.rating.toFixed(1)} on Google from {googleRating.reviewCount.toLocaleString("en-GB")} reviews
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <a href="#reviews" className="font-medium underline-offset-4 hover:underline">
                {googleRating ? "Read reviews" : "Read our Google reviews"}
              </a>
            </div>
          </div>
        </div>

        <div className="landing-quote-wrap">
          <div className="landing-quote-card"><FareEstimator stopPricing={stopPricing} /></div>
        </div>
      </div>
    </section>
  )
}
