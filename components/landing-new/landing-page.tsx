import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocalBusinessSchema } from "@/components/local-business-schema"
import { Hero } from "@/components/landing-new/hero"
import { TrustBar } from "@/components/landing-new/trust-bar"
import { ProcessSteps } from "@/components/landing-new/process-steps"
import { ConfidenceBanner } from "@/components/landing-new/confidence-banner"
import { AirportsCoverage } from "@/components/landing-new/airports-coverage"
import { FleetSection } from "@/components/landing-new/fleet-section"
import { Testimonials } from "@/components/landing-new/testimonials"
import { FAQ } from "@/components/landing-new/faq"
import { FinalCta } from "@/components/landing-new/final-cta"

export function LandingPage() {
  return (
    <div className="landing-page flex min-h-screen flex-col">
      <LocalBusinessSchema />
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
