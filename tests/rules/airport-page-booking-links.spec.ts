import { expect, test } from "@playwright/test"
import { AIRPORT_PAGES } from "@/lib/airport-content"
import { createAirportBookingLinks, createAirportPagePresentation } from "@/lib/airport-page-data"
import { AIRPORTS, VEHICLE_CLASSES } from "@/lib/fleet"

test("creates prefilled booking links for the first published terminal", () => {
  expect(
    createAirportBookingLinks({
      name: "London Heathrow (LHR) - Terminal 2",
      latitude: 51.4714,
      longitude: -0.4494,
    }),
  ).toEqual({
    toAirport: "/book?dropoffAddress=London+Heathrow+%28LHR%29+-+Terminal+2&dropoffLat=51.4714&dropoffLng=-0.4494",
    fromAirport: "/book?pickupAddress=London+Heathrow+%28LHR%29+-+Terminal+2&pickupLat=51.4714&pickupLng=-0.4494",
  })
})

test("uses the standard booking page when published data has no terminal", () => {
  expect(createAirportBookingLinks()).toEqual({ toAirport: "/book", fromAirport: "/book" })
})

test("uses each published airport's first terminal in both booking links", () => {
  const expectedFirstTerminals = {
    heathrow: ["London Heathrow (LHR) - Terminal 2", "51.4714", "-0.4494"],
    gatwick: ["London Gatwick (LGW) - North Terminal", "51.1601", "-0.1771"],
    stansted: ["London Stansted (STN)", "51.885", "0.235"],
    luton: ["London Luton (LTN)", "51.8747", "-0.3683"],
    "london-city": ["London City (LCY)", "51.5053", "0.0553"],
    southend: ["London Southend (SEN)", "51.5714", "0.6956"],
  } as const

  for (const airport of AIRPORT_PAGES) {
    const page = createAirportPagePresentation(airport, AIRPORTS, VEHICLE_CLASSES)
    const [address, latitude, longitude] = expectedFirstTerminals[airport.slug as keyof typeof expectedFirstTerminals]

    for (const href of [page.bookingLinks.toAirport, page.bookingLinks.fromAirport]) {
      const query = new URL(href, "https://oneairporttaxi.com").searchParams
      expect(query.get(href.includes("dropoffAddress") ? "dropoffAddress" : "pickupAddress")).toBe(address)
      expect(query.get(href.includes("dropoffLat") ? "dropoffLat" : "pickupLat")).toBe(latitude)
      expect(query.get(href.includes("dropoffLng") ? "dropoffLng" : "pickupLng")).toBe(longitude)
    }
  }
})
