import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Hero } from "@/components/landing-new/hero"
import { TrustBar } from "@/components/landing-new/trust-bar"
import { ProcessSteps } from "@/components/landing-new/process-steps"
import { ConfidenceBanner } from "@/components/landing-new/confidence-banner"
import { AirportsCoverage } from "@/components/landing-new/airports-coverage"
import { FleetSection } from "@/components/landing-new/fleet-section"
import { Testimonials } from "@/components/landing-new/testimonials"
import { FAQ } from "@/components/landing-new/faq"
import { FinalCta } from "@/components/landing-new/final-cta"

// Internal design-review preview — kept out of search results until the redesign is approved.
export const metadata: Metadata = {
  title: "Landing Page (New Design Preview)",
  robots: { index: false, follow: false },
  alternates: { canonical: "/landing-page-new" },
}

export default function LandingPageNew() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <ProcessSteps />
        <ConfidenceBanner />
        <AirportsCoverage />
        <FleetSection />
        <Testimonials />
        <FAQ />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
