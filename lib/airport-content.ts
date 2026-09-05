// SEO content for the airport hub (app/airport-transfers) and per-airport pages
// (app/airport-transfers/[slug]). One entry per airport, grouping the terminal-level
// records in AIRPORTS (lib/fleet.ts) by airport code.

export type AirportPage = {
  slug: string
  code: string
  name: string
  shortName: string
  /** ServiceLocation ids from AIRPORTS belonging to this airport, in display order. */
  locationIds: string[]
  area: string
  title: string
  description: string
  h1: string
  intro: string[]
  faqs: { q: string; a: string }[]
}

export const AIRPORT_PAGES: AirportPage[] = [
  {
    slug: "heathrow",
    code: "LHR",
    name: "London Heathrow Airport",
    shortName: "Heathrow",
    locationIds: ["lhr-t2", "lhr-t3", "lhr-t4", "lhr-t5"],
    area: "Hillingdon",
    title: "Heathrow Airport Taxi & Transfers",
    description:
      "Fixed-price taxi transfers to and from Heathrow Airport (LHR), all terminals. Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.",
    h1: "Heathrow Airport Taxi & Transfers",
    intro: [
      "Fixed-price transfers to and from every Heathrow terminal, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.",
      "Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed.",
    ],
    faqs: [
      { q: "Which Heathrow terminal will my driver meet me at?", a: "Tell us your terminal when you book and your chauffeur will meet you there — we track your flight, so pickup adjusts automatically if your terminal or arrival time changes." },
      { q: "Is the price fixed for Heathrow transfers?", a: "Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day." },
      { q: "What if my flight to or from Heathrow is delayed?", a: "We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival." },
    ],
  },
  {
    slug: "gatwick",
    code: "LGW",
    name: "London Gatwick Airport",
    shortName: "Gatwick",
    locationIds: ["lgw-north", "lgw-south"],
    area: "Crawley",
    title: "Gatwick Airport Taxi & Transfers",
    description:
      "Fixed-price taxi transfers to and from Gatwick Airport (LGW), North and South Terminal. Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.",
    h1: "Gatwick Airport Taxi & Transfers",
    intro: [
      "Fixed-price transfers to and from Gatwick's North and South Terminal, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.",
      "Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed.",
    ],
    faqs: [
      { q: "Do you cover both Gatwick terminals?", a: "Yes — North Terminal and South Terminal are both covered. Tell us which one when you book and your chauffeur will meet you there." },
      { q: "Is the price fixed for Gatwick transfers?", a: "Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day." },
      { q: "What if my flight to or from Gatwick is delayed?", a: "We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival." },
    ],
  },
  {
    slug: "stansted",
    code: "STN",
    name: "London Stansted Airport",
    shortName: "Stansted",
    locationIds: ["stn"],
    area: "Uttlesford",
    title: "Stansted Airport Taxi & Transfers",
    description:
      "Fixed-price taxi transfers to and from Stansted Airport (STN). Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.",
    h1: "Stansted Airport Taxi & Transfers",
    intro: [
      "Fixed-price transfers to and from Stansted Airport, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.",
      "Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed.",
    ],
    faqs: [
      { q: "Is the price fixed for Stansted transfers?", a: "Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day." },
      { q: "What if my flight to or from Stansted is delayed?", a: "We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival." },
      { q: "Can I add a return trip from Stansted?", a: "Yes — add a return leg to the same booking on the Details step, often at a discount." },
    ],
  },
  {
    slug: "luton",
    code: "LTN",
    name: "London Luton Airport",
    shortName: "Luton",
    locationIds: ["ltn"],
    area: "Luton",
    title: "Luton Airport Taxi & Transfers",
    description:
      "Fixed-price taxi transfers to and from Luton Airport (LTN). Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.",
    h1: "Luton Airport Taxi & Transfers",
    intro: [
      "Fixed-price transfers to and from Luton Airport, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.",
      "Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed.",
    ],
    faqs: [
      { q: "Is the price fixed for Luton transfers?", a: "Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day." },
      { q: "What if my flight to or from Luton is delayed?", a: "We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival." },
      { q: "Can I add a return trip from Luton?", a: "Yes — add a return leg to the same booking on the Details step, often at a discount." },
    ],
  },
  {
    slug: "london-city",
    code: "LCY",
    name: "London City Airport",
    shortName: "London City",
    locationIds: ["lcy"],
    area: "Newham",
    title: "London City Airport Taxi & Transfers",
    description:
      "Fixed-price taxi transfers to and from London City Airport (LCY). Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.",
    h1: "London City Airport Taxi & Transfers",
    intro: [
      "Fixed-price transfers to and from London City Airport, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.",
      "Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed.",
    ],
    faqs: [
      { q: "Is the price fixed for London City transfers?", a: "Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day." },
      { q: "What if my flight to or from London City is delayed?", a: "We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival." },
      { q: "Can I add a return trip from London City?", a: "Yes — add a return leg to the same booking on the Details step, often at a discount." },
    ],
  },
  {
    slug: "southend",
    code: "SEN",
    name: "London Southend Airport",
    shortName: "Southend",
    locationIds: ["sen"],
    area: "Southend-on-Sea",
    title: "Southend Airport Taxi & Transfers",
    description:
      "Fixed-price taxi transfers to and from Southend Airport (SEN). Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.",
    h1: "Southend Airport Taxi & Transfers",
    intro: [
      "Fixed-price transfers to and from Southend Airport, with a chauffeur who tracks your flight and adjusts pickup automatically if it's delayed.",
      "Get an instant quote for your exact route, choose a vehicle that fits your group and luggage, and book in a few minutes — no account needed.",
    ],
    faqs: [
      { q: "Is the price fixed for Southend transfers?", a: "Yes. The fare shown when you choose your vehicle is calculated from your exact route and locked in at booking — it doesn't change for traffic or time of day." },
      { q: "What if my flight to or from Southend is delayed?", a: "We track your flight automatically, so a delay doesn't cost you the booking — your driver's pickup time adjusts to match your actual arrival." },
      { q: "Can I add a return trip from Southend?", a: "Yes — add a return leg to the same booking on the Details step, often at a discount." },
    ],
  },
]

export function getAirportPage(slug: string): AirportPage | undefined {
  return AIRPORT_PAGES.find((a) => a.slug === slug)
}
