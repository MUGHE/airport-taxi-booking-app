"use client"

import { track } from "@vercel/analytics"
import type { TripDirection } from "@/lib/types"

/**
 * Public measurement contract. Values are deliberately limited to identifiers,
 * journey choices, and counts. Never add customer-entered text or coordinates here.
 */
export type PublicAnalyticsEvent =
  | { name: "destination_directory_search"; queryLength: number; resultCount: number }
  | { name: "place_page_view"; sourcePlaceId?: string; sourcePlaceSlug?: string; fallback: boolean }
  | { name: "supported_airport_selected"; sourcePlaceId?: string; sourcePlaceSlug?: string; airportId: string; direction: TripDirection }
  | { name: "quote_started"; sourcePlaceId?: string; sourcePlaceSlug?: string; airportId: string; direction: TripDirection }
  | { name: "booking_handoff"; sourcePlaceId?: string; sourcePlaceSlug?: string; airportId: string; direction: TripDirection }

export function publicAnalyticsProperties(event: PublicAnalyticsEvent): Record<string, string | number | boolean | undefined> {
  switch (event.name) {
    case "destination_directory_search":
      return { queryLength: event.queryLength, resultCount: event.resultCount }
    case "place_page_view":
      return { sourcePlaceId: event.sourcePlaceId, sourcePlaceSlug: event.sourcePlaceSlug, fallback: event.fallback }
    case "supported_airport_selected":
    case "quote_started":
    case "booking_handoff":
      return { sourcePlaceId: event.sourcePlaceId, sourcePlaceSlug: event.sourcePlaceSlug, airportId: event.airportId, direction: event.direction }
  }
}

export function trackPublicEvent(event: PublicAnalyticsEvent): void {
  try {
    track(event.name, publicAnalyticsProperties(event))
  } catch {
    // Measurement is best-effort. It must never interrupt the customer journey.
  }
}
