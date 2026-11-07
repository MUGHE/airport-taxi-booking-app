import type { Metadata } from "next"
import { LandingPage } from "@/components/landing-new/landing-page"

const TITLE = "ONE Airport Taxi | Heathrow & London Airport Transfers from Slough"
const DESCRIPTION = "Reliable 24/7 airport transfers connecting London Heathrow, Gatwick, Luton, and Stansted with Slough and Berkshire. Guaranteed fixed fares, live flight tracking, and 60 minutes free waiting time."
const IMAGE = { url: "/hero-airport-transfer-og.jpg", alt: "ONE Airport Taxi" }

// Homepage-only title and description; every other page keeps the layout's defaults.
// `absolute` skips the layout's "%s | ONE Airport Taxi" template, which would repeat the brand.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/", languages: { "en-GB": "/" } },
  openGraph: { type: "website", locale: "en_GB", url: "/", siteName: "ONE Airport Taxi", title: TITLE, description: DESCRIPTION, images: [IMAGE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [IMAGE.url] },
}

export default function Page() {
  return <LandingPage />
}
