import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { FareEstimator } from "@/components/fare-estimator"
import { Breadcrumbs } from "@/components/breadcrumbs"
import type { GoogleRating } from "@/lib/google-rating"
import type { StopPricing } from "@/lib/types"

// Same layout and styles as the homepage hero (landing-hero-*), so every hero on the site matches:
// copy on the left, the booking form on the right, and the form first on phones.
export function AirportTransfersHero({ stopPricing, googleRating }: { stopPricing: StopPricing; googleRating?: GoogleRating | null }) {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-image absolute inset-0" style={{ position: "absolute" }}>
          <Image
            src="/airport-transfers/hero.webp"
            alt="A driver welcoming airport passengers beside a car"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="landing-hero-shade" />

        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "Airports" }]}
              className="mb-4 [&_a]:text-white/70 [&_span]:text-white/90 [&_svg]:text-white/40"
            />
            <span className="landing-eyebrow landing-eyebrow-light">
              All London airports · Fixed prices
            </span>
            <h1>Fixed-price airport transfers across London</h1>
            <p className="landing-hero-intro">
              Heathrow, Gatwick, Stansted, Luton, London City and Southend. We track your flight and
              confirm your fare before you pay.
            </p>

            <div className="landing-hero-proof">
              <div className="landing-quote-reassurance">
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
                <Link href="/track" className="font-medium underline-offset-4 hover:underline">
                  Track an existing booking
                </Link>
              </div>
            </div>
          </div>

          <div className="landing-quote-wrap">
            <div className="landing-quote-card"><FareEstimator stopPricing={stopPricing} /></div>
          </div>
        </div>
      </section>
    </div>
  )
}
