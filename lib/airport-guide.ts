// The London airport guide, word for word from the client's airport guide document: shown on /airport-guide.
import type { FaqCategory } from "@/lib/faqs"

export type GuideAirport = {
  id: string
  name: string
  code: string
  heading: string
  where: string
  terminals: string
  journey: string
  intro: string
  goodToKnow: string[]
  bookLabel: string
  href: string
  image: string
}

export const GUIDE_AIRPORTS: GuideAirport[] = [
  {
    id: "heathrow",
    name: "Heathrow",
    code: "LHR",
    heading: "Heathrow Airport (LHR): terminals, taxi transfers and tips",
    where: "West London",
    terminals: "T2, T3, T4, T5",
    journey: "About 50 minutes",
    intro:
      "Heathrow is the UK's busiest airport and the main hub for long-haul flights. It sits on the western edge of London and has four terminals: T2, T3, T4 and T5. Check your booking or airline ticket for your terminal before you travel, because the terminals are some distance apart.",
    goodToKnow: [
      "T5 is mainly used by British Airways. T2, T3 and T4 handle most other airlines.",
      "Heathrow is well placed for west London, the M4 and M25 corridors, and the Thames Valley.",
      "Peak hours around the M4 and M25 can add noticeable time, so build in extra for early-morning and evening flights.",
    ],
    bookLabel: "Book a Heathrow airport taxi",
    href: "/airport-transfers/heathrow-airport-taxi",
    image: "/airport-transfers/heathrow.webp",
  },
  {
    id: "gatwick",
    name: "Gatwick",
    code: "LGW",
    heading: "Gatwick Airport (LGW): terminals, taxi transfers and tips",
    where: "South of London, West Sussex",
    terminals: "North and South",
    journey: "About 1 hour 25 minutes",
    intro:
      "Gatwick is London's second-largest airport and a major base for short-haul and leisure flights. It has a North Terminal and a South Terminal, linked by a short inter-terminal transit.",
    goodToKnow: [
      "Confirm whether your flight uses the North or South Terminal before you set off.",
      "Gatwick is the best choice for Surrey, Sussex and south London.",
      "The M23 is the main route in. Roadworks and incidents can affect the journey, so leave a comfortable margin.",
    ],
    bookLabel: "Book a Gatwick airport taxi",
    href: "/airport-transfers/gatwick-airport-taxi",
    image: "/airport-transfers/gatwick.webp",
  },
  {
    id: "stansted",
    name: "Stansted",
    code: "STN",
    heading: "Stansted Airport (STN): taxi transfers and tips",
    where: "North-east, Essex",
    terminals: "One terminal",
    journey: "About 1 hour 10 minutes",
    intro:
      "Stansted is a single-terminal airport to the north-east of London, popular with low-cost European routes. Its simple layout makes arrivals and departures quick to navigate.",
    goodToKnow: [
      "It suits Essex, Cambridgeshire, Hertfordshire and north-east London.",
      "Journey times to central London are longer than they look on a map, so plan for the full trip.",
      "Early-morning departures are common here, which makes a pre-booked taxi especially useful.",
    ],
    bookLabel: "Book a Stansted airport taxi",
    href: "/airport-transfers/stansted-airport-taxi",
    image: "/airport-transfers/stansted.webp",
  },
  {
    id: "luton",
    name: "Luton",
    code: "LTN",
    heading: "Luton Airport (LTN): taxi transfers and tips",
    where: "North-west, Bedfordshire",
    terminals: "One terminal",
    journey: "About 1 hour 10 minutes",
    intro:
      "Luton is a one-terminal airport north-west of London, used by many budget airlines. It is close to the M1 and works well for Bedfordshire, Hertfordshire and north London.",
    goodToKnow: [
      "The airport is compact, but the approach roads can be busy at peak times.",
      "Allow extra time on Friday and Sunday evenings and on bank holiday weekends.",
    ],
    bookLabel: "Book a Luton airport taxi",
    href: "/airport-transfers/luton-airport-taxi",
    image: "/airport-transfers/luton.webp",
  },
  {
    id: "london-city",
    name: "London City",
    code: "LCY",
    heading: "London City Airport (LCY): taxi transfers and tips",
    where: "East London, Docklands",
    terminals: "One terminal",
    journey: "About 35 minutes",
    intro:
      "London City is the closest airport to the centre, in the Docklands area of east London. It is small, quick to get through, and popular with business travellers heading to Canary Wharf and the City.",
    goodToKnow: [
      "Check-in and security are usually faster than at the larger airports, but arrive in good time anyway.",
      "It is the best option if you are staying in east or central London.",
    ],
    bookLabel: "Book a London City airport taxi",
    href: "/airport-transfers/london-city-airport-taxi",
    image: "/airport-transfers/london-city.webp",
  },
  {
    id: "southend",
    name: "Southend",
    code: "SEN",
    heading: "Southend Airport (SEN): taxi transfers and tips",
    where: "East, Essex coast",
    terminals: "One terminal",
    journey: "About 1 hour 15 minutes",
    intro:
      "Southend is a small, relaxed airport on the Essex coast. It is a convenient alternative if you live in Essex or east London and want to avoid the larger airports.",
    goodToKnow: [
      "It has a compact terminal and a quieter feel than the main London airports.",
      "Because it is further out, pre-booking your transfer gives you a fixed price for the longer distance.",
    ],
    bookLabel: "Book a Southend airport taxi",
    href: "/airport-transfers/southend-airport-taxi",
    image: "/airport-transfers/southend.webp",
  },
]

