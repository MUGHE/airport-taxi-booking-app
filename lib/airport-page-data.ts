import type { AirportPage } from "@/lib/airport-content"
import type { ServiceLocation, VehicleClass } from "@/lib/types"
import type { GlobalFaq, ServiceFact, VerifiedReview } from "@/lib/reusable-content"
import type { DestinationImageReference, DestinationSection, RichTextBlock } from "@/lib/destination-content"

export type AirportPageTerminal = {
  id: string
  name: string
  area: string
  latitude: number
  longitude: number
  isPrimary: boolean
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
  serviceFacts: ServiceFact[]
  globalFaqs: GlobalFaq[]
  airportFaqs: GlobalFaq[]
  reviews: VerifiedReview[]
  relatedDestinations: { id: string; displayName: string; href: string; heading: string; description: string; image?: string; bookingLinks: AirportBookingLinks }[]
  heroImage?: DestinationImageReference
  sections: AirportPageContentSection[]
  finalCta: { heading: string; body: RichTextBlock[] }
}

export type AirportPageContentSection = Pick<DestinationSection, "id" | "type" | "visible" | "title" | "body" | "fields" | "image">

export type PublishedAirportPageContent = Pick<AirportPagePresentation, "heading" | "intro" | "benefits" | "faqs"> & Partial<Pick<AirportPagePresentation, "serviceFacts" | "globalFaqs" | "airportFaqs" | "reviews" | "heroImage" | "sections" | "finalCta">>

export function createAirportBookingLinks(
  terminal?: Pick<AirportPageTerminal, "name" | "latitude" | "longitude">,
): AirportBookingLinks {
  if (!terminal) return { toAirport: "/book", fromAirport: "/book" }

  return { toAirport: createBookingLinkWithAirport(terminal, "dropoff"), fromAirport: createBookingLinkWithAirport(terminal, "pickup") }
}

function createBookingLinkWithAirport(terminal: Pick<AirportPageTerminal, "name" | "latitude" | "longitude">, direction: "pickup" | "dropoff") {
  const suffix = direction === "pickup" ? "pickup" : "dropoff"
  return `/book?${new URLSearchParams({ [`${suffix}Address`]: terminal.name, [`${suffix}Lat`]: String(terminal.latitude), [`${suffix}Lng`]: String(terminal.longitude) }).toString()}`
}

export function createRouteBookingLinks(
  pickup: Pick<AirportPageTerminal, "name" | "latitude" | "longitude">,
  dropoff: Pick<AirportPageTerminal, "name" | "latitude" | "longitude">,
): AirportBookingLinks {
  return { toAirport: createBookingRouteLink(pickup, dropoff), fromAirport: createBookingRouteLink(dropoff, pickup) }
}

function createBookingRouteLink(
  terminal: Pick<AirportPageTerminal, "name" | "latitude" | "longitude">,
  destination: Pick<AirportPageTerminal, "name" | "latitude" | "longitude">,
) {
  return `/book?${new URLSearchParams({
    pickupAddress: terminal.name,
    pickupLat: String(terminal.latitude),
    pickupLng: String(terminal.longitude),
    dropoffAddress: destination.name,
    dropoffLat: String(destination.latitude),
    dropoffLng: String(destination.longitude),
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
      ? [{ id: location.id, name: location.name, area: location.area, latitude: location.lat, longitude: location.lng, isPrimary: airport.locationIds.indexOf(id) === 0 }]
      : []
  })

  return createPublishedAirportPagePresentation({
    shortName: airport.shortName,
    terminals,
    content: {
      heading: airport.h1,
      intro: airport.intro,
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
      faqs: airport.faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
    },
    vehicles,
  })
}

export function createPublishedAirportPagePresentation({
  shortName,
  terminals,
  content,
  vehicles,
  relatedDestinations,
}: {
  shortName: string
  terminals: AirportPageTerminal[]
  content: PublishedAirportPageContent
  vehicles: AirportPagePresentation["vehicles"]
  relatedDestinations?: AirportPagePresentation["relatedDestinations"]
}): AirportPagePresentation {
  return {
    shortName,
    heading: content.heading,
    intro: content.intro,
    terminals,
    bookingLinks: createAirportBookingLinks(terminals.find((terminal) => terminal.isPrimary) ?? terminals[0]),
    benefits: content.benefits,
    vehicles,
    faqs: content.faqs,
    serviceFacts: content.serviceFacts ?? [],
    globalFaqs: content.globalFaqs ?? [],
    airportFaqs: content.airportFaqs ?? [],
    reviews: content.reviews ?? [],
    relatedDestinations: relatedDestinations ?? [],
    heroImage: content.heroImage,
    sections: content.sections ?? [],
    finalCta: content.finalCta ?? { heading: "Ready to book your airport transfer?", body: [] },
  }
}
