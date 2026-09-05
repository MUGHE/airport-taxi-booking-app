import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocalBusinessSchema } from "@/components/local-business-schema"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FleetSection } from "@/components/landing/fleet-section"
import { AirportsCoverage } from "@/components/landing/airports-coverage"
import { Features } from "@/components/landing/features"
import { CallToAction } from "@/components/landing/cta"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <LocalBusinessSchema />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FleetSection />
        <AirportsCoverage />
        <Features />
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  )
}
