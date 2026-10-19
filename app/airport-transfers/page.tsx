import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FinalCta } from "@/components/landing-new/final-cta"
import { AirportTransfersHero } from "@/components/airport-transfers/hero"
import { AirportGrid } from "@/components/airport-transfers/airport-grid"
import { ServiceStrip } from "@/components/airport-transfers/service-strip"
import { FleetGuidance } from "@/components/airport-transfers/fleet-guidance"
import { AirportTransferFaq } from "@/components/airport-transfers/faq"
import { getStopPricing } from "@/lib/actions"
import { listPublishedAirportDirectory } from "@/lib/airport-directory"
import { getGoogleRating } from "@/lib/google-rating"

export const metadata: Metadata = {
  title: "Airport Transfers",
  description:
    "Fixed-price taxi transfers to and from London's airports — Heathrow, Gatwick, Stansted, Luton, London City and Southend. Meet & greet and flight tracking on every trip.",
  alternates: { canonical: "/airport-transfers" },
}

export default async function AirportTransfersHubPage() {
  const [stopPricing, airports, googleRating] = await Promise.all([getStopPricing(), listPublishedAirportDirectory(), getGoogleRating()])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <AirportTransfersHero stopPricing={stopPricing} googleRating={googleRating} />
        <AirportGrid airports={airports} />
        <ServiceStrip />
        <FleetGuidance />
        <AirportTransferFaq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
