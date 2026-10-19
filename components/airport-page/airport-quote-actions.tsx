"use client"

import Link from "next/link"
import { FareEstimator } from "@/components/fare-estimator"
import { Button } from "@/components/ui/button"
import type { AirportPagePresentation } from "@/lib/airport-page-data"
import type { StopPricing } from "@/lib/types"

// The same booking form as the homepage, with the airport's main terminal prefilled as "To".
export function AirportQuoteActions({ page, stopPricing }: { page: AirportPagePresentation; stopPricing?: StopPricing }) {
  if (page.bookingAvailable === false) return <div className="airport-quote-card p-5 text-center"><p className="font-semibold text-foreground">Online booking is temporarily unavailable</p><p className="mt-1 text-sm text-muted-foreground">Please contact our team and we’ll help arrange your transfer.</p><Button size="lg" className="mt-4" nativeButton={false} render={<Link href="/contact" />}>Contact us</Button></div>
  const terminal = page.terminals.find((item) => item.isPrimary) ?? page.terminals[0]
  return (
    <div className="landing-quote-card">
      <FareEstimator
        stopPricing={stopPricing}
        defaultDropoff={terminal ? { placeId: "", address: terminal.name, lat: terminal.latitude, lng: terminal.longitude } : undefined}
      />
    </div>
  )
}
