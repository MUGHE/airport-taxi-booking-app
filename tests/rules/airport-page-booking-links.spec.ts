import { expect, test } from "@playwright/test"
import { createAirportBookingLinks, createPublishedAirportPagePresentation, createRouteBookingLinks } from "@/lib/airport-page-data"
import { VEHICLE_CLASSES } from "@/lib/fleet"

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

test("uses the Published Snapshot primary terminal in both booking links", () => {
  const page = createPublishedAirportPagePresentation({
    shortName: "Published Airport",
    terminals: [{ id: "terminal-2", name: "Published Airport Terminal 2", area: "Example", latitude: 51.4714, longitude: -0.4494, isPrimary: true }],
    content: { heading: "Published Airport", intro: [], benefits: [], faqs: [] },
    vehicles: VEHICLE_CLASSES,
  })

  expect(new URL(page.bookingLinks.toAirport, "https://oneairporttaxi.com").searchParams.get("dropoffAddress")).toBe("Published Airport Terminal 2")
  expect(new URL(page.bookingLinks.fromAirport, "https://oneairporttaxi.com").searchParams.get("pickupAddress")).toBe("Published Airport Terminal 2")
})

test("prefills from the published primary terminal even when it is not first in display order", () => {
  const page = createPublishedAirportPagePresentation({
    shortName: "Example",
    terminals: [
      { id: "terminal-two", name: "Terminal 2", area: "Example", latitude: 2, longitude: 2, isPrimary: false },
      { id: "terminal-one", name: "Terminal 1", area: "Example", latitude: 1, longitude: 1, isPrimary: true },
    ],
    content: { heading: "Example", intro: [], benefits: [], faqs: [] },
    vehicles: [],
  })

  expect(page.bookingLinks.toAirport).toContain("dropoffAddress=Terminal+1")
  expect(page.bookingLinks.toAirport).toContain("dropoffLat=1")
})

test("prefills both airport locations for a related route in each direction", () => {
  const links = createRouteBookingLinks(
    { name: "Heathrow Terminal 2", latitude: 1, longitude: 2 },
    { name: "Gatwick South Terminal", latitude: 3, longitude: 4 },
  )

  const toRelated = new URL(links.toAirport, "https://oneairporttaxi.com").searchParams
  expect(toRelated.get("pickupAddress")).toBe("Heathrow Terminal 2")
  expect(toRelated.get("dropoffAddress")).toBe("Gatwick South Terminal")
  expect(toRelated.get("pickupLat")).toBe("1")
  expect(toRelated.get("dropoffLng")).toBe("4")

  const fromRelated = new URL(links.fromAirport, "https://oneairporttaxi.com").searchParams
  expect(fromRelated.get("pickupAddress")).toBe("Gatwick South Terminal")
  expect(fromRelated.get("dropoffAddress")).toBe("Heathrow Terminal 2")
})
