import type { AirportPage } from "@/lib/airport-content"
import type { ServiceLocation, VehicleClass } from "@/lib/types"

export type AirportPageTerminal = {
  id: string
  name: string
  area: string
  latitude: number
  longitude: number
}

export type AirportBookingLinks = {
  toAirport: string
  fromAirport: string
}

export type AirportPagePresentation = {
  shortName: string
  heading: string
  intro: string[]
  terminals: AirportPageTerminal[]
  bookingLinks: AirportBookingLinks
  benefits: { title: string; description: string; icon: "fare" | "flight" }[]
  vehicles: Pick<VehicleClass, "id" | "name" | "description" | "image" | "minFare">[]
  faqs: { question: string; answer: string }[]
}

export function createAirportBookingLinks(
  terminal?: Pick<AirportPageTerminal, "name" | "latitude" | "longitude">,
): AirportBookingLinks {
  if (!terminal) return { toAirport: "/book", fromAirport: "/book" }

  return { toAirport: createAirportBookingLink(terminal, "dropoff"), fromAirport: createAirportBookingLink(terminal, "pickup") }
}

function createAirportBookingLink(
  terminal: Pick<AirportPageTerminal, "name" | "latitude" | "longitude">,
  direction: "pickup" | "dropoff",
) {
  const suffix = direction === "pickup" ? "pickup" : "dropoff"
  return `/book?${new URLSearchParams({
    [`${suffix}Address`]: terminal.name,
    [`${suffix}Lat`]: String(terminal.latitude),
    [`${suffix}Lng`]: String(terminal.longitude),
  }).toString()}`
}

export function createAirportPagePresentation(
  airport: AirportPage,
  locations: ServiceLocation[],
  vehicles: AirportPagePresentation["vehicles"],
): AirportPagePresentation {
  const locationsById = new Map(locations.map((location) => [location.id, location]))
  const terminals = airport.locationIds.flatMap((id) => {
    const location = locationsById.get(id)
    return location
      ? [{ id: location.id, name: location.name, area: location.area, latitude: location.lat, longitude: location.lng }]
      : []
  })

  return {
    shortName: airport.shortName,
    heading: airport.h1,
    intro: airport.intro,
    terminals,
    bookingLinks: createAirportBookingLinks(terminals[0]),
    benefits: [
      {
        title: "Fixed, all-inclusive fare",
        description: "Your fare is calculated from your exact route and locked in at booking — no surge pricing, no surprise charges on arrival.",
        icon: "fare",
      },
      {
        title: "Flight tracking & meet & greet",
        description: "Your chauffeur tracks your flight and meets you at arrivals, so pickup adjusts automatically if your flight time changes.",
        icon: "flight",
      },
    ],
    vehicles,
    faqs: airport.faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
  }
}
