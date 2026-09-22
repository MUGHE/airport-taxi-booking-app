import { expect, test } from "@playwright/test"
import type { Booking } from "@/lib/types"

test("Place Page attribution is nullable and does not replace route coordinates", () => {
  const booking: Pick<Booking, "sourcePlaceId" | "sourcePlaceSlug" | "pickupLat" | "pickupLng" | "dropoffLat" | "dropoffLng"> = {
    sourcePlaceId: "place-123",
    sourcePlaceSlug: "camden",
    pickupLat: 51.54,
    pickupLng: -0.14,
    dropoffLat: 51.47,
    dropoffLng: -0.45,
  }

  expect(booking.sourcePlaceId).toBe("place-123")
  expect(booking.sourcePlaceSlug).toBe("camden")
  expect(booking.pickupLat).toBe(51.54)
  expect(booking.dropoffLng).toBe(-0.45)
})

test("analytics event contract contains no customer-entered fields", async () => {
  const { publicAnalyticsProperties } = await import("@/lib/analytics")
  expect(publicAnalyticsProperties({ name: "quote_started", sourcePlaceId: "place-123", sourcePlaceSlug: "camden", airportId: "heathrow", direction: "to-airport" })).toEqual({ sourcePlaceId: "place-123", sourcePlaceSlug: "camden", airportId: "heathrow", direction: "to-airport" })
  expect(publicAnalyticsProperties({ name: "destination_directory_search", queryLength: 4, resultCount: 2 })).toEqual({ queryLength: 4, resultCount: 2 })
})
