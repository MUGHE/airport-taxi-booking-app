import type { Metadata } from "next"
import { LandingPage } from "@/components/landing-new/landing-page"

// Internal design-review preview — kept out of search results until the redesign is approved.
export const metadata: Metadata = {
  title: "Landing Page (New Design Preview)",
  robots: { index: false, follow: false },
  alternates: { canonical: "/landing-page-new" },
}

export default function LandingPageNew() {
  return <LandingPage />
}
