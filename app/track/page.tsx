import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TrackLookup } from "@/components/track-lookup"

export const metadata: Metadata = {
  title: "Track Your Booking",
  description: "Look up your ONE Airport Taxi booking by reference to check trip status and details.",
}

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 lg:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Track your booking</h1>
          <p className="mt-2 text-muted-foreground">
            Enter the booking reference from your confirmation to view trip details
            and status.
          </p>
        </div>
        <TrackLookup />
      </main>
      <SiteFooter />
    </div>
  )
}