export const CHOOSE_AIRPORT_TIPS: { lead: string; text: string }[] = [
  { lead: "Closest to your home or hotel:", text: "this usually saves the most time and money on the ground." },
  { lead: "Your airline and route:", text: "some airlines operate from only one or two airports." },
  { lead: "Your arrival time:", text: "very early or late flights make a pre-booked taxi more valuable than public transport." },
  { lead: "Your luggage and group size:", text: "a taxi is easier than trains and tubes when you travel with several bags, children or a larger group." },
]

export const PICKUP_STEPS: { lead: string; text: string }[] = [
  { lead: "Book online", text: "with your pickup, drop-off, date and time, and see your fixed price before you pay." },
  { lead: "We track your flight", text: "live, so your driver adjusts to delays and early arrivals." },
  { lead: "Your driver meets you", text: "after you have landed and collected your bags, and takes you straight to your destination." },
  { lead: "Free waiting time", text: "is included for airport pickups, so you do not need to rush through arrivals." },
]

export const TRAVEL_TIPS = [
  "Save your terminal number and flight details in one place before you travel.",
  "Check the airport's current drop-off and parking charges if you are being dropped at the terminal.",
  "Keep your phone charged and switched on so your driver can reach you if needed.",
  "Allow extra time during school holidays, bank holidays and major events.",
]

export const AIRPORT_GUIDE_FAQS: FaqCategory = {
  id: "faqs",
  title: "London airport FAQs",
  items: [
    {
      id: "closest-airport",
      q: "Which London airport is closest to central London?",
      a: ["London City Airport, in the Docklands, is the closest. It usually takes about 35 minutes by road, depending on traffic."],
    },
    {
      id: "heathrow-terminals",
      q: "How many terminals does Heathrow have?",
      a: ["Heathrow has four passenger terminals in use: T2, T3, T4 and T5. Check your ticket for the right one before you travel."],
    },
    {
      id: "gatwick-terminals",
      q: "Does Gatwick have more than one terminal?",
      a: ["Yes. Gatwick has a North Terminal and a South Terminal, linked by a short inter-terminal transit."],
    },
    {
      id: "essex",
      q: "Which airport is best for Essex?",
      a: ["Stansted and Southend are both in Essex, so they are the closest options for most of the county. London City suits east London."],
    },
    {
      id: "fixed-price",
      q: "Can I book a fixed-price taxi to any London airport?",
      a: ["Yes. ONE Airport Taxi covers Heathrow, Gatwick, Stansted, Luton, London City and Southend, and you see your price before you book."],
    },
  ],
}
