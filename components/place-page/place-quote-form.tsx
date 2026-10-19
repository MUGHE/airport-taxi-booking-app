"use client"

import { FareEstimator } from "@/components/fare-estimator"
import { trackPublicEvent } from "@/lib/analytics"
import type { StopPricing } from "@/lib/types"

// The same booking form as the homepage; the quote_started event still fires when a visitor
// continues to booking.
export function PlaceQuoteForm({ sourcePlaceId, sourcePlaceSlug, analyticsEnabled = true, stopPricing }: { sourcePlaceId?: string; sourcePlaceSlug?: string; analyticsEnabled?: boolean; stopPricing?: StopPricing }) {
  return (
    <div className="landing-quote-card">
      <FareEstimator
        stopPricing={stopPricing}
        onContinue={analyticsEnabled ? () => trackPublicEvent({ name: "quote_started", sourcePlaceId, sourcePlaceSlug }) : undefined}
        extraParams={{ ...(sourcePlaceId && { sourcePlaceId }), ...(sourcePlaceSlug && { sourcePlaceSlug }) }}
      />
    </div>
  )
}
