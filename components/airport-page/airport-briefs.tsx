import Link from "next/link"
import { Accessibility, Baby, Banknote, Briefcase, Car, CircleParking, Clock, Headphones, Luggage, MapPin, PlaneTakeoff, Route, ShieldCheck, Ship, TrainFront, UsersRound } from "lucide-react"
import { BRIEF_DESTINATIONS_ID, BRIEF_GUIDE_ID, briefSections, type AirportBrief, type BriefPlace } from "@/components/airport-page/airport-brief-sections"
import type { AirportCopy } from "@/components/airport-page/airport-page-renderer"
import { createRouteBookingLinks } from "@/lib/airport-page-data"

// Airport pages rewritten from the client's content briefs, keyed by the airport's short name.
// The CMS still supplies terminals, vehicles, images, reviews and FAQs; these supply the wording.
// Coordinates are town centres, terminals and port gates; the booking form prices routes from them.

const linkClass = "font-semibold text-primary underline decoration-primary/30 underline-offset-4"

const AIRPORTS = {
  heathrow: { label: "Heathrow", name: "Heathrow Airport", address: "London Heathrow (LHR) - Terminal 2", latitude: 51.4714, longitude: -0.4494, href: "/airport-transfers/heathrow-airport-taxi", hrefLabel: "Heathrow Airport taxi guide" },
  gatwick: { label: "Gatwick", name: "Gatwick Airport", address: "London Gatwick Airport (LGW) - North Terminal", latitude: 51.1601, longitude: -0.1771, href: "/airport-transfers/gatwick-airport-taxi", hrefLabel: "Gatwick Airport taxi guide" },
  luton: { label: "Luton", name: "Luton Airport", address: "London Luton Airport (LTN)", latitude: 51.8747, longitude: -0.3683, href: "/airport-transfers/luton-airport-taxi", hrefLabel: "Luton Airport taxi guide" },
  stansted: { label: "Stansted", name: "Stansted Airport", address: "London Stansted Airport (STN)", latitude: 51.885, longitude: 0.235, href: "/airport-transfers/stansted-airport-taxi", hrefLabel: "Stansted Airport taxi guide" },
  londonCity: { label: "London City", name: "London City Airport", address: "London City Airport (LCY)", latitude: 51.5053, longitude: 0.0553, href: "/airport-transfers/london-city-airport-taxi", hrefLabel: "London City Airport taxi guide" },
  southend: { label: "Southend", name: "Southend Airport", address: "London Southend Airport (SEN)", latitude: 51.5714, longitude: 0.6956, href: "/airport-transfers/southend-airport-taxi", hrefLabel: "Southend Airport taxi guide" },
  bournemouth: { label: "Bournemouth", name: "Bournemouth Airport", address: "Bournemouth Airport (BOH)", latitude: 50.774566, longitude: -1.83211 },
  southampton: { label: "Southampton", name: "Southampton Airport", address: "Southampton Airport (SOU)", latitude: 50.9480307, longitude: -1.3648088 },
  birmingham: { label: "Birmingham", name: "Birmingham Airport", address: "Birmingham Airport (BHX)", latitude: 52.4531, longitude: -1.734 },
  eastMidlands: { label: "East Midlands", name: "East Midlands Airport", address: "East Midlands Airport (EMA)", latitude: 52.8311, longitude: -1.3281 },
  manchester: { label: "Manchester", name: "Manchester Airport", address: "Manchester Airport (MAN)", latitude: 53.3588, longitude: -2.2727 },
} satisfies Record<string, BriefPlace>

const PORTS = {
  southampton: { label: "Southampton", name: "Southampton Cruise Terminal", address: "Southampton Cruise Terminal, Southampton", latitude: 50.8968, longitude: -1.3967, href: "/destinations/southampton-taxi", hrefLabel: "Southampton taxi guide" },
  dover: { label: "Dover", name: "Dover Port", address: "Port of Dover, Dover", latitude: 51.1269, longitude: 1.3343 },
  portsmouth: { label: "Portsmouth", name: "Portsmouth International Port", address: "Portsmouth International Port, Portsmouth", latitude: 50.8131, longitude: -1.0886, href: "/destinations/portsmouth-taxi", hrefLabel: "Portsmouth taxi guide" },
  harwich: { label: "Harwich", name: "Harwich International Port", address: "Harwich International Port, Harwich", latitude: 51.9459, longitude: 1.2554 },
  tilbury: { label: "Tilbury", name: "Tilbury Cruise Terminal", address: "London International Cruise Terminal, Tilbury", latitude: 51.4547, longitude: 0.3593 },
} satisfies Record<string, BriefPlace>

function town(label: string, address: string, latitude: number, longitude: number, page?: { href: string; hrefLabel: string }): BriefPlace {
  return { label, name: label, address, latitude, longitude, ...page }
}

const LONDON = town("London", "Central London (Charing Cross)", 51.5073, -0.1276)

/** The vehicle-card copy is the same in every brief. Keyed by vehicle id (lib/fleet.ts). */
const VEHICLE_TEXT: Record<string, string> = {
  standard: "The sensible choice for solo travellers, couples and small groups with standard luggage. Comfortable, practical, and ideal for a straightforward airport transfer.",
  executive: "For business travellers and anyone who prefers a more premium ride. Well suited to corporate transfers and professional journeys.",
  estate: "An estate gives you noticeably more luggage room than a standard saloon. This is helpful when you’re travelling with several suitcases.",
  mpv_4seater: "A roomier option for families and small groups who need extra space for people and bags. A good fit for holidays when you have more luggage than usual.",
  mpv: "Suits larger families and small groups, with extra passenger capacity. Luggage allowance depends on how many of you are travelling, so check before booking.",
  minibus_8seater: "The practical answer for larger groups, group holidays, and business travel. Up to eight passengers, with luggage capacity to match.",
}

function travellerCards(airport: string, longDistance: string): AirportBrief["travellers"]["cards"] {
  return [
    { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or a mountain of suitcases? Pick a vehicle with the space to match. You can request a child seat when booking, subject to availability and suitability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
    { icon: Briefcase, title: "Business Airport Transfers", text: `A professional ${airport} taxi for meetings, corporate travel and flight connections. Executive vehicles are there for anyone who wants a more premium journey.`, link: { href: "#vehicles", label: "See executive cars" } },
    { icon: UsersRound, title: "Group Airport Transfers", text: "Friends, colleagues or the extended family? Our MPVs and 8-seater minibuses handle larger groups. Check the luggage capacity before you confirm your vehicle.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
    { icon: Route, title: "Long-Distance Airport Journeys", text: longDistance, link: { href: `#${BRIEF_DESTINATIONS_ID}`, label: "Popular journeys" } },
  ]
}

const HEATHROW_BRIEF: AirportBrief = {
  guide: {
    heading: "Heathrow Airport Information and Travel Guide",
    paragraphs: [
      "London Heathrow (LHR) is one of the UK’s major international airports, sitting west of Central London. It handles domestic and international flights across four operational passenger terminals: Terminal 2, 3, 4 and 5.",
      <>The airport connects London to destinations worldwide and offers many ways to get in and out, including rail, Underground, and road. If you’re travelling to or from Heathrow, a bit of planning around your terminal, pickup point and onward journey makes the day much easier. Comparing airports? See our <Link className={linkClass} href="/airport-guide">London airport guide</Link>.</>,
    ],
    groups: [
      { title: "Heathrow Airport Terminals", columns: 4, cards: [
        { badge: "T2", title: "Terminal 2 – The Queen’s Terminal", text: "Terminal 2 serves a wide range of international and European airlines. Check your airline and flight details before you travel so you arrive at the right terminal." },
        { badge: "T3", title: "Terminal 3", text: "Terminal 3 handles a mix of international and long-haul services. Confirm your terminal with your airline before you arrange your taxi." },
        { badge: "T4", title: "Terminal 4", text: "Terminal 4 serves selected international airlines, with shops and food options inside. Leave enough time to reach the terminal and get through the formalities." },
        { badge: "T5", title: "Terminal 5", text: "A major Heathrow terminal, serving British Airways and selected partner airlines. Check your flight information before booking your pickup or drop-off." },
      ] },
      { title: "Getting to Heathrow Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, Heathrow is reached via the M4 and M25. When you have several suitcases, children, business equipment, or a group, a private taxi is much more convenient." },
        { icon: TrainFront, title: "By rail and Underground", text: "You can also use the Heathrow Express, the Elizabeth line or the Piccadilly line. Public transport is a good option for light travellers." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "With One Airport Taxi, your journey is door-to-door. We take you from your home, hotel, or office straight to your terminal.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Every terminal",
    heading: "Taxi to Heathrow Terminal 2, 3, 4 and 5",
    paragraphs: ["Need a taxi to Heathrow? We run pre-booked transfers to all four operational passenger terminals. When booking, select the correct terminal and add your flight details where asked. It helps us plan the journey and get the pickup or drop-off right."],
    cards: [
      { terminal: "Terminal 2", text: "Pre-book a taxi to Terminal 2 for domestic and international departures. Your driver drops you at the designated terminal area." },
      { terminal: "Terminal 3", text: "Book a Terminal 3 transfer from your home, hotel or office. Double-check your airline and terminal before you travel." },
      { terminal: "Terminal 4", text: "Plan your Terminal 4 transfer — enter your pickup point and travel time to get a fare before you confirm." },
      { terminal: "Terminal 5", text: "Flying from Terminal 5? Book ahead and leave enough time for the drive, check-in and security." },
    ].map(({ terminal, text }) => ({ icon: PlaneTakeoff, title: `Taxi to Heathrow ${terminal}`, text, actions: [{ kind: "to" as const, label: `To ${terminal}`, terminal }, { kind: "from" as const, label: `From ${terminal}`, terminal }] })),
  },
  travellers: {
    heading: "Heathrow Airport Taxi Service for Families, Business Travellers and Groups",
    lead: "Different trips need different things. We offer vehicle options and pre-booked journeys to cover them all.",
    cards: travellerCards("Heathrow", "Heathrow is a common starting point for journeys well beyond London. Arrange a private transfer to destinations across the UK, with the fare agreed up front."),
  },
  cities: {
    heading: "Heathrow Airport Taxi Transfers Across London and the UK",
    paragraphs: ["From Central London, West London or a town outside the capital, we can arrange a pre-booked transfer to Heathrow. We cover journeys between Heathrow and homes, hotels, business addresses and other destinations right across the UK."],
    listHeading: "You can arrange a taxi to Heathrow from places like:",
    places: [
      LONDON,
      town("Slough", "Slough, Berkshire", 51.5105, -0.595),
      town("Windsor", "Windsor, Berkshire", 51.4839, -0.6044),
      town("Reading", "Reading, Berkshire", 51.4543, -0.9781, { href: "/destinations/reading-taxi", hrefLabel: "Reading taxi guide" }),
      town("Maidenhead", "Maidenhead, Berkshire", 51.5218, -0.7194),
      town("Oxford", "Oxford, Oxfordshire", 51.752, -1.2577, { href: "/destinations/oxford-taxi", hrefLabel: "Oxford taxi guide" }),
      town("High Wycombe", "High Wycombe, Buckinghamshire", 51.6287, -0.7482),
      town("Bracknell", "Bracknell, Berkshire", 51.4154, -0.7536),
      town("Guildford", "Guildford, Surrey", 51.2362, -0.5704),
    ],
    closing: "You can also book a taxi from Heathrow to any of these places or even further away. Just enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Heathrow Journey",
  },
  airports: {
    heading: "Heathrow to Other London Airports – Private Airport Transfers",
    paragraphs: ["Connecting between airports can be stressful, especially if you have luggage and a tight schedule. A pre-booked private transfer takes you straight there, so you don’t have to carry your bags through stations. We run airport-to-airport transfers from Heathrow to the other major London airports."],
    titleFrom: "Heathrow",
    places: [
      { ...AIRPORTS.gatwick, text: "Travelling between Heathrow and Gatwick? Book a direct private transfer and leave enough time for traffic plus your onward flight." },
      { ...AIRPORTS.luton, text: "A straightforward taxi from Heathrow to Luton, with a vehicle sized to your passengers and luggage." },
      { ...AIRPORTS.stansted, text: "Pre-book your Heathrow to Stansted transfer for a connection or onward journey, and check the fare before you confirm." },
      { ...AIRPORTS.londonCity, text: "Travelling between Heathrow and London City? Book a private transfer for business travel, connecting flights or anything else." },
      { ...AIRPORTS.southend, text: "Plan the Heathrow-to-London Southend leg with a pre-booked transfer in a vehicle that suits your trip." },
    ],
    closing: "Return transfers from all of these airports back to Heathrow are available too.",
  },
  ports: {
    heading: "Heathrow Airport to Ferry Ports and Cruise Terminals",
    paragraphs: ["Plenty of international passengers land at Heathrow and carry straight on to a UK ferry port or cruise terminal. With cruise luggage or a group in tow, sorting the onward transport in advance makes the whole trip calmer. We offer pre-booked private transfers from Heathrow to the major ferry and cruise ports."],
    titleFrom: "Heathrow",
    places: [
      { ...PORTS.southampton, text: "Southampton is a big cruise departure point on the south coast. Book a private taxi from Heathrow to your specific cruise terminal and allow time for traffic and embarkation." },
      { ...PORTS.dover, text: "Heading from Heathrow to Dover? Book a private transfer to the ferry or cruise facilities, and confirm your exact terminal or dock before you travel." },
      { ...PORTS.portsmouth, text: "Arrange a Heathrow-to-Portsmouth transfer for ferry departures and other journeys from Portsmouth International Port." },
      { ...PORTS.harwich, text: "Book a private transfer from Heathrow to Harwich International for onward ferry travel. Check your sailing time before you pick a pickup time." },
      { ...PORTS.tilbury, text: "Sailing from Tilbury? Arrange a pre-booked transfer from Heathrow to London Cruise Terminal and time your arrival around embarkation." },
    ],
    note: "For cruise and ferry transfers, please tell us the port and terminal, the sailing time, the number of passengers, and the amount of luggage you have. This information helps us plan the right vehicle and pickup for you.",
  },
}

const SOUTHEND_BRIEF: AirportBrief = {
  guide: {
    heading: "Southend Airport Information and Travel Guide",
    paragraphs: [
      "London Southend Airport (SEN) is in Essex, about 40 miles east of Central London, just outside Southend-on-Sea. It’s small, quick, and genuinely pleasant to use. You can walk from the terminal doors to the train in just a couple of minutes, which is rare for London airports.",
      <>Confirm your flight time with your airline before you arrange your taxi, and leave enough time to reach the airport and clear security. Comparing airports? See our <Link className={linkClass} href="/airport-guide">London airport guide</Link>.</>,
    ],
    groups: [
      { title: "The Southend Airport Terminal", columns: 3, cards: [
        { icon: PlaneTakeoff, title: "One passenger terminal", text: "The airport runs a single passenger terminal serving short-haul European and domestic routes, with easyJet and Ryanair among the main operators. Check your airline and flight." },
        { icon: Clock, title: "Quick check-in and security", text: "Because it’s compact, check-in and security are usually fast. Still, it’s best to allow extra time, especially during summer and school holidays." },
        { icon: MapPin, title: "Everything under one roof", text: "There’s only one terminal, so you don’t have to worry about going to the wrong one. Departures, arrivals, shops, and food are all under one roof, and the pickup and drop-off area is right across from the terminal entrance." },
      ] },
      { title: "Southend Airport Drop-Off Charges and Parking", columns: 3, cards: [
        { icon: Banknote, title: "Express Pick-up and Drop-off", text: "Southend Airport now charges for its Express Pick-up and Drop-off zone, directly opposite the terminal. It’s £8 per visit for up to 10 minutes, paid online after you exit." },
        { icon: Car, title: "One fixed fare instead", text: "That charge is one reason why booking a Southend Airport taxi in advance is better than being dropped off by a friend. You get one fixed fare, no parking fees, and no need to watch the clock.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
        { icon: CircleParking, title: "Longer stays", text: "For longer stays, use the Superior or Standard car parks, where charges also apply. Blue badge bays are available in the Superior car park." },
      ] },
      { title: "Getting to Southend Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, Southend is reached via the A127 and A13, with the M25 providing access to the wider motorway network." },
        { icon: TrainFront, title: "By rail", text: "Trains run from London Liverpool Street to Southend Airport station in around 55 minutes, with the station a short walk from the terminal. Public transport is a good option if you’re traveling light." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "A private taxi is especially useful if you have several suitcases, children with you, a group to move, or an early flight before the first train runs. With One Airport Taxi, the journey runs door-to-door — from your home, hotel or office straight to the terminal.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to Southend Airport – Departures Made Simple",
    paragraphs: ["Need a taxi to Southend Airport? We run pre-booked transfers to the terminal from London, Essex and across the UK. When booking, add your flight details where asked. It helps us plan the journey and time the drop-off around your check-in."],
    cards: [
      { icon: PlaneTakeoff, title: "Southend Airport Departures Drop-Off", text: "Your driver will take you to the Express Pick-up and Drop-off area, which is directly opposite the terminal. From there, it’s a short walk to check-in. We include the drop-off charge in your booking, so there’s no need for a separate payment or ticket machine.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early Morning and Late Night Flights", text: "Southend’s first departures can mean leaving home well before the trains start. Pre-booked taxis are the practical answer: your driver is outside at the agreed time, whatever the hour.", actions: [{ kind: "to", label: "Book an early transfer" }] },
      { icon: UsersRound, title: "Group and Family Departures", text: "Traveling with your whole family or a group of friends? Book an MPV or 8-seater minibus to keep everyone together in one vehicle, with enough luggage space for all.", actions: [{ kind: "to", label: "Book a group transfer" }], link: { href: "#vehicles", label: "See MPVs and minibuses" } },
    ],
  },
  travellers: {
    heading: "Southend Airport Taxi Service for Families, Business Travellers and Groups",
    lead: "Different trips need different things. We offer vehicle options and pre-booked journeys to cover them all.",
    cards: travellerCards("Southend Airport", "Southend is a common starting point for journeys well beyond Essex. Arrange a private transfer to destinations across the UK, with the fare agreed up front."),
  },
  cities: {
    heading: "Southend Airport Taxi Transfers Across London and the UK",
    paragraphs: ["From Central London, East London or a town across Essex, we can arrange a pre-booked transfer to Southend Airport. We cover journeys between Southend Airport and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Southend Airport from places like:",
    places: [
      LONDON,
      town("Chelmsford", "Chelmsford, Essex", 51.7356, 0.4685),
      town("Basildon", "Basildon, Essex", 51.5761, 0.4887),
      town("Rayleigh", "Rayleigh, Essex", 51.5864, 0.6049),
      town("Brentwood", "Brentwood, Essex", 51.6214, 0.3054),
      town("Colchester", "Colchester, Essex", 51.8892, 0.9042),
      town("Romford", "Romford, London", 51.5768, 0.1801),
      town("Wickford", "Wickford, Essex", 51.6114, 0.5207),
      town("Canvey Island", "Canvey Island, Essex", 51.522, 0.583),
    ],
    closing: "And the same applies in reverse. You can book a taxi from Southend Airport to any of these places and beyond. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Southend Airport Journey",
  },
  airports: {
    heading: "Southend Airport to Other London Airports – Private Airport Transfers",
    paragraphs: ["Connecting between airports is rarely enjoyable, especially if you have luggage and a short time between flights. A pre-booked private transfer takes you straight there, so you don’t have to carry bags through stations."],
    titleFrom: "Southend",
    places: [
      { ...AIRPORTS.heathrow, text: "We offer direct private transfers from Southend to Heathrow, with vehicles sized for your passengers and luggage. Be sure to allow extra time for the M25." },
      { ...AIRPORTS.gatwick, text: "Travelling between Southend and Gatwick? Book ahead and check the fare before you confirm." },
      { ...AIRPORTS.stansted, text: "A straightforward taxi from Southend to Stansted for a connection or onward journey." },
      { ...AIRPORTS.luton, text: "Pre-book your Southend-to-Luton transfer, with the fare fixed before you travel." },
    ],
  },
  ports: {
    heading: "Southend Airport to Ferry Ports and Cruise Terminals",
    paragraphs: [
      "Many international passengers arriving at London Southend Airport continue their journey to a UK ferry port or cruise terminal. Whether you are catching a ferry to Europe or joining a cruise holiday, arranging your onward transport in advance can make your journey more comfortable and convenient.",
      "One Airport Taxi offers pre-booked private transfers from Southend Airport to major ferry ports and cruise terminals across the UK. Travel with professional drivers, comfortable vehicles and fixed fares confirmed before your journey.",
    ],
    titleFrom: "Southend Airport",
    places: [
      { ...PORTS.southampton, text: "Southampton is one of the UK’s busiest cruise departure destinations. Book a private taxi from Southend Airport to your specific Southampton cruise terminal and enjoy a convenient onward transfer. Allow sufficient time for traffic and cruise embarkation." },
      { ...PORTS.dover, text: "Travelling from Southend Airport to Dover? Arrange a pre-booked private transfer to Dover Ferry Port or its cruise facilities. Whether you are catching a ferry to France or joining a cruise, confirm your departure terminal before travelling." },
      { ...PORTS.portsmouth, text: "Book a private transfer from Southend Airport to Portsmouth International Port for ferry departures and cruise journeys. Travel comfortably to your designated terminal with a vehicle suitable for your passengers and luggage." },
      { ...PORTS.harwich, text: "Need to travel from Southend Airport to Harwich International Port? Arrange a private taxi for your onward ferry journey to the Netherlands or cruise departure. Check your sailing time when planning your airport pickup." },
      { ...PORTS.tilbury, text: "Sailing from London Cruise Terminal at Tilbury? Book a pre-arranged taxi from Southend Airport to Tilbury Cruise Terminal. Plan your pickup around your cruise embarkation time for a convenient journey." },
    ],
    note: "For ferry and cruise terminal transfers, please provide your port and terminal name, sailing or embarkation time, number of passengers, and luggage requirements when booking. This helps us arrange a suitable vehicle and plan your pickup accordingly.",
  },
}

const GATWICK_BRIEF: AirportBrief = {
  guide: {
    heading: "Gatwick Airport Information and Travel Guide",
    paragraphs: [
      "London Gatwick Airport (LGW) sits near Crawley in West Sussex, around 30 miles south of Central London. It’s the UK’s second-busiest airport and a major base for easyJet, British Airways and a long list of long-haul carriers.",
      "Gatwick has two terminals, North and South, connected by a free 24-hour shuttle. Which one you need depends entirely on your airline — check before you book, because turning up at the wrong one costs you 20 minutes and a lot of dragging.",
      <>Check your flight details before travelling and allow a proper buffer, particularly in summer. Comparing airports? See our <Link className={linkClass} href="/airport-guide">London airport guide</Link>.</>,
    ],
    groups: [
      { title: "Gatwick Airport Terminals", columns: 2, cards: [
        { badge: "N", title: "North Terminal", text: "North Terminal handles a mix of short-haul and long-haul services. Check your airline and flight information before travelling to ensure you arrive at the correct terminal." },
        { badge: "S", title: "South Terminal", text: "South Terminal sits directly above the railway station and handles a large share of the airport’s traffic. Confirm your terminal with your airline before arranging your taxi." },
      ] },
      { title: "Gatwick Airport Drop-Off Charges and Parking", columns: 3, cards: [
        { icon: Banknote, title: "Terminal drop-off charge", text: "Gatwick now charges £10 for 10 minutes in its terminal drop-off zones — the most expensive among London airports — and the fee applies to both the North and South terminals. Blue badge holders are exempt." },
        { icon: CircleParking, title: "The free alternative", text: "There’s a free alternative in the long-stay car parks, which offer free parking for up to two hours with a shuttle bus to the terminal." },
        { icon: Car, title: "Included in your fare", text: "With a pre-booked Gatwick Airport taxi, the drop-off charge is included in your fare — one price, no separate payment, no camera-enforced penalty landing on your doormat. Check current rates before you travel, as charges change.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
      { title: "Getting to Gatwick Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, Gatwick is reached via the M23 (junction 9), with the A23 and M25 connecting from the wider network." },
        { icon: TrainFront, title: "By rail", text: "The Gatwick Express runs from London Victoria in around 30 minutes, with Thameslink and Southern services also calling at Gatwick Airport station, directly beneath South Terminal. Public transport is good here." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "A private airport transfer still makes sense with heavy luggage, children, a group, an early flight or a destination well away from a station. With One Airport Taxi, the journey runs door-to-door — from your home, hotel or office straight to the terminal.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Both terminals",
    heading: "Taxi to Gatwick Airport – North and South Terminal Departures",
    paragraphs: ["Need a taxi to Gatwick Airport? We run pre-booked transfers to both terminals from London, the South East and across the UK. When booking, select North or South Terminal and add your flight details. It helps us plan the journey and drop you at the right door."],
    cards: [
      { icon: PlaneTakeoff, title: "Taxi to Gatwick North Terminal", text: "Arrange a pre-booked taxi to North Terminal for short-haul and long-haul departures. Your driver takes you to the designated terminal drop-off area.", actions: [{ kind: "to", label: "To North Terminal", terminal: "North Terminal" }, { kind: "from", label: "From North Terminal", terminal: "North Terminal" }] },
      { icon: PlaneTakeoff, title: "Taxi to Gatwick South Terminal", text: "Book a South Terminal taxi from your home, hotel or office. Confirm your airline and terminal before travelling.", actions: [{ kind: "to", label: "To South Terminal", terminal: "South Terminal" }, { kind: "from", label: "From South Terminal", terminal: "South Terminal" }] },
      { icon: Banknote, title: "Gatwick Airport Departures Drop-Off", text: "Your driver takes you to the terminal drop-off zone, with the airport charge included in your fare. From there, it’s a short walk to check in.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early Morning and Late Night Flights", text: "Gatwick’s first departures leave well before the Gatwick Express starts. Pre-booked taxis are the practical answer — your driver is outside at the agreed time, whatever the hour.", actions: [{ kind: "to", label: "Book an early transfer" }] },
    ],
  },
  travellers: {
    heading: "Gatwick Airport Taxi Service for Families, Business Travellers and Groups",
    lead: "Different passengers have different airport transportation requirements. We offer vehicle options and pre-booked journeys for a range of travel needs.",
    cards: [
      { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or several suitcases? Choose a vehicle with suitable capacity. You can request a child seat when booking, subject to availability and suitability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
      { icon: Briefcase, title: "Business Airport Transfers", text: "Arrange a professional Gatwick Airport taxi for business meetings, corporate travel and airport connections. Executive vehicles are available for a more premium journey.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: UsersRound, title: "Group Airport Transfers", text: "Travelling with friends, colleagues or an extended family? Our MPVs and 8-seater minibuses provide options for larger groups. Check luggage capacity before confirming.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Luggage, title: "Cruise and Long-Haul Transfers", text: "Gatwick handles a lot of cruise and long-haul traffic, which usually means serious luggage. Book an estate, MPV or minibus if you’re travelling with more than one case each.", link: { href: "#vehicles", label: "See estates and MPVs" } },
    ],
  },
  cities: {
    eyebrow: "London and the South East",
    heading: "Gatwick Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From Central London, South London or a town in Surrey or Sussex, we can arrange a pre-booked transfer to Gatwick. We cover journeys between Gatwick and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Gatwick from places like:",
    places: [
      LONDON,
      town("Crawley", "Crawley, West Sussex", 51.1092, -0.1872),
      town("Horley", "Horley, Surrey", 51.174, -0.172),
      town("Brighton", "Brighton, East Sussex", 50.8225, -0.1372),
      town("Redhill", "Redhill, Surrey", 51.24, -0.17),
      town("Reigate", "Reigate, Surrey", 51.237, -0.206),
      town("East Grinstead", "East Grinstead, West Sussex", 51.126, -0.0076),
      town("Horsham", "Horsham, West Sussex", 51.0629, -0.3259),
      town("Guildford", "Guildford, Surrey", 51.2362, -0.5704),
    ],
    closing: "You can also book a taxi from Gatwick to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Gatwick Journey",
  },
  ports: {
    heading: "Gatwick Airport to Ferry Ports and Cruise Terminals",
    paragraphs: ["Gatwick Airport doesn’t have its own ferry or cruise terminal, but many passengers travel from Gatwick to a UK port for a ferry crossing or cruise departure. We offer pre-booked private transfers from Gatwick to the major ferry and cruise ports, with the fare fixed before you travel."],
    titleFrom: "Gatwick",
    places: [
      { ...PORTS.southampton, text: "Southampton is about 90–100 miles from Gatwick, usually 1 hour 45 minutes to 2 hours 15 minutes by road. It has several cruise terminals, so check your cruise documents for the right drop-off point before booking." },
      { ...PORTS.dover, text: "Dover is about 80–90 miles from Gatwick, typically 1 hour 45 minutes to 2 hours 15 minutes. Ferries to France use the Eastern Docks; cruise passengers should confirm their terminal before travelling." },
      { ...PORTS.portsmouth, text: "Portsmouth International Port is about 75–85 miles from Gatwick, around 1 hour 45 minutes to 2 hours 15 minutes depending on traffic. Ferries run to France, Spain and the Channel Islands." },
      { ...PORTS.harwich, text: "Harwich International Port is about 100–115 miles from Gatwick, roughly 2 hours 15 minutes to 3 hours by road. Ferries run to the Hook of Holland, so allow extra time for traffic and check-in." },
      { ...PORTS.tilbury, text: "London Cruise Terminal at Tilbury is about 45–55 miles from Gatwick, usually 1 hour 15 minutes to 1 hour 45 minutes. Check your cruise documents for the terminal and recommended arrival time." },
    ],
    note: "For cruise and ferry transfers, please tell us the port and terminal, the sailing time, the number of passengers and how much luggage you have. It helps us plan the right vehicle and pickup.",
  },
  airports: {
    heading: "Gatwick to Other London Airports: Private Airport Transfers",
    paragraphs: ["Connecting flights often leave little time to spare. By booking a private transfer in advance, you can travel straight between airports without having to carry your bags through London by train."],
    titleFrom: "Gatwick",
    places: [
      { ...AIRPORTS.heathrow, text: "Looking for a taxi from Gatwick to Heathrow? Book a direct private airport transfer with a vehicle that fits your group and luggage. Be sure to allow enough time for the M25 journey." },
      { ...AIRPORTS.luton, text: "Traveling from Gatwick to Luton? Book your airport transfer in advance, see your fare before you confirm, and enjoy a comfortable trip on the M25." },
      { ...AIRPORTS.stansted, text: "Book a reliable private transfer from Gatwick to Stansted with professional drivers, comfortable vehicles, and a confirmed fare before you travel." },
      { ...AIRPORTS.londonCity, text: "Book your Gatwick to London City Airport transfer in advance and travel comfortably in a vehicle that fits your group and luggage. You’ll know your fare before you confirm your booking." },
      { ...AIRPORTS.southend, text: "Need to get from Gatwick to Southend Airport? Book your private airport transfer in advance, with a vehicle that fits your luggage and a confirmed fare before you travel." },
    ],
  },
}

const STANSTED_BRIEF: AirportBrief = {
  guide: {
    heading: "Stansted Airport Information and Travel Guide",
    paragraphs: [
      "London Stansted Airport (STN) is located in Essex, about 40 miles northeast of Central London near Bishop’s Stortford. It’s a major hub for short-haul European flights and one of the UK’s busiest airports for low-cost airlines.",
      "The airport serves a wide range of European and domestic routes across several airlines. Check your airline and flight details before travelling.",
      <>Stansted is known for its busy early-morning departures. Be sure to give yourself plenty of time for check-in and security, especially during the summer. Comparing airports? See our <Link className={linkClass} href="/airport-guide">London airport guide</Link>.</>,
    ],
    groups: [
      { title: "Stansted Airport Terminal", columns: 2, cards: [
        { icon: PlaneTakeoff, title: "One main passenger terminal", text: "Stansted has one main passenger terminal. Departures, arrivals, shops, and food are all in the same building, and the drop-off area is just a short walk from the entrance." },
        { icon: Clock, title: "Before you travel", text: "Confirm your flight time and terminal with your airline before arranging your taxi, and leave enough time to reach the airport and clear security." },
      ] },
      { title: "Stansted Airport Drop-Off Charges and Parking", columns: 3, cards: [
        { icon: Banknote, title: "Express drop-off zone", text: "Stansted charges for its express drop-off zone, with a fee covering a short stay and higher rates beyond that." },
        { icon: CircleParking, title: "Official car parks", text: "There are also several official car parks, from short-stay to long-stay, with shuttle buses to the terminal." },
        { icon: Car, title: "Included in your fare", text: "This is where booking your Stansted Airport taxi in advance really helps. You get one fixed fare, the airport charge is included, and you don’t have to worry about parking fees or catching a shuttle bus in the early hours.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
      { title: "Getting to Stansted Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, Stansted is reached via the M11 (Junction 8), with the A120 providing local access." },
        { icon: TrainFront, title: "By rail", text: "The Stansted Express runs to London Liverpool Street in around 47 minutes, and cross-country services connect to Cambridge and the Midlands. Public transport is fine if you’re traveling light." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "A private taxi is worth it if you have luggage, an early flight before the first train, or a group that would otherwise need more than one car. With One Airport Taxi, your journey is door-to-door, taking you from your home, hotel, or office straight to the terminal.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to Stansted Airport – Departures Made Simple",
    paragraphs: ["Need a taxi to Stansted Airport? We run pre-booked transfers to the terminal from London, Essex, Cambridgeshire and across the UK. When booking, add your flight details where asked. It helps us plan the journey and time the drop-off around your check-in."],
    cards: [
      { icon: PlaneTakeoff, title: "Stansted Airport Departures Drop-Off", text: "Your driver will take you to the terminal drop-off area, and the airport charge is included in your booking. You won’t need to make a separate payment.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early Morning and Late Night Flights", text: "With Stansted’s early departures, you often have to leave home in the middle of the night. Pre-booking a taxi is a practical solution—your driver will be there at the agreed time, no matter how early, so you don’t have to depend on the first train.", actions: [{ kind: "to", label: "Book an early transfer" }] },
      { icon: UsersRound, title: "Group and Family Departures", text: "Traveling with your whole family or a group of friends? Book an MPV or 8-seater minibus to keep everyone together and provide enough space for all your luggage.", actions: [{ kind: "to", label: "Book a group transfer" }], link: { href: "#vehicles", label: "See MPVs and minibuses" } },
    ],
  },
  travellers: {
    heading: "Stansted Airport Taxi Service for Families, Business Travellers and Groups",
    lead: "Every traveler has different airport transport needs. We provide a variety of vehicles and pre-booked journeys to suit all kinds of trips.",
    cards: [
      { icon: Baby, title: "Family Airport Transfers", text: "Traveling with children, pushchairs, or lots of luggage? Pick a vehicle with enough space for everyone and everything. You can also request a child seat when you book, if available and suitable.", link: { href: "#vehicles", label: "Compare family vehicles" } },
      { icon: Briefcase, title: "Business Airport Transfers", text: "Book a professional Stansted taxi for meetings, business trips, or airport connections. Executive vehicles are available if you want a more premium experience.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: UsersRound, title: "Group Airport Transfers", text: "Traveling with friends, colleagues, or a big family? Our MPVs and 8-seater minibuses are great for larger groups. Be sure to check the luggage space before you confirm your booking.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Route, title: "Long-Distance Airport Journeys", text: "Stansted is often the starting point for trips far beyond London. Book a private transfer to anywhere in the UK, and know your fare before you travel.", link: { href: "/destinations", label: "See our destinations" } },
    ],
  },
  cities: {
    eyebrow: "London and the East of England",
    heading: "Stansted Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From Central London, North London or a town in Essex, Hertfordshire or Cambridgeshire, we can arrange a pre-booked transfer to Stansted. We cover journeys between Stansted and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Stansted from places like:",
    places: [
      LONDON,
      town("Bishop’s Stortford", "Bishop's Stortford, Hertfordshire", 51.872, 0.159),
      town("Harlow", "Harlow, Essex", 51.7727, 0.1023),
      town("Chelmsford", "Chelmsford, Essex", 51.7356, 0.4685),
      town("Cambridge", "Cambridge, Cambridgeshire", 52.2053, 0.1218),
      town("Saffron Walden", "Saffron Walden, Essex", 52.0226, 0.239),
      town("Braintree", "Braintree, Essex", 51.8781, 0.5527),
      town("Colchester", "Colchester, Essex", 51.8892, 0.9042),
      town("Hertford", "Hertford, Hertfordshire", 51.796, -0.078),
    ],
    closing: "You can also book a taxi from Stansted to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Stansted Journey",
  },
  ports: {
    heading: "Stansted Airport to Ferry Ports and Cruise Terminals",
    paragraphs: ["Stansted has no ferry or cruise terminal of its own, but Essex is home to two of the UK’s Haven Ports, and Harwich is closer to Stansted than to any other London airport. We offer pre-booked private transfers from Stansted to the main ferry and cruise ports."],
    titleFrom: "Stansted",
    places: [
      { ...PORTS.harwich, text: "Harwich is about 50 miles from Stansted, roughly 50 to 60 minutes via the A120. Ferries run to the Hook of Holland, and Harwich is also a stop for Scandinavian, Baltic and round-Britain cruises." },
      { ...PORTS.tilbury, text: "Tilbury is about 45 miles from Stansted, roughly 1 hour 15 minutes by road. It’s the closest deep-sea cruise terminal to Central London." },
      { ...PORTS.dover, text: "Dover is around 110 to 120 miles from Stansted, about 2 to 2.5 hours depending on traffic. Ferries to France leave from the Eastern Docks, and cruise ships use the Western Docks." },
      { ...PORTS.southampton, text: "Joining a cruise at Southampton? Book a private transfer from Stansted to your cruise terminal, and allow plenty of time for the M25 and embarkation." },
      { ...PORTS.portsmouth, text: "Arrange a Stansted-to-Portsmouth transfer for ferry departures from Portsmouth International Port, in a vehicle sized for your passengers and luggage." },
    ],
    note: "For cruise and ferry transfers, please tell us the port and terminal, the sailing time, the number of passengers and how much luggage you have. It helps us plan the right vehicle and pickup.",
  },
  airports: {
    heading: "Stansted Airport to Other London Airports – Private Airport Transfers",
    paragraphs: ["Changing airports can be stressful, especially when you have luggage or a tight schedule. A pre-booked private transfer takes you straight there."],
    titleFrom: "Stansted",
    places: [
      { ...AIRPORTS.heathrow, text: "Get a direct private transfer from Stansted to Heathrow, with a vehicle that fits your group and luggage. Make sure to allow enough time for the journey on the M11 and M25." },
      { ...AIRPORTS.gatwick, text: "Traveling between Stansted and Gatwick? Book your airport transfer in advance and confirm your fare before you go." },
      { ...AIRPORTS.luton, text: "Arrange a straightforward private taxi from Stansted to Luton for your connecting flight or onward journey, with a suitable vehicle for your travel needs." },
      { ...AIRPORTS.londonCity, text: "Pre-book your transfer from Stansted to London City Airport and get your fare before you confirm your booking." },
      { ...AIRPORTS.southend, text: "Need to get from Stansted to Southend Airport? Book a private airport transfer in advance for a comfortable ride, plenty of luggage space, and a confirmed fare before you travel." },
    ],
  },
}

const LUTON_BRIEF: AirportBrief = {
  guide: {
    heading: "Luton Airport Information and Travel Guide",
    paragraphs: [
      "London Luton Airport (LTN) sits in Bedfordshire, around 35 miles north of Central London. It’s one of the UK’s busiest airports for short-haul and package-holiday traffic, with a single main passenger terminal and a steady flow of early-morning departures.",
      "The airport serves a wide range of European and domestic routes across several airlines. Check your airline and flight details before travelling.",
      <>Give yourself plenty of time for check-in and security, especially during summer and busy weekends. Luton can get crowded. Comparing airports? See our <Link className={linkClass} href="/airport-guide">London airport guide</Link>.</>,
    ],
    groups: [
      { title: "Luton Airport Terminal", columns: 2, cards: [
        { icon: PlaneTakeoff, title: "One main passenger terminal", text: "Luton has one main passenger terminal. Departures, arrivals, shops, and food are all in the same building, and the drop-off area is a short walk from the entrance." },
        { icon: Clock, title: "Before you travel", text: "Confirm your flight time and terminal with your airline before you arrange your taxi, and leave enough time to reach the airport and clear security." },
      ] },
      { title: "Luton Airport Drop-Off Charges and Parking", columns: 3, cards: [
        { icon: Banknote, title: "Dedicated drop-off zone", text: "Luton charges a fee for its dedicated drop-off zone, with higher rates if you stay longer than the included minutes." },
        { icon: CircleParking, title: "Official car parks", text: "There are also several official car parks, from short-stay to long-stay, with shuttle buses to the terminal." },
        { icon: Car, title: "Included in your fare", text: "This is where a pre-booked taxi from Luton Airport is worth it. You pay a single fixed fare; the airport charge is included, and there’s no need to worry about parking or catching a shuttle bus.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
      { title: "Getting to Luton Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, Luton is reached via the M1 (Junction 10), with the A1081 and A505 providing local connections." },
        { icon: TrainFront, title: "By rail", text: "Thameslink and East Midlands services run to Luton Airport Parkway, with the Luton DART to the terminal — around 35 minutes from St Pancras. Public transport is a good option if you’re traveling light." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "A private taxi is especially useful if you have luggage, an early flight before the first train, or a group that would otherwise need more than one car. With One Airport Taxi, your journey is door-to-door, taking you from your home, hotel, or office straight to the terminal.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to Luton Airport – Departures Made Simple",
    paragraphs: ["Need a taxi to Luton Airport? We run pre-booked transfers to the terminal from London, Bedfordshire, Hertfordshire and across the UK. When booking, add your flight details where asked. It helps us plan the journey and time the drop-off around your check-in."],
    cards: [
      { icon: PlaneTakeoff, title: "Luton Airport Departures Drop-Off", text: "Your driver will take you to the terminal drop-off area, and the airport charge is included in your booking. There’s no need for a separate card payment or ticket machine.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early Morning and Late Night Flights", text: "Luton’s first wave of departures means leaving home in the small hours. Pre-booked taxis are the practical answer: your driver is outside at the agreed time, whatever the hour.", actions: [{ kind: "to", label: "Book an early transfer" }] },
      { icon: UsersRound, title: "Group and Family Departures", text: "Travelling with the whole family or a group of friends? Book an MPV or 8-seater minibus and keep everyone together, with luggage space to match. Cheaper than two cars and far less faff.", actions: [{ kind: "to", label: "Book a group transfer" }], link: { href: "#vehicles", label: "See MPVs and minibuses" } },
    ],
  },
  travellers: {
    heading: "Luton Airport Taxi Service for Families, Business Travellers and Groups",
    lead: "Different passengers have different airport transportation requirements. We offer vehicle options and pre-booked journeys for a range of travel needs.",
    cards: [
      { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or several suitcases? Choose a vehicle with suitable passenger and luggage capacity. You can request a child seat when booking, subject to availability and suitability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
      { icon: Briefcase, title: "Business Airport Transfers", text: "Book a professional Luton taxi for meetings, corporate travel, and airport connections. Executive vehicles are available if you prefer a more premium journey.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: UsersRound, title: "Group Airport Transfers", text: "Traveling with friends, colleagues, or extended family? Our MPVs and 8-seater minibuses are great for larger groups. Check the luggage capacity before you confirm your vehicle.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Route, title: "Long-Distance Airport Journeys", text: "Luton is often the starting point for trips far beyond London. Book a private transfer to destinations across the UK, with your fare confirmed before you travel.", link: { href: "/destinations", label: "See our destinations" } },
    ],
  },
  cities: {
    eyebrow: "London and the Home Counties",
    heading: "Luton Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From Central London, North London or a town in Bedfordshire, Hertfordshire or Buckinghamshire, we can arrange a pre-booked transfer to Luton Airport. We cover journeys between Luton Airport and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Luton Airport from places like:",
    places: [
      LONDON,
      town("Luton Town Centre", "Luton town centre, Bedfordshire", 51.8787, -0.42),
      town("Dunstable", "Dunstable, Bedfordshire", 51.886, -0.521),
      town("Harpenden", "Harpenden, Hertfordshire", 51.816, -0.357),
      town("St Albans", "St Albans, Hertfordshire", 51.752, -0.336),
      town("Hitchin", "Hitchin, Hertfordshire", 51.949, -0.283),
      town("Stevenage", "Stevenage, Hertfordshire", 51.9017, -0.2019),
      town("Milton Keynes", "Milton Keynes, Buckinghamshire", 52.0406, -0.7594),
      town("Bedford", "Bedford, Bedfordshire", 52.136, -0.4667),
    ],
    closing: "You can also book a taxi from Luton Airport to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Luton Airport Journey",
  },
  ports: {
    heading: "Luton Airport to Ferry Ports and Cruise Terminals",
    paragraphs: ["Plenty of passengers land at Luton and carry straight on to a ferry port or cruise terminal. With cruise luggage or a group in tow, sorting the onward transport in advance makes the trip calmer. We offer pre-booked private transfers from Luton Airport to the major ferry and cruise ports."],
    titleFrom: "Luton",
    places: [
      { ...PORTS.southampton, text: "Southampton is a major cruise departure point on the south coast. Book a private taxi from Luton to your specific cruise terminal and allow time for traffic and embarkation." },
      { ...PORTS.dover, text: "Heading from Luton to Dover? Book a private transfer to the ferry or cruise facilities, and confirm your exact terminal or dock before you travel." },
      { ...PORTS.portsmouth, text: "Arrange a Luton-to-Portsmouth transfer for ferry departures and other journeys from Portsmouth International Port." },
      { ...PORTS.harwich, text: "Book a private transfer from Luton to Harwich International for onward ferry travel. Check your sailing time before you choose a pickup time." },
      { ...PORTS.tilbury, text: "Sailing from Tilbury? Arrange a pre-booked transfer from Luton to London Cruise Terminal and time your arrival around embarkation." },
    ],
    note: "For cruise and ferry transfers, please tell us the port and terminal, the sailing time, the number of passengers and how much luggage you have. It helps us plan the right vehicle and pickup.",
  },
  airports: {
    heading: "Luton Airport to Other London Airports – Private Airport Transfers",
    paragraphs: ["Connecting between airports can be stressful, especially with luggage and a tight schedule. A pre-booked private transfer takes you there directly."],
    titleFrom: "Luton",
    places: [
      { ...AIRPORTS.heathrow, text: "A direct private transfer from Luton to Heathrow, with a vehicle sized to your passengers and luggage. Leave plenty of time for the M1 and M25." },
      { ...AIRPORTS.gatwick, text: "Travelling between Luton and Gatwick? Book in advance and check your fare before you confirm." },
      { ...AIRPORTS.stansted, text: "We provide straightforward taxi transfers from Luton to Stansted for your connection or onward journey." },
      { ...AIRPORTS.londonCity, text: "Pre-book your transfer from Luton to London City Airport, with your fare fixed before you travel." },
      { ...AIRPORTS.southend, text: "Need a transfer from Luton to Southend Airport? Book your private airport taxi in advance, with a suitable vehicle for your passengers and luggage and a confirmed fare before travel." },
    ],
  },
}

const LONDON_CITY_BRIEF: AirportBrief = {
  guide: {
    heading: "London City Airport Information and Travel Guide",
    paragraphs: [
      "London City Airport (LCY) sits in the Royal Docks in East London, about six miles from the City and a short hop from Canary Wharf. It’s the most central airport in London, and the one business travellers tend to prefer — small, quick and built for people who want to be in a meeting an hour after landing.",
      "The airport operates a single passenger terminal serving short-haul UK and European destinations, as well as a handful of longer routes. Check your airline and flight details before travelling.",
      <>Because the runway is short, LCY handles smaller aircraft — which also means baggage reclaim is quick. Allow the usual buffer for check-in and security, particularly on Friday afternoons. Comparing airports? See our <Link className={linkClass} href="/airport-guide">London airport guide</Link>.</>,
    ],
    groups: [
      { title: "London City Airport Terminal", columns: 2, cards: [
        { icon: PlaneTakeoff, title: "One terminal, one set of doors", text: "One terminal, one set of doors, no wrong-terminal confusion. Departures, arrivals, shops and food are all in the same building, with the DLR station a couple of minutes’ walk away." },
        { icon: Clock, title: "Before you travel", text: "Confirm your flight time with your airline before you arrange your taxi, and leave enough time to reach the airport and clear security." },
      ] },
      { title: "London City Airport Drop-Off Charges", columns: 2, cards: [
        { icon: Banknote, title: "Forecourt drop-off charge", text: "Worth knowing: LCY introduced a drop-off charge in January 2026, becoming one of the last London airports to do so. Expect a fee for a short stay in the forecourt drop-off zone, with additional charges for each minute beyond the included time." },
        { icon: Car, title: "Included in your fare", text: "That’s one more reason a pre-booked London City Airport transfer makes sense — one fixed fare, with the airport charge included in the booking rather than a separate payment.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
      { title: "Getting to London City Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, LCY is reached via the A13 and A1020, with the Blackwall Tunnel and A406 nearby." },
        { icon: TrainFront, title: "By rail", text: "The DLR runs directly to London City Airport station, with journeys from Canary Wharf taking around 15 minutes and from Bank around 25 minutes. Public transport works well for light travel." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "A private taxi earns its keep with luggage, early flights, client pickups or when you need to arrive composed rather than windswept. With One Airport Taxi, the journey runs door-to-door — from your home, hotel or office straight to the terminal.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to London City Airport – Departures Made Simple",
    paragraphs: ["Need a taxi to London City Airport? We run pre-booked transfers to the terminal from across London and the UK. When booking, add your flight details where asked. It helps us plan the journey and time the drop-off around your check-in."],
    cards: [
      { icon: PlaneTakeoff, title: "London City Airport Departures Drop-Off", text: "Your driver takes you to the terminal drop-off area, with the airport charge included in your booking — no separate payment.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early Morning and Late Night Flights", text: "LCY’s first departures mean leaving home before the Tube is properly awake. Pre-booked taxis are the practical answer: your driver is outside at the agreed time, whatever the hour.", actions: [{ kind: "to", label: "Book an early transfer" }] },
      { icon: Briefcase, title: "Business Travel and Corporate Accounts", text: "Regular flyers can book repeat journeys with the same driver preferences and vehicle type. Executive cars, receipts and account billing available — ask when booking.", actions: [{ kind: "to", label: "Book a business transfer" }], link: { href: "/Contact-Us", label: "Ask about corporate travel" } },
    ],
  },
  travellers: {
    heading: "London City Airport Taxi Service for Families, Business Travellers and Groups",
    lead: "Different trips need different things. We offer vehicle options and pre-booked journeys to cover them all.",
    cards: [
      { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or several suitcases? Pick a vehicle with the space to match. You can request a child seat when booking, subject to availability and suitability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
      { icon: Briefcase, title: "Business Airport Transfers", text: "This is LCY’s bread and butter. A professional London City Airport taxi for meetings, corporate travel and flight connections, with executive vehicles for anyone who wants a quieter, more premium journey.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: UsersRound, title: "Group Airport Transfers", text: "Friends, colleagues or the extended family? Our MPVs and 8-seater minibuses handle larger groups. Check luggage capacity before you confirm your vehicle.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Route, title: "Long-Distance Airport Journeys", text: "LCY is a common starting point for journeys well beyond London. Arrange a private transfer to destinations across the UK, with the fare agreed up front.", link: { href: "/destinations", label: "See our destinations" } },
    ],
  },
  cities: {
    eyebrow: "Across London",
    heading: "London City Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From the City, Canary Wharf, Westminster or a town on the edge of London, we can arrange a pre-booked transfer to London City Airport. We cover journeys between London City Airport and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to London City Airport from places like:",
    places: [
      LONDON,
      town("Canary Wharf", "Canary Wharf, London", 51.5054, -0.0235),
      town("The City", "Bank, City of London", 51.5133, -0.0886),
      town("Westminster", "Westminster, London", 51.4995, -0.1248),
      town("Stratford", "Stratford, London", 51.5413, -0.0036),
      town("Greenwich", "Greenwich, London", 51.4826, -0.0077),
      town("Romford", "Romford, London", 51.5768, 0.1801),
      town("Bromley", "Bromley, London", 51.406, 0.014),
      town("Dartford", "Dartford, Kent", 51.4462, 0.2169),
    ],
    closing: "You can also book a taxi from London City Airport to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your London City Airport Journey",
  },
  ports: {
    heading: "London City Airport to Ferry Ports and Cruise Terminals",
    paragraphs: ["Flying into London City and joining a ferry or cruise? With cruise luggage or a group with you, booking the onward transfer in advance takes the stress out of it. We offer pre-booked private transfers from London City Airport to the major ferry and cruise ports."],
    titleFrom: "London City",
    places: [
      { ...PORTS.tilbury, text: "London Cruise Terminal at Tilbury is the closest cruise port to London City Airport. Book a pre-arranged transfer and time your arrival around embarkation." },
      { ...PORTS.dover, text: "Heading from London City to Dover? Book a private transfer to the ferry or cruise facilities, and confirm your exact terminal or dock before you travel." },
      { ...PORTS.harwich, text: "Book a private transfer from London City to Harwich International for onward ferry travel. Check your sailing time before you choose a pickup time." },
      { ...PORTS.southampton, text: "Southampton is a major cruise departure point on the south coast. Book a private taxi from London City to your specific cruise terminal and allow time for traffic and embarkation." },
      { ...PORTS.portsmouth, text: "Arrange a London City-to-Portsmouth transfer for ferry departures and other journeys from Portsmouth International Port." },
    ],
    note: "For cruise and ferry transfers, please tell us the port and terminal, the sailing time, the number of passengers and how much luggage you have. It helps us plan the right vehicle and pickup.",
  },
  airports: {
    heading: "London City Airport to Other London Airports – Private Airport Transfers",
    paragraphs: ["Connecting between airports is rarely fun, especially with luggage and a tight connection. A pre-booked private transfer gets you there directly, without dragging bags across London on the DLR and Tube."],
    titleFrom: "London City",
    places: [
      { ...AIRPORTS.heathrow, text: "A direct private transfer from LCY to Heathrow, with a vehicle sized to your passengers and luggage." },
      { ...AIRPORTS.gatwick, text: "Travelling between London City and Gatwick? Book ahead and check the fare before you confirm." },
      { ...AIRPORTS.stansted, text: "A straightforward taxi from London City to Stansted for a connection or onward journey." },
      { ...AIRPORTS.luton, text: "Pre-book your London City to Luton transfer, with the fare fixed before you travel." },
    ],
  },
}

const SOUTHAMPTON_BRIEF: AirportBrief = {
  guide: {
    heading: "Southampton Airport Information and Travel Guide",
    paragraphs: [
      "Southampton Airport (SOU) is a compact regional airport on the edge of the city, close to Eastleigh and well placed for Winchester, the New Forest and the Hampshire coast. It mainly serves domestic and short-haul European routes, with a small, easy-to-navigate single terminal.",
      "Because it’s small, check-in and security tend to move quickly, though it’s still worth allowing the usual buffer, particularly at peak holiday times.",
    ],
    groups: [
      { title: "Southampton Airport Terminal", columns: 2, cards: [
        { icon: PlaneTakeoff, title: "One terminal", text: "One terminal covers everything — check-in, security, shops and arrivals — so there’s no confusion about where to go. The pickup and drop-off area is a short walk from the terminal entrance." },
        { icon: Clock, title: "Before you travel", text: "Confirm your flight time with your airline before arranging your taxi, and build in time for the drive and for security." },
      ] },
      { title: "Getting to Southampton Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, the airport sits just off the M27 and M3, with good connections to Winchester, Portsmouth and the wider south coast." },
        { icon: TrainFront, title: "By rail", text: "Southampton Airport Parkway railway station sits directly next to the terminal, with regular services to London Waterloo, Reading and the south coast. Public transport covers the basics well." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "A pre-booked airport taxi earns its keep with heavy luggage, an early flight, a cruise connection, or when you’re travelling as a family or group. With One Airport Taxi, your journey runs door-to-door — from your home, hotel or office straight to the terminal, or on to the cruise terminal if that’s your onward connection.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to Southampton Airport – Departures Made Simple",
    paragraphs: ["Need a taxi to Southampton Airport? We run pre-booked transfers to the terminal from across Hampshire and the wider UK. When booking, add your flight details where asked so that we can time your drop-off around check-in rather than the other way round."],
    cards: [
      { icon: PlaneTakeoff, title: "Southampton Airport Departures Drop-Off", text: "Your driver takes you directly to the terminal drop-off area, with enough time built in for check-in and security.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early Morning and Late Night Flights", text: "Short-haul schedules often mean very early starts. A pre-booked airport taxi means your driver is outside at the agreed time, whatever the hour — no need to rely on a taxi rank that may be empty at 4 am.", actions: [{ kind: "to", label: "Book an early transfer" }] },
      { icon: UsersRound, title: "Group and Family Departures", text: "Travelling with the whole family, or a group heading off on the same flight? Book an MPV or 8-seater minibus and travel together, with the luggage space to match.", actions: [{ kind: "to", label: "Book a group transfer" }], link: { href: "#vehicles", label: "See MPVs and minibuses" } },
    ],
  },
  travellers: {
    heading: "Southampton Airport Taxi Service for Families, Business Travellers, Groups and Cruise Passengers",
    lead: "Different trips call for different vehicles. We offer options to suit a wide range of journeys to and from Southampton Airport.",
    cards: [
      { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or several suitcases? Choose a vehicle with the right space. Child seats can be requested when booking, subject to availability and suitability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
      { icon: Briefcase, title: "Business Airport Transfers", text: "A professional Southampton Airport taxi for meetings, corporate travel and flight connections, with executive vehicles available for a more premium journey.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: UsersRound, title: "Group Airport Transfers", text: "Travelling with friends, colleagues or the extended family? Our MPVs and 8-seater minibuses handle larger groups comfortably.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Ship, title: "Southampton Cruise Terminal Transfers", text: "Southampton is one of the UK’s busiest cruise ports, and plenty of our bookings connect the airport, the cruise terminals and onward journeys. Book a Southampton cruise terminal taxi alongside your airport transfer and avoid the hassle of taxi ranks on embarkation day.", link: { href: "/destinations/southampton-taxi", label: "Southampton taxi guide" } },
      { icon: Route, title: "Long-Distance Airport Journeys", text: "Southampton Airport is also a practical starting point for longer transfers — Southampton to Heathrow, Southampton to Gatwick or Southampton to Bournemouth Airport, with your fare agreed before you travel.", link: { href: "/destinations", label: "See our destinations" } },
    ],
  },
  cities: {
    eyebrow: "Hampshire and the South",
    heading: "Southampton Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From Southampton itself, a town across Hampshire or a city further afield, we can arrange a pre-booked transfer to Southampton Airport. We cover journeys between Southampton Airport and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Southampton Airport from places like:",
    places: [
      town("Southampton City Centre", "Southampton city centre, Hampshire", 50.9097, -1.4044, { href: "/destinations/southampton-taxi", hrefLabel: "Southampton taxi guide" }),
      town("Eastleigh", "Eastleigh, Hampshire", 50.967, -1.35),
      town("Winchester", "Winchester, Hampshire", 51.0632, -1.308),
      town("Romsey", "Romsey, Hampshire", 50.989, -1.499),
      town("Portsmouth", "Portsmouth, Hampshire", 50.8198, -1.088, { href: "/destinations/portsmouth-taxi", hrefLabel: "Portsmouth taxi guide" }),
      town("Basingstoke", "Basingstoke, Hampshire", 51.2665, -1.0924),
      town("Salisbury", "Salisbury, Wiltshire", 51.0688, -1.7945),
      town("Bournemouth", "Bournemouth, Dorset", 50.7192, -1.8808),
      LONDON,
    ],
    closing: "You can also book a taxi from Southampton Airport to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Southampton Airport Journey",
  },
  airports: {
    heading: "Southampton Airport to Other Airports – Private Airport Transfers",
    paragraphs: ["Southampton Airport is a practical starting point for longer transfers to other airports, with your fare agreed before you travel."],
    titleFrom: "Southampton",
    places: [
      { ...AIRPORTS.heathrow, text: "Heathrow Airport is approximately 65–70 miles from Southampton Airport. A direct private transfer, with your fare agreed before you travel." },
      { ...AIRPORTS.gatwick, text: "Gatwick Airport is around 88 miles from Southampton Airport by road. A direct private transfer, with your fare agreed before you travel." },
      { ...AIRPORTS.bournemouth, text: "Bournemouth Airport is around 31 miles from Southampton Airport by road. A direct private transfer, with your fare agreed before you travel." },
    ],
  },
  ports: {
    heading: "Southampton Airport to Your Cruise or Ferry Port",
    paragraphs: [
      "Southampton Airport is conveniently located near several major UK ferry and cruise ports, making it a useful arrival point for passengers continuing their journey by sea. Whether you are flying into Southampton before joining a cruise or catching an international ferry, One Airport Taxi offers pre-booked, fixed-price transfers from Southampton Airport to major UK ports.",
      "Cruise and ferry journeys often involve larger suitcases and additional luggage, so choose your vehicle based on the total amount of luggage rather than passenger numbers alone. For example, a family of four travelling with four large suitcases may need a 4-seater MPV rather than a standard saloon.",
      "Whether you need a taxi to Southampton Cruise Terminal, Dover, Portsmouth, Harwich or Tilbury, One Airport Taxi can arrange a comfortable transfer with clear pricing. Get your instant quote online and choose a vehicle that suits your passengers and luggage.",
    ],
    titleFrom: "Southampton Airport",
    places: [
      { ...PORTS.southampton, label: "Cruise Terminal", text: "Southampton Cruise Port is approximately 5–7 miles from Southampton Airport, with a journey time of around 15–25 minutes by road. The port has five cruise terminals: Ocean, Mayflower, City, Queen Elizabeth II and Horizon. Confirm your departure terminal before booking so your driver can take you to the correct location." },
      { ...PORTS.dover, text: "Dover is around 150 miles from Southampton Airport by road, with a journey time of around 2 hours 15 minutes to 2 hours 45 minutes. Dover Eastern Docks handles ferry services to France, while cruise ships generally use the Western Docks." },
      { ...PORTS.portsmouth, text: "Portsmouth International Port is approximately 20–25 miles from Southampton Airport, with a journey time of around 35–50 minutes. The port serves ferry routes to destinations including France, Spain and the Channel Islands." },
      { ...PORTS.harwich, text: "Harwich International Port is around 170 miles from Southampton Airport by road, with a journey time of around 2 hours 45 minutes to 3 hours 15 minutes. It is an important departure point for ferry services to the Hook of Holland." },
      { ...PORTS.tilbury, text: "Tilbury Cruise Terminal is approximately 115–130 miles from Southampton Airport, with a journey time of around 2 hours to 2 hours 30 minutes. It serves cruise passengers travelling from the London area and other destinations." },
    ],
    note: "Journey times are approximate and can vary depending on traffic, roadworks and your chosen route. Allow additional time for port check-in, embarkation and ferry departure.",
  },
}

const BOURNEMOUTH_BRIEF: AirportBrief = {
  guide: {
    heading: "Bournemouth Airport Information and Travel Guide",
    paragraphs: [
      "Bournemouth Airport (BOH) sits just north of the town, close to Christchurch and the Dorset coast. It’s a small, manageable airport with a single terminal, handling a mix of leisure, charter and selected scheduled routes.",
      "Being compact, check-in and security generally move fast, though it’s still worth allowing the usual buffer at peak travel times.",
    ],
    groups: [
      { title: "Bournemouth Airport Terminal", columns: 2, cards: [
        { icon: PlaneTakeoff, title: "One terminal", text: "One terminal covers check-in, security and arrivals, with the drop-off and pickup area close to the terminal entrance." },
        { icon: Clock, title: "Before you travel", text: "Confirm your flight time with your airline before arranging your taxi, and leave enough time to get there and through security." },
      ] },
      { title: "Getting to Bournemouth Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, the airport sits just off the A338, with good links to Bournemouth, Poole, Christchurch and the wider Dorset road network." },
        { icon: TrainFront, title: "By rail and bus", text: "Rail and bus options exist but are limited compared with those at larger airports, which is one reason a private airport taxi is such a popular choice here." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "With One Airport Taxi, your journey runs door-to-door — from your home, hotel or office straight to the terminal.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to Bournemouth Airport – Departures Made Simple",
    paragraphs: ["Need a taxi to Bournemouth Airport? We run pre-booked transfers to the terminal from across Dorset and the wider UK. When booking, add your flight details where asked so that we can plan your drop-off around check-in."],
    cards: [
      { icon: PlaneTakeoff, title: "Bournemouth Airport Departures Drop-Off", text: "Your driver takes you directly to the terminal drop-off area, allowing time for check-in and security.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early Morning and Late Night Flights", text: "Charter and leisure flights from Bournemouth often depart early or return late. A pre-booked taxi means your driver is outside at the agreed time, whatever the hour.", actions: [{ kind: "to", label: "Book an early transfer" }] },
      { icon: UsersRound, title: "Group and Family Departures", text: "Travelling with the whole family or a group? Book an MPV or 8-seater minibus and keep everyone in one vehicle, with luggage space to match.", actions: [{ kind: "to", label: "Book a group transfer" }], link: { href: "#vehicles", label: "See MPVs and minibuses" } },
    ],
  },
  travellers: {
    heading: "Bournemouth Airport Taxi Service for Families, Business Travellers and Groups",
    lead: "Different trips call for different vehicles. We offer options to suit a wide range of journeys to and from Bournemouth Airport.",
    cards: [
      { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or several suitcases? Pick a vehicle with the space to match. Child seats can be requested when booking, subject to availability and suitability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
      { icon: Briefcase, title: "Business Airport Transfers", text: "A professional Bournemouth Airport taxi for meetings, corporate travel and flight connections, with executive vehicles for a more premium journey.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: UsersRound, title: "Group Airport Transfers", text: "Friends, colleagues or the extended family travelling together? Our MPVs and 8-seater minibuses handle larger groups comfortably.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Route, title: "Long-Distance Airport Journeys", text: "Bournemouth is also a practical starting point for longer transfers — Bournemouth to Gatwick, Bournemouth to Southampton Airport or Bournemouth to Stansted, with your fare agreed before you travel.", link: { href: "/destinations", label: "See our destinations" } },
    ],
  },
  cities: {
    eyebrow: "Dorset and the South",
    heading: "Bournemouth Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From Bournemouth, Poole, a town across Dorset or a city further afield, we can arrange a pre-booked transfer to Bournemouth Airport. We cover journeys between Bournemouth Airport and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Bournemouth Airport from places like:",
    places: [
      town("Bournemouth Town Centre", "Bournemouth town centre, Dorset", 50.7192, -1.8808),
      town("Poole", "Poole, Dorset", 50.715, -1.9872),
      town("Christchurch", "Christchurch, Dorset", 50.7356, -1.7784),
      town("Ringwood", "Ringwood, Hampshire", 50.846, -1.79),
      town("Wimborne Minster", "Wimborne Minster, Dorset", 50.8, -1.988),
      town("Dorchester", "Dorchester, Dorset", 50.7154, -2.4367),
      town("Salisbury", "Salisbury, Wiltshire", 51.0688, -1.7945),
      town("Southampton", "Southampton, Hampshire", 50.9097, -1.4044, { href: "/destinations/southampton-taxi", hrefLabel: "Southampton taxi guide" }),
      LONDON,
    ],
    closing: "You can also book a taxi from Bournemouth Airport to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Bournemouth Airport Journey",
  },
  airports: {
    heading: "Bournemouth Airport to Other Airports – Private Airport Transfers",
    paragraphs: ["Bournemouth is a practical starting point for longer transfers to other airports, with your fare agreed before you travel."],
    titleFrom: "Bournemouth",
    places: [
      { ...AIRPORTS.southampton, text: "Southampton Airport is around 30 miles from Bournemouth Airport by road. A direct private transfer, with your fare agreed before you travel." },
      { ...AIRPORTS.gatwick, text: "A longer transfer from Bournemouth to Gatwick, in a vehicle that suits your passengers and luggage, with your fare agreed before you travel." },
      { ...AIRPORTS.stansted, text: "A longer transfer from Bournemouth to Stansted, in a vehicle that suits your passengers and luggage, with your fare agreed before you travel." },
    ],
  },
  ports: {
    heading: "Bournemouth Airport to Your Cruise or Ferry Port",
    paragraphs: [
      "Bournemouth Airport does not have ferry or cruise terminals of its own, but many passengers fly into BOH before continuing their journey to a UK port. One Airport Taxi offers pre-booked, fixed-price taxi transfers from Bournemouth Airport to major ferry and cruise ports across the UK.",
      "Cruise and ferry luggage is often bulkier than standard airport luggage, so choose your vehicle based on the number of suitcases, not just the number of passengers. For example, a family of four travelling with four large suitcases may need a 4-seater MPV rather than a standard saloon.",
      "Whether you are travelling to Southampton, Dover, Portsmouth, Harwich or Tilbury, One Airport Taxi can arrange a comfortable, pre-booked transfer. Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater vehicles to accommodate your passengers and luggage.",
    ],
    titleFrom: "Bournemouth Airport",
    places: [
      { ...PORTS.southampton, text: "Southampton is approximately 25–30 miles from Bournemouth Airport, with a journey time of around 35–50 minutes by road. Southampton has five cruise terminals: Ocean, Mayflower, City, Queen Elizabeth II and Horizon. Confirm your departure terminal on your cruise documents before booking your transfer." },
      { ...PORTS.dover, text: "Dover is approximately 170–180 miles from Bournemouth Airport, with a journey time of around 3–3.5 hours. Ferries to France depart from the Eastern Docks, while cruise ships generally use the Western Docks. Allow additional time for traffic and port check-in." },
      { ...PORTS.portsmouth, text: "Portsmouth International Port is around 48 miles from Bournemouth Airport by road, with a journey time of around 1–1 hour 20 minutes. The port operates ferry services to destinations including France, Spain and the Channel Islands, as well as selected cruise departures." },
      { ...PORTS.harwich, text: "Harwich International Port is around 195 miles from Bournemouth Airport by road, with a journey time of around 3.5–4 hours. The port provides international ferry services, including crossings to the Hook of Holland. Plan your transfer carefully to allow enough time for check-in." },
      { ...PORTS.tilbury, text: "Tilbury Cruise Terminal is around 140 miles from Bournemouth Airport by road, with a journey time of around 3–3.5 hours. Located in Essex, Tilbury serves cruise passengers travelling from the London area and other destinations. Check your cruise documents for the correct terminal and departure time before arranging your journey." },
    ],
    note: "Journey times are estimates and can vary depending on traffic, roadworks and your chosen route, so allow extra time before your embarkation or check-in.",
  },
}

const OXFORD_CITY = town("Oxford", "Oxford city centre, Oxford", 51.752, -1.2577)

/** Most Oxford journeys start in the city, not at Oxford Airport. */
function fromOxford(place: BriefPlace) {
  return createRouteBookingLinks({ name: OXFORD_CITY.address, latitude: OXFORD_CITY.latitude, longitude: OXFORD_CITY.longitude }, { name: place.address, latitude: place.latitude, longitude: place.longitude }).toAirport
}

const OXFORD_BRIEF: AirportBrief = {
  guide: {
    heading: "Oxford Airport Information and Travel Guide",
    paragraphs: [
      "Oxford (London) Airport, also known as Oxford Airport or Kidlington Airport, is a small general aviation airport north of Oxford, mainly used for private aviation, flight training and charter flights rather than scheduled commercial routes. For that reason, most of the airport-related searches from Oxford are actually about getting to and from the UK’s major airports — Heathrow, Gatwick, Luton, Stansted and Birmingham — and that’s where One Airport Taxi focuses its Oxford service.",
    ],
    groups: [
      { title: "Getting Between Oxford and the Airports", columns: 2, cards: [
        { icon: PlaneTakeoff, title: "Getting from Oxford to Heathrow Airport", text: "Heathrow is around 50 miles from Oxford via the M40 and M25, typically taking 1 hour to 1 hour 30 minutes by road depending on traffic. Alternatives include the Oxford Bus Company’s Airline coach service or the train, with at least one change, but both run to fixed timetables. A pre-booked taxi from Oxford to Heathrow (or Heathrow to Oxford) runs door to door on your schedule, with your fare fixed regardless of which Heathrow terminal you need — including Heathrow Terminal 5.", link: { href: fromOxford(AIRPORTS.heathrow), label: "Book Oxford to Heathrow" } },
        { icon: Route, title: "Getting from Oxford to Luton, Gatwick, Stansted and Birmingham Airports", text: "Oxford also connects well by road to Luton Airport, Gatwick Airport, Stansted Airport and Birmingham Airport. If you’re flying from one of these airports instead of Heathrow, a pre-booked Oxford airport taxi lets you travel directly with your luggage, without waiting for a coach or changing trains." },
        { icon: Car, title: "Getting to Oxford Airport and Around Oxford", text: "By road, Oxford is served by the A34, A40 and M40, with the city centre a short drive from the airport itself. Public transport within Oxford is comprehensive, but for an early flight, a late arrival, or travelling with a family or group, a private taxi remains the simplest option.", link: { href: "/destinations/oxford-taxi", label: "Oxford taxi guide" } },
        { icon: MapPin, title: "Door to door", text: "With One Airport Taxi, your journey runs door to door — from your home, college or office in Oxford straight to your airport terminal, wherever in the UK that may be.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to Oxford Airport – Departures Made Simple",
    paragraphs: ["Need a taxi from Oxford to one of the UK’s major airports, or to Oxford (Kidlington) Airport itself? We run pre-booked transfers across Oxfordshire and beyond. When booking, add your flight details where asked — this helps us plan your journey and time your drop-off around check-in."],
    cards: [
      { icon: PlaneTakeoff, title: "Oxford to Heathrow Taxi", text: "Our most requested Oxford airport route. Book an Oxford-to-Heathrow taxi to any terminal, including Terminals 4 and 5, with your fare confirmed before travel.", link: { href: fromOxford(AIRPORTS.heathrow), label: "Book Oxford to Heathrow" } },
      { icon: Route, title: "Oxford to Luton, Gatwick and Stansted Taxi", text: "Flying from a different London airport? We also cover Oxford to Luton Airport, Oxford to Gatwick Airport and Oxford to Stansted Airport transfers, priced and booked the same straightforward way.", link: { href: fromOxford(AIRPORTS.luton), label: "Book Oxford to Luton" } },
      { icon: Car, title: "Oxford to Birmingham Airport Taxi", text: "Heading north instead? Book a taxi from Oxford to Birmingham Airport with the same fixed-fare approach.", link: { href: fromOxford(AIRPORTS.birmingham), label: "Book Oxford to Birmingham" } },
    ],
  },
  travellers: {
    heading: "Oxford Airport Taxi Service for Families, Business Travellers, Students and Groups",
    lead: "Different trips call for different vehicles. We offer options to suit a wide range of journeys between Oxford and the UK’s major airports.",
    cards: [
      { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or several suitcases on a Heathrow or Gatwick run from Oxford? Choose a vehicle with the right space. Child seats can be requested when booking, subject to availability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
      { icon: Briefcase, title: "Business and University Airport Transfers", text: "A professional transfer for business travellers, academics and visiting students connecting Oxford with Heathrow, Luton or Birmingham Airport, with executive vehicles available.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: UsersRound, title: "Group Airport Transfers", text: "Travelling with colleagues, coursemates or the extended family? Our MPVs and 8-seater minibuses handle larger groups comfortably, with luggage space to match.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Route, title: "Long-Distance Airport Journeys", text: "Oxford is a popular starting point for journeys to every major UK airport. Arrange a private transfer to Heathrow, Gatwick, Luton, Stansted or Birmingham Airport, with your fare agreed before you travel.", link: { href: "/destinations", label: "See our destinations" } },
    ],
  },
  cities: {
    eyebrow: "Oxfordshire and beyond",
    heading: "Oxford Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From Oxford, a town across Oxfordshire or a city further afield, we can arrange a pre-booked transfer to Oxford Airport. We cover journeys between Oxford Airport and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Oxford Airport from places like:",
    places: [
      town("Oxford City Centre", "Oxford city centre, Oxfordshire", 51.752, -1.2577, { href: "/destinations/oxford-taxi", hrefLabel: "Oxford taxi guide" }),
      town("Kidlington", "Kidlington, Oxfordshire", 51.823, -1.29),
      town("Bicester", "Bicester, Oxfordshire", 51.899, -1.153),
      town("Banbury", "Banbury, Oxfordshire", 52.0629, -1.3398),
      town("Witney", "Witney, Oxfordshire", 51.785, -1.485),
      town("Abingdon", "Abingdon, Oxfordshire", 51.671, -1.282),
      town("Reading", "Reading, Berkshire", 51.4543, -0.9781, { href: "/destinations/reading-taxi", hrefLabel: "Reading taxi guide" }),
      town("Milton Keynes", "Milton Keynes, Buckinghamshire", 52.0406, -0.7594),
      LONDON,
    ],
    closing: "You can also book a taxi from Oxford Airport to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Oxford Airport Journey",
  },
  airports: {
    heading: "Oxford to the UK’s Major Airports – Private Airport Transfers",
    paragraphs: ["A pre-booked taxi between Oxford and the airport runs door to door on your schedule, with your fare agreed before you travel."],
    titleFrom: "Oxford",
    origin: OXFORD_CITY,
    places: [
      { ...AIRPORTS.heathrow, text: "Our most requested Oxford airport route, to any terminal, including Terminals 4 and 5." },
      { ...AIRPORTS.gatwick, text: "A direct transfer between Oxford and Gatwick, with your fare confirmed before travel." },
      { ...AIRPORTS.luton, text: "A direct transfer between Oxford and Luton Airport, priced and booked the same straightforward way." },
      { ...AIRPORTS.stansted, text: "A direct transfer between Oxford and Stansted, in a vehicle sized to your passengers and luggage." },
      { ...AIRPORTS.birmingham, text: "Heading north instead? A taxi between Oxford and Birmingham Airport with the same fixed-fare approach." },
    ],
  },
  ports: {
    heading: "Oxford Airport to Your Cruise or Ferry Port",
    paragraphs: [
      "Oxford Airport does not have its own ferry or cruise terminals, but passengers travelling through London Oxford Airport may need an onward transfer to a UK cruise or ferry port. One Airport Taxi offers pre-booked, fixed-price taxi transfers from Oxford Airport to major ferry and cruise ports across the UK.",
      "Cruise luggage is often bulkier than standard travel luggage, so choose your vehicle based on the number of suitcases, not just the number of passengers. For example, a family of four travelling with four large suitcases may need a 4-seater MPV rather than a standard saloon.",
      "Whether you are travelling to Southampton, Dover, Portsmouth, Harwich or Tilbury, One Airport Taxi can arrange a comfortable, pre-booked transfer. Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater vehicles to accommodate your passengers and luggage.",
    ],
    titleFrom: "Oxford Airport",
    places: [
      { ...PORTS.southampton, text: "Southampton is approximately 75–85 miles from Oxford Airport, with a journey time of around 1 hour 30 minutes to 2 hours by road. Southampton has five cruise terminals: Ocean, Mayflower, City, Queen Elizabeth II and Horizon. Confirm your departure terminal on your cruise documents before booking your transfer." },
      { ...PORTS.dover, text: "Dover is approximately 140–155 miles from Oxford Airport, with a journey time of around 2 hours 45 minutes to 3 hours 15 minutes. Ferries to France depart from the Eastern Docks, while cruise ships generally use the Western Docks. Allow additional time for traffic and port check-in." },
      { ...PORTS.portsmouth, text: "Portsmouth International Port is approximately 90–100 miles from Oxford Airport, with a journey time of around 1 hour 45 minutes to 2 hours 15 minutes. The port operates ferry services to destinations including France, Spain and the Channel Islands, as well as selected cruise departures." },
      { ...PORTS.harwich, text: "Harwich International Port is around 146 miles from Oxford Airport by road, with a journey time of around 3–3.5 hours. The port provides international ferry services, including crossings to the Hook of Holland. Plan your transfer carefully to allow enough time for check-in." },
      { ...PORTS.tilbury, text: "Tilbury Cruise Terminal is approximately 100–115 miles from Oxford Airport, with a journey time of around 2–2.5 hours. Located in Essex, Tilbury serves cruise passengers travelling from the London area and other destinations. Check your cruise documents for the correct terminal and departure time before arranging your journey." },
    ],
    note: "Journey times are estimates and can vary depending on traffic, roadworks and your chosen route, so allow extra time before your embarkation or check-in time.",
  },
}

const FARNBOROUGH_AIRPORT = { name: "Farnborough Airport (FAB)", latitude: 51.2832253, longitude: -0.7772854 }

const FARNBOROUGH_BRIEF: AirportBrief = {
  guide: {
    heading: "Farnborough Airport Information and Travel Guide",
    paragraphs: [
      "Farnborough Airport is located in Hampshire, around 35 miles south-west of Central London, and is the UK’s primary hub for business and private aviation. Unlike Heathrow, Gatwick or Luton, it doesn’t handle scheduled commercial passenger flights — its traffic is almost entirely private jets, corporate aircraft and charter flights, making it a key arrival and departure point for business travellers, VIPs and private clients.",
    ],
    groups: [
      { title: "Farnborough Airport Terminal", columns: 2, cards: [
        { icon: PlaneTakeoff, title: "Built around private aviation", text: "The terminal at Farnborough is built around private aviation, with a more intimate, lower-footfall experience than a commercial airport." },
        { icon: Clock, title: "Timing depends on your flight", text: "Processing tends to be quicker, but exact timing depends on the operator and flight. Hence, coordinating pickups based on real-time information matters more here than at a scheduled commercial airport." },
      ] },
      { title: "Getting to Farnborough Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, Farnborough is reached via the M3 and A331, with good connections to London, Guildford, Reading and the wider Hampshire and Surrey road network." },
        { icon: TrainFront, title: "Public transport", text: "Given the nature of traffic at Farnborough, public transport is rarely a practical option, making a pre-booked private transfer the standard choice for passengers and crew alike." },
        { icon: MapPin, title: "Door to door", text: "With One Airport Taxi, your journey runs door to door — from the airport straight to your home, hotel, office or meeting in London or further afield.", actions: [{ kind: "from", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to Farnborough Airport – Departures Made Simple",
    paragraphs: ["Need a taxi to Farnborough Airport ahead of a private or corporate flight? We run pre-booked transfers to the airport from London and across the South East. When booking, add your flight or departure details where asked so that we can time the drop-off correctly."],
    cards: [
      { icon: PlaneTakeoff, title: "Farnborough Airport Departures Drop-Off", text: "Your driver takes you directly to the airport, with time built in for any required security or processing before departure.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early and Late Departures", text: "Private aviation schedules often fall outside normal hours. A pre-booked taxi means your driver is ready at the agreed time, whatever the hour.", actions: [{ kind: "to", label: "Book an early transfer" }] },
      { icon: UsersRound, title: "Group and Corporate Departures", text: "Travelling with colleagues or clients to the same flight? Book an MPV or 8-seater minibus and travel together.", actions: [{ kind: "to", label: "Book a group transfer" }], link: { href: "#vehicles", label: "See MPVs and minibuses" } },
    ],
  },
  travellers: {
    heading: "Farnborough Airport Taxi Service for Business Travellers, Executives and Groups",
    lead: "Farnborough’s traffic is almost entirely business and private aviation, so our service here is built around those journeys.",
    cards: [
      { icon: Briefcase, title: "Executive and Business Transfers", text: "A professional Farnborough Airport taxi for executives, business travellers and corporate clients, with executive vehicles available throughout.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: PlaneTakeoff, title: "Private Aviation Transfers", text: "Transfers coordinated around private jet arrivals and departures, with flexible timing and a discreet, professional driver.", link: { href: "/Contact-Us", label: "Talk to our team" } },
      { icon: UsersRound, title: "Group and Corporate Transfers", text: "Teams or groups travelling together can book an MPV or 8-seater minibus, with the whole party moving in one vehicle.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Route, title: "Long-Distance Executive Journeys", text: "Farnborough is a common gateway for executive journeys into Central London and beyond. Arrange a private transfer with your fare agreed before you travel.", link: { href: createRouteBookingLinks(FARNBOROUGH_AIRPORT, { name: LONDON.address, latitude: LONDON.latitude, longitude: LONDON.longitude }).toAirport, label: "Book Farnborough to Central London" } },
    ],
  },
  cities: {
    eyebrow: "Hampshire, Surrey and London",
    heading: "Farnborough Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From Central London, a business address in the Thames Valley or a town across Hampshire and Surrey, we can arrange a pre-booked transfer to Farnborough Airport. We cover journeys between Farnborough Airport and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Farnborough Airport from places like:",
    places: [
      LONDON,
      town("Farnborough Town Centre", "Farnborough town centre, Hampshire", 51.294, -0.756),
      town("Fleet", "Fleet, Hampshire", 51.283, -0.841),
      town("Aldershot", "Aldershot, Hampshire", 51.248, -0.762),
      town("Camberley", "Camberley, Surrey", 51.337, -0.742),
      town("Woking", "Woking, Surrey", 51.319, -0.558),
      town("Guildford", "Guildford, Surrey", 51.2362, -0.5704),
      town("Basingstoke", "Basingstoke, Hampshire", 51.2665, -1.0924),
      town("Reading", "Reading, Berkshire", 51.4543, -0.9781, { href: "/destinations/reading-taxi", hrefLabel: "Reading taxi guide" }),
    ],
    closing: "You can also book a taxi from Farnborough Airport to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Farnborough Airport Journey",
  },
  airports: {
    heading: "Farnborough Airport to Other Airports – Private Airport Transfers",
    paragraphs: ["Heathrow, Gatwick and Southampton are the nearest larger airports to Farnborough. Arrange a private transfer with your fare agreed before you travel."],
    titleFrom: "Farnborough",
    places: [
      { ...AIRPORTS.heathrow, text: "Heathrow Airport is approximately 25–30 miles from Farnborough Airport, around 30–45 minutes by road." },
      { ...AIRPORTS.gatwick, text: "Gatwick Airport is approximately 45–55 miles from Farnborough Airport, around 50–75 minutes by road." },
      { ...AIRPORTS.southampton, text: "Southampton Airport is approximately 40–45 miles from Farnborough Airport by road." },
    ],
  },
  ports: {
    heading: "Farnborough Airport to Your Cruise or Ferry Port",
    paragraphs: [
      "Farnborough Airport does not have its own ferry or cruise terminals, but many passengers arriving at FAB need onward transport to a UK port. One Airport Taxi offers pre-booked, fixed-price taxi transfers from Farnborough Airport to major ferry and cruise ports across the UK.",
      "Cruise luggage is often bulkier than standard airport luggage, so choose your vehicle based on the number of suitcases, not just the number of passengers. For example, a family of four travelling with four large suitcases may need a 4-seater MPV rather than a saloon.",
      "Whether you are travelling to Southampton, Dover, Portsmouth, Harwich or Tilbury, One Airport Taxi can arrange a comfortable, pre-booked transfer. Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater vehicles to accommodate your passengers and luggage.",
    ],
    titleFrom: "Farnborough Airport",
    places: [
      { ...PORTS.southampton, text: "Southampton is around 46 miles from Farnborough Airport by road, with a journey time of around 1 hour 10 minutes to 1 hour 30 minutes. Southampton has five cruise terminals: Ocean, Mayflower, City, Queen Elizabeth II and Horizon. Confirm your departure terminal on your cruise documents before booking your transfer." },
      { ...PORTS.dover, text: "Dover is approximately 105–120 miles from Farnborough Airport, with a journey time of around 2–2.5 hours. Ferries to France depart from the Eastern Docks, while cruise ships generally use the Western Docks. Allow extra time for traffic and port check-in." },
      { ...PORTS.portsmouth, text: "Portsmouth International Port is approximately 45–55 miles from Farnborough Airport, with a journey time of around 1–1 hour 20 minutes. The port operates ferry services to destinations including France, Spain and the Channel Islands, as well as selected cruise departures." },
      { ...PORTS.harwich, text: "Harwich International Port is around 132 miles from Farnborough Airport by road, with a journey time of around 3–3.5 hours. The port provides international ferry services, including crossings to the Hook of Holland. Plan your transfer carefully to allow enough time for check-in." },
      { ...PORTS.tilbury, text: "Tilbury Cruise Terminal is approximately 75–90 miles from Farnborough Airport, with a journey time of around 1 hour 30 minutes to 2 hours. Located in Essex, Tilbury serves cruise passengers travelling from the London area and other destinations. Check your cruise documents for the correct terminal and departure time before arranging your journey." },
    ],
    note: "Journey times are estimates and can vary depending on traffic, roadworks and your chosen route, so leave enough time before your embarkation or check-in.",
  },
}

const BIRMINGHAM_BRIEF: AirportBrief = {
  guide: {
    heading: "Birmingham Airport Information and Travel Guide",
    paragraphs: [
      "Birmingham Airport (BHX) is the Midlands’ main international airport, located near Solihull and the NEC, about 8 miles east of Birmingham city centre. It operates a single, modern terminal serving domestic, European and long-haul routes, making it one of the busiest airports outside London.",
    ],
    groups: [
      { title: "Birmingham Airport Terminal", columns: 2, cards: [
        { icon: PlaneTakeoff, title: "One terminal", text: "With one terminal covering check-in, security, shops and arrivals, there’s no risk of heading to the wrong place. The pickup and drop-off area sits close to the terminal entrance." },
        { icon: Clock, title: "Before you travel", text: "Confirm your flight time with your airline before arranging your taxi, and allow enough time to reach the airport and clear security, especially during NEC event periods when traffic can build up quickly." },
      ] },
      { title: "Getting to Birmingham Airport", columns: 3, cards: [
        { icon: Car, title: "By road", text: "By road, the airport is reached via the M42 and A45, with good connections to the M6, M5 and wider motorway network." },
        { icon: TrainFront, title: "By rail", text: "Birmingham International railway station sits next to the terminal, with regular services to Birmingham New Street and across the Midlands. Public transport works well for light travellers." },
        { icon: MapPin, title: "Door-to-door by taxi", text: "A private taxi earns its keep when you’re carrying several suitcases, travelling with children, heading to or from an NEC event, or moving as a group. With One Airport Taxi, your journey runs door-to-door — from your home, hotel or office straight to your terminal.", actions: [{ kind: "to", label: "Get my fixed price" }], highlight: true },
      ] },
    ],
  },
  departures: {
    eyebrow: "Departures",
    heading: "Taxi to Birmingham Airport – Departures Made Simple",
    paragraphs: ["Need a taxi to Birmingham Airport? One Airport Taxi provides pre-booked transfers to the terminal from across the Midlands and the wider UK. When making your booking, provide your flight details where requested. This helps us plan your journey and arrange the appropriate drop-off."],
    cards: [
      { icon: PlaneTakeoff, title: "Birmingham Airport Departures Drop-Off", text: "Your driver takes you to the terminal drop-off area, allowing time for check-in and security.", actions: [{ kind: "to", label: "Book a drop-off" }] },
      { icon: Clock, title: "Early Morning and Late Night Flights", text: "Long-haul and charter departures from Birmingham often mean early starts or late finishes. A pre-booked taxi means your driver is outside at the agreed time, whatever the hour.", actions: [{ kind: "to", label: "Book an early transfer" }] },
      { icon: UsersRound, title: "NEC, Group and Family Departures", text: "Travelling to a flight after an NEC event, or heading off as a family or group? Book an MPV or 8-seater minibus and travel together, with luggage space to match.", actions: [{ kind: "to", label: "Book a group transfer" }], link: { href: "#vehicles", label: "See MPVs and minibuses" } },
    ],
  },
  travellers: {
    heading: "Birmingham Airport Taxi Service for Families, Business Travellers and Groups",
    lead: "Different passengers have different airport transportation requirements. One Airport Taxi offers a range of vehicle options and pre-booked journeys for a variety of travel needs.",
    cards: [
      { icon: Baby, title: "Family Airport Transfers", text: "Travelling with children, pushchairs or several suitcases? Choose a vehicle with suitable passenger and luggage capacity. You can request a child seat when booking, subject to availability and suitability.", link: { href: "#vehicles", label: "Compare family vehicles" } },
      { icon: Briefcase, title: "Business Airport Transfers", text: "Arrange a professional Birmingham Airport taxi for business meetings, corporate travel, NEC events and airport connections. Executive vehicles are available for passengers who prefer a more premium journey.", link: { href: "#vehicles", label: "See executive cars" } },
      { icon: UsersRound, title: "Group Airport Transfers", text: "Travelling with friends, colleagues or an extended family? Our MPVs and 8-seater minibuses provide options for larger groups. Check luggage capacity before confirming your vehicle.", link: { href: "#vehicles", label: "See MPVs and minibuses" } },
      { icon: Route, title: "Long-Distance Airport Journeys", text: "Birmingham is a common starting point for journeys beyond the Midlands. You can arrange a private transfer to destinations across the UK, with your fare confirmed before travel.", link: { href: "/destinations", label: "See our destinations" } },
    ],
  },
  cities: {
    eyebrow: "The Midlands and beyond",
    heading: "Birmingham Airport Taxi Transfers to Towns and Cities",
    paragraphs: ["From Birmingham city centre, a town across the West Midlands or a city further afield, we can arrange a pre-booked transfer to Birmingham Airport. We cover journeys between Birmingham Airport and homes, hotels, business addresses and other destinations across the UK."],
    listHeading: "You can arrange a taxi to Birmingham Airport from places like:",
    places: [
      town("Birmingham City Centre", "Birmingham city centre, West Midlands", 52.4797, -1.9026),
      town("Solihull", "Solihull, West Midlands", 52.412, -1.778),
      town("Coventry", "Coventry, West Midlands", 52.4068, -1.5197),
      town("Sutton Coldfield", "Sutton Coldfield, West Midlands", 52.57, -1.824),
      town("Wolverhampton", "Wolverhampton, West Midlands", 52.5862, -2.1288),
      town("Leamington Spa", "Royal Leamington Spa, Warwickshire", 52.2852, -1.52),
      town("Warwick", "Warwick, Warwickshire", 52.282, -1.585),
      town("Stratford-upon-Avon", "Stratford-upon-Avon, Warwickshire", 52.1917, -1.7073),
      town("Leicester", "Leicester, Leicestershire", 52.6369, -1.1398),
    ],
    closing: "You can also book a taxi from Birmingham Airport to any of these places or further away. Enter your exact journey details to see the fare.",
    cta: "Get a Quote for Your Birmingham Airport Journey",
  },
  airports: {
    heading: "Birmingham Airport to Other Airports – Private Airport Transfers",
    paragraphs: ["East Midlands, Manchester and Luton are among the nearby airports you can reach by private transfer, with your fare confirmed before travel."],
    titleFrom: "Birmingham",
    places: [
      { ...AIRPORTS.eastMidlands, text: "East Midlands Airport is around 37 miles from Birmingham Airport by road." },
      { ...AIRPORTS.manchester, text: "Manchester Airport is approximately 85–95 miles from Birmingham Airport by road." },
      { ...AIRPORTS.luton, text: "London Luton Airport is around 82 miles from Birmingham Airport by road." },
    ],
  },
  ports: {
    heading: "Birmingham Airport to Your Cruise or Ferry Port",
    paragraphs: [
      "Birmingham Airport does not have its own ferry or cruise terminals, but many passengers fly into BHX before continuing their journey to a UK port. One Airport Taxi offers pre-booked, fixed-price taxi transfers from Birmingham Airport to major ferry and cruise ports across the UK.",
      "Cruise luggage is often bulkier than standard airport luggage, so choose your vehicle based on the number of suitcases, not just the number of passengers. For example, a family of four travelling with four large suitcases may need a 4-seater MPV rather than a saloon.",
      "Whether you are travelling to Southampton, Dover, Portsmouth, Harwich or Tilbury, One Airport Taxi can arrange a comfortable, pre-booked transfer. Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater vehicles to accommodate your passengers and luggage.",
    ],
    titleFrom: "Birmingham Airport",
    places: [
      { ...PORTS.southampton, text: "Southampton is approximately 130–135 miles from Birmingham Airport, with a journey time of around 2 hours 15 minutes to 2 hours 45 minutes by road. Southampton has five cruise terminals: Ocean, Mayflower, City, Queen Elizabeth II and Horizon. Confirm your departure terminal on your cruise documents before booking your transfer." },
      { ...PORTS.dover, text: "Dover is around 202 miles from Birmingham Airport by road, with a journey time of around 3–3.5 hours. Ferries to France depart from the Eastern Docks, while cruise ships generally use the Western Docks. Allow extra time for motorway traffic and port check-in." },
      { ...PORTS.portsmouth, text: "Portsmouth International Port is approximately 140–150 miles from Birmingham Airport, with a journey time of around 2 hours 30 minutes to 3 hours. The port operates ferry services to destinations including France, Spain and the Channel Islands, as well as selected cruise departures." },
      { ...PORTS.harwich, text: "Harwich International Port is around 171 miles from Birmingham Airport by road, with a journey time of around 3–3.5 hours. The port provides international ferry services, including crossings to the Hook of Holland. Allow additional time for traffic and ferry check-in." },
      { ...PORTS.tilbury, text: "Tilbury Cruise Terminal is approximately 130–135 miles from Birmingham Airport, with a journey time of around 2 hours 15 minutes to 2 hours 45 minutes. Located in Essex, Tilbury serves cruise passengers travelling from the London area and other destinations. Confirm your cruise terminal and departure time before arranging your transfer." },
    ],
    note: "All distances and journey times are approximate road estimates. Traffic, roadworks and the exact port entrance can affect your journey, so allow sufficient time for check-in and boarding.",
  },
}

const PICKUP_STEP_ONE = { title: "Share your flight and arrival details.", text: "Add your flight number and arrival information when you book so we know when to expect you." }
const MEET_DRIVER_STEP = { title: "Meet your driver.", text: "If you’ve chosen Meet and Greet, your driver waits inside arrivals at the agreed point. If not, follow the pickup instructions in your confirmation." }

export const BRIEF_COPY: Record<string, AirportCopy> = {
  Heathrow: {
    heroHeading: "Heathrow Airport Taxi – Reliable Transfers to and from LHR",
    heroSubhead: "Book a taxi to Heathrow Airport or arrange a comfortable transfer from Heathrow into London or other UK destinations. One Airport Taxi lets you pre-book your airport transfer, with fares fixed before you travel. Our professional, licensed drivers offer a choice of saloon cars, executive vehicles, MPVs, and 8-seater minibuses. Whether you’re travelling alone, with family, or in a group, you can choose the vehicle that fits your passengers and luggage. This way, you get to Heathrow with no surprises.",
    heroCallLine: true,
    heroCallText: "Get your free instant Heathrow taxi quote online and have the journey planned before you set off, or call our team on",
    intro: {
      heading: "Heathrow Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        <>Arranging a reliable Heathrow taxi shouldn’t be complicated. With One Airport Taxi, you can plan your trip, enter your pickup and drop-off details, and see your fare before you commit. So whether you need a <Link className={linkClass} href={`#${BRIEF_DESTINATIONS_ID}`}>taxi to Heathrow from London</Link>, a private transfer from Slough or <Link className={linkClass} href="/destinations/reading-taxi">Reading</Link>, or a pickup from the airport to your home, hotel or office, every journey is pre-booked and built around your plans.</>,
        <>We cover all four operational passenger terminals: <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>Terminal 2, 3, 4 and 5</Link>. Choose your <Link className={linkClass} href="#vehicles">vehicle</Link>, add your flight details, and set up your pickup in advance. The price you’re quoted is the price you pay. This means you can budget for your journey with no meter running and no unexpected costs at the end. Whether it’s a single airport run, a family holiday, or a long-distance transfer, booking with us is simple.</>,
      ],
      cta: "Get Your Heathrow Taxi Quote",
      // Short restatements of the two paragraphs above, shown as checkmarks.
      points: [
        { title: "Fare first", text: "See your price before you commit." },
        { title: "All four terminals", text: "Terminal 2, 3, 4 and 5." },
        { title: "No meter running", text: "The price you’re quoted is the price you pay." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Heathrow Airport Transfers?",
    benefitsSubhead: "The right airport taxi service makes a difference to the whole journey, not just the drive. We focus on clear pricing, planned pickups, comfortable cars and support that actually answers.",
    fleet: {
      heading: "Heathrow Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Choosing the right vehicle matters when you’re booking a taxi to Heathrow or arranging a transfer from it. Think about both seats and suitcase space before you choose.",
        "We run a range of vehicles, from everyday airport runs to executive travel and group transport.",
      ],
      closing: "Pick your vehicle based on how many people and how much luggage you have. Make sure to check the capacity details before you confirm your booking.",
      descriptions: VEHICLE_TEXT,
      pricing: {
        heading: "Fixed Heathrow Airport Taxi Prices",
        paragraphs: [
          "Your quote comes before you confirm. Enter your pickup, destination, travel date, and passenger requirements to see what’s available.",
          "Our pricing is straightforward, so you can compare vehicles and plan your trip without having to read through a lot of fine print.",
        ],
        cta: "Compare Heathrow Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Heathrow Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Landed at Heathrow after a long flight? Pre-booking your taxi takes the stress out of whatever comes next.",
        "We provide pickups from Terminals 2, 3, 4 and 5. Give us your flight number, arrival date and destination when you book, and we’ll plan the journey around your flight.",
      ],
      stepsHeading: "How Your Heathrow Airport Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "Once you’ve landed, follow signs for passport control and baggage reclaim. Your booking confirmation has your specific driver meeting instructions." },
        MEET_DRIVER_STEP,
        { title: "Head to your destination.", text: "From there it’s a straight run to your home, hotel, office or wherever else in the UK you’re heading." },
      ],
      dropHeading: "Heathrow Airport Drop-Off Service",
      dropText: "Travelling into Heathrow from London or elsewhere in the UK? Your driver takes you to the correct terminal drop-off area. Just make sure you’ve given the right terminal, and leave room in your timing for traffic, check-in and security.",
    },
    comfortHeading: "Comfortable Heathrow Airport Transfers with Thoughtful Extras",
    comfortSubhead: "The journey should be comfortable from the moment you’re picked up to the moment you’re dropped off. A few extras help.",
    comfortOrder: 75,
    final: {
      heading: "Book Your Heathrow Airport Taxi with One Airport Taxi",
      paragraphs: [
        "Whether it’s a taxi to Heathrow, a pickup from Heathrow into London, or a long-distance transfer, we’ll help you plan it.",
        <>Choose your vehicle, enter your travel details, and see your fare before you confirm. With pre-booked transfers, licensed drivers, flight monitoring, and <Link className="font-semibold text-white underline underline-offset-4" href="/Contact-Us">24/7 support</Link>, we make sure your Heathrow journey is taken care of so you can focus on your trip.</>,
      ],
      tagline: "Your journey starts with a clear price.",
    },
    finalChip: "All terminals",
    extraSections: briefSections("heathrow", HEATHROW_BRIEF),
    // The city, airport and port sections cover the CMS routes and cruise sections.
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Gatwick: {
    heroHeading: "Gatwick Airport Taxi – Reliable Transfers to and from LGW",
    heroSubhead: "Book a Gatwick Airport taxi and get a fixed fare confirmed before you travel. One Airport Taxi runs pre-booked Gatwick Airport transfers from London, Surrey, Sussex, and towns across the UK, with professional, licensed drivers and a choice of saloon cars, executive vehicles, MPVs, and 8-seater minibuses. Whether you’re travelling alone, with family or as a group, choose the vehicle that suits your passengers and luggage — then leave the driving to us.",
    heroCallLine: true,
    heroCallText: "Get your free instant Gatwick Airport taxi quote online and plan your journey before you travel, or call our team on",
    intro: {
      heading: "Gatwick Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        "Arranging a reliable taxi to Gatwick Airport should be straightforward. With One Airport Taxi, you plan, enter your pickup and drop-off details, and receive your fare before confirming your booking.",
        "Whether you need a taxi to Gatwick Airport from London, a private transfer from Crawley or Brighton, or a taxi from Gatwick Airport to your home, hotel or business address, we provide pre-booked journeys designed around your travel plans.",
        <>Gatwick has two terminals — <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>North and South</Link> — linked by a free automated shuttle, so choosing the right terminal matters. Please tell us which one when you book, add your flight number, and we’ll plan the pickup around your arrival.</>,
        <>Your quoted fare is confirmed before you travel so that you can plan your costs without unexpected changes. From a single airport run to a <Link className={linkClass} href="#vehicles">family holiday</Link> or a <Link className={linkClass} href="/destinations">long-distance transfer</Link>, booking your Gatwick journey is simple.</>,
      ],
      cta: "Get Your Gatwick Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "Receive your fare before confirming." },
        { title: "Two terminals", text: "North and South, linked by a free shuttle." },
        { title: "No unexpected changes", text: "Your quoted fare is confirmed before you travel." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Gatwick Airport Transfers?",
    benefitsSubhead: "Choosing the right airport taxi service makes a difference to your entire journey. We focus on clear pricing, planned pickups, comfortable vehicles, and helpful support.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "Know your journey cost before confirming your Gatwick Airport taxi booking. Our fixed-fare approach means no meter-based pricing and no unexpected fare changes. Check the fare details and included charges before booking." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We monitor your flight information to help coordinate your pickup. If your arrival time changes, our team uses the updated details to plan your collection." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Travel with professional, licensed drivers who understand punctuality, safe driving, and good customer service. Our drivers aim to make every airport journey comfortable and straightforward." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when booking, and your driver can meet you inside the arrivals area at the agreed meeting point, subject to the service selected and your booking details." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flight schedules don’t fit standard working hours. Our support team is available around the clock for booking enquiries and journey questions." },
      { icon: Car, title: "Vehicles for Different Travel Needs", text: "Choose from saloon cars, executive vehicles, estate cars, MPVs, and 8-seater minibuses, based on passenger and luggage needs. Gatwick carries a lot of long-haul and cruise traffic, so luggage tends to be heavy — check boot space." },
    ],
    fleet: {
      heading: "Gatwick Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Choosing the right vehicle matters when booking a taxi to Gatwick Airport or arranging a transfer from it. Consider passenger capacity and luggage space before selecting your car.",
        "We offer a range of vehicles, from everyday airport transfers to executive journeys and group transportation.",
      ],
      closing: "Choose your vehicle based on your passenger count and luggage needs. Check the details before confirming.",
      descriptions: {
        standard: "A practical choice for individuals, couples and small groups with standard luggage. Suitable for everyday airport journeys.",
        executive: "A suitable option for business travellers and passengers who prefer a premium experience. Ideal for corporate airport transfers.",
        estate: "An estate provides additional luggage space compared with a standard saloon — useful for several suitcases.",
        mpv_4seater: "A spacious option for families and small groups needing extra passenger and luggage capacity.",
        mpv: "Suitable for larger families and small groups, with additional passenger capacity. Luggage allowance depends on the number of people travelling.",
        minibus_8seater: "A convenient option for larger groups, group holidays and business transportation. Up to eight passengers with suitable luggage capacity.",
      },
      pricing: {
        heading: "Fixed Gatwick Airport Taxi Prices",
        paragraphs: [
          "Your Gatwick taxi quote is provided before you confirm your journey. Enter your pickup location, destination, travel date, and passenger requirements to check your available fare.",
          "Our pricing is designed to make airport taxi costs easier to understand, helping you compare vehicles and plan your trip.",
        ],
        cta: "Compare Gatwick Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Gatwick Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Arriving at Gatwick after a long flight? Pre-booking your Gatwick Airport taxi makes the next part of your journey easier.",
        "We provide airport pickups from both North and South terminals. Give us your flight number, arrival date and destination when you book.",
      ],
      stepsHeading: "How Your Gatwick Airport Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "After landing, follow signs for passport control and baggage reclaim. Check your booking confirmation for your specific driver meeting instructions." },
        { title: "Meet your driver.", text: "If you’ve selected Meet and Greet, your driver will meet you at the agreed-upon arrival meeting point. Otherwise, follow the pickup instructions supplied with your booking." },
        { title: "Head to your destination.", text: "Once you’ve met your driver, continue to your home, hotel, business address or another UK destination." },
      ],
      dropHeading: "Gatwick Airport Drop-Off Service",
      dropText: "Travelling into Gatwick from London or elsewhere? Your driver takes you to the correct terminal drop-off area and covers the airport charge. Make sure you’ve provided the correct terminal and flight details, and allow time for traffic on the M23 and security checks.",
    },
    travelInfo: {
      heading: "Gatwick Airport Taxis and Transfers",
      lead: [
        "London Gatwick Airport is in West Sussex, about 30 miles south of Central London. It’s one of the UK’s busiest airports, with flights to many destinations. If you need to get to the airport for an early flight or need a taxi after you land, One Airport Taxi offers reliable pre-booked transfers with professional drivers, comfortable cars, and clear prices.",
        "You can book your Gatwick Airport taxi online and get Meet and Greet service, flight monitoring, and up to 60 minutes of free waiting time for pickups. When you pre-book with One Airport Taxi, the drop-off charge is already included in your fare, so you won’t have to pay extra at the airport.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Information", items: [
          "Location: London Gatwick Airport is near Crawley in West Sussex, about 30 miles south of Central London by road, depending on where you are going.",
          "Nearby London Airports: Heathrow is about 40 to 45 miles away by road. London City Airport is around 45 to 50 miles away. Luton is about 70 to 75 miles away, and Stansted is around 70 to 80 miles away. The exact distance depends on your route and terminal.",
          "Nearest Rail Link: Gatwick Airport railway station is right across from the South Terminal, making it easy to reach from the terminal building. The Gatwick Express takes you to London Victoria in about 30 minutes, and other trains connect to London and the South East.",
          "Road Access: You can reach the airport via the M23 at Junction 9, with links to the M25, A23, and other main roads. These routes connect you to London, Brighton, Crawley, and other places in the South East.",
          "Drop-Off Charge: Gatwick charges £10 for 10 minutes in its designated drop-off zones. This charge increased from £7 on 6 January 2026. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare, so you won’t have to pay anything extra at the airport.",
        ] },
        { icon: Car, title: "Driving Times to Major Cities from Gatwick Airport", items: [
          "London (Central): Approximately 1 hour 15 minutes–2 hours (30 miles).",
          "Brighton: Approximately 35–50 minutes (29 miles).",
          "Chichester: Approximately 1 hour–1 hour 25 minutes (45 miles).",
          "Portsmouth: Approximately 1 hour 15 minutes–1 hour 45 minutes (60 miles).",
          "Oxford: Approximately 1 hour 30 minutes–2 hours 10 minutes (80 miles).",
          "Distances are approximate and measured by road to central destinations. Actual journey times may vary based on your specific destination, traffic, roadworks, and chosen route.",
        ] },
      ],
      closing: "Whether you are traveling from the South Terminal or heading to Brighton via the A23, your Gatwick Airport fare is fixed at the time of booking. There are no surcharges or metered rates.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    extraSections: briefSections("gatwick", GATWICK_BRIEF),
    // The airport cards cover the CMS routes (Heathrow, Luton, Stansted); the CMS cruise section stays, as this brief has no ports.
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Stansted: {
    heroHeading: "Stansted Airport Taxi – Reliable Transfers to and from STN",
    heroSubhead: "Book your Stansted Airport taxi and lock in your fare before you travel. One Airport Taxi provides pre-booked transfers to and from Stansted from London, Essex, Cambridgeshire, and other UK towns. Our professional, licensed drivers offer a range of vehicles, including saloon cars, executive vehicles, MPVs, and 8-seater minibuses. Whether you’re traveling solo, with family, or in a group, pick the vehicle that fits your needs and book your Stansted trip with peace of mind.",
    heroCallLine: true,
    heroCallText: "Get your free instant Stansted Airport taxi quote online and plan your journey before you travel, or call our team on",
    intro: {
      heading: "Stansted Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        "Booking a reliable taxi to Stansted Airport should be easy. With One Airport Taxi, just enter your pickup and drop-off locations to see your fare before you confirm your booking.",
        "Whether you need a taxi to Stansted Airport from London, a private transfer from Harlow or Cambridge, or a taxi from Stansted Airport to your home, hotel or business address, every journey is pre-booked and tailored to your travel plans.",
        <>Stansted has a <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>single main passenger terminal</Link>, so you don’t have to worry about finding the right one. Add your flight number, and we’ll plan your pickup based on your actual arrival time. This is especially helpful at Stansted, where many flights are early in the morning or late at night.</>,
        <>Your fare is confirmed before you travel so that you can plan your transport costs without surprises. Whether it’s a single airport trip, a <Link className={linkClass} href="#vehicles">family holiday</Link>, or a <Link className={linkClass} href="/destinations">long-distance transfer</Link>, booking your Stansted journey with us is straightforward.</>,
      ],
      cta: "Get Your Stansted Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "See your fare before you confirm." },
        { title: "One main terminal", text: "No worrying about finding the right one." },
        { title: "No surprises", text: "Your fare is confirmed before you travel." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Stansted Airport Transfers?",
    benefitsSubhead: "Picking the right airport taxi service can improve your whole trip. We offer clear pricing, scheduled pickups, comfortable vehicles, and friendly customer support.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "See your journey cost before you confirm your Stansted Airport taxi booking. With our fixed fares, there’s no meter and no surprise charges. Check all fare details and included costs before you book." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We monitor your flight information to coordinate your airport pickup. If your arrival time changes, our team uses the updated information to plan your collection." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Ride with professional, licensed drivers who value punctuality, safe driving, and great customer service. Stansted is just off the M11, and our drivers know the best routes and where traffic can build up." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when you book to make your arrival smoother. Your driver will meet you in the arrivals area at the agreed spot, based on your chosen service and booking details." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flight schedules often fall outside regular working hours, especially at Stansted. Our support team is available 24/7 to help with bookings and any questions about your journey." },
      { icon: Car, title: "Vehicles for Different Travel Needs", text: "Pick from saloon cars, executive vehicles, estate cars, MPVs, and 8-seater minibuses. Whether you need a business transfer, a family airport taxi, or transport for a larger group, choose the vehicle that fits your passengers and luggage." },
    ],
    fleet: {
      heading: "Stansted Airport Taxi Fleet and Pricing",
      paragraphs: [
        "It’s important to pick the right vehicle when booking a taxi to or from Stansted Airport. Think about how many people and how much luggage you have before choosing your car.",
        "We offer a range of vehicles for different travel requirements, from everyday airport transfers to executive journeys and group transportation.",
      ],
      closing: "Choose your vehicle based on your passenger count and luggage needs. Check the vehicle details and available capacity before confirming your booking.",
      descriptions: {
        standard: "A practical choice for individuals, couples and small groups travelling with standard luggage. Suitable for everyday airport journeys and comfortable transfers to and from Stansted.",
        executive: "A suitable option for business travellers and passengers who prefer a more premium travel experience. Ideal for corporate airport transfers and professional journeys.",
        estate: "An estate car gives you more luggage space than a standard saloon, so it’s a good choice if you’re traveling with several suitcases.",
        mpv_4seater: "A spacious option for families and small groups who need additional passenger and luggage capacity. A useful choice for family holidays with extra bags.",
        mpv: "Great for bigger families and small groups, with extra room for passengers. The amount of luggage you can bring depends on how many people are traveling.",
        minibus_8seater: "This is a convenient choice for larger groups, group holidays, and business trips. It seats up to 8 passengers and offers ample luggage space, making it a popular option for Stansted group departures.",
      },
      pricing: {
        heading: "Fixed Stansted Airport Taxi Prices",
        paragraphs: [
          "Your Stansted taxi quote is provided before you confirm your journey. Enter your pickup location, destination, travel date, and passenger requirements to check your available fare.",
          "We make our pricing clear so you can easily compare vehicles and plan your journey. This is especially helpful if you’re deciding between a taxi, the Stansted Express, or airport parking.",
        ],
        cta: "Compare Stansted Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Stansted Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Arriving at Stansted after a flight? Pre-booking your Stansted Airport taxi makes the next part of your journey easier.",
        "We provide airport pickups from the terminal. Give us your flight number, arrival date and destination when you book, and we’ll plan the journey around your flight.",
      ],
      stepsHeading: "How Your Stansted Airport Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "Once you’ve landed, follow signs for passport control and baggage reclaim. Your booking confirmation has your specific driver meeting instructions." },
        MEET_DRIVER_STEP,
        { title: "Head to your destination.", text: "From there, it’s a direct trip to your home, hotel, office, or anywhere else in the UK you need to go. The first 60 minutes of waiting after you land are free, starting from your actual arrival time." },
      ],
      dropHeading: "Stansted Airport Drop-Off Service",
      dropText: "Travelling into Stansted from London or elsewhere in the UK? Your driver takes you to the terminal drop-off area and covers the airport charge. Just be sure to give us the correct flight details, and allow extra time in your schedule for possible M11 traffic and security lines.",
    },
    travelInfo: {
      heading: "Stansted Airport Taxis and Transfers",
      lead: [
        "Located in Essex, approximately 40 miles north-east of Central London, London Stansted Airport is a major international airport and an important hub for low-cost airlines, serving numerous destinations across Europe and beyond. Whether you are travelling to the airport for an early flight or need a taxi after landing, One Airport Taxi provides reliable pre-booked airport transfers with professional drivers, comfortable vehicles and clear pricing.",
        "Book online for a reliable Stansted Airport taxi with Meet and Greet service, flight monitoring, and up to 60 minutes of free waiting time for airport pickups. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare so that you won’t incur any extra charges at the airport.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Information", items: [
          "Location: London Stansted Airport is situated in Essex, approximately 40 miles from Central London by road, depending on your destination.",
          "Nearby London Airports: London City Airport is approximately 34 miles away by road, while Luton Airport is around 54–59 miles away. Heathrow Airport is approximately 60–64 miles away. Distances vary according to the route and terminal.",
          "Nearest Rail Link: Stansted Airport railway station is located directly beneath the terminal building, just a two-minute walk away. The Stansted Express provides direct services to London Liverpool Street in approximately 48 minutes.",
          "Road Access: The airport is accessible via the M11 at Junction 8 and the A120. These routes provide connections towards London, Cambridge, Colchester and the A12 for journeys across Essex and other parts of the UK.",
          "Airport Drop-off Charge: London Stansted Airport charges £10 for up to 15 minutes in the Express Set Down area, increasing to £28 for stays over 15 minutes. The maximum stay is 30 minutes. Payment must be made online by midnight on the day after your visit.",
        ] },
        { icon: Car, title: "Driving Times to Major Cities from Stansted Airport", items: [
          "London (Central): Approximately 1 hour 10 minutes–1 hour 55 minutes (40–47 miles).",
          "Cambridge: Approximately 35–50 minutes (30 miles).",
          "Colchester: Approximately 40–55 minutes (33 miles).",
          "Ipswich: Approximately 1 hour–1 hour 25 minutes (49–50 miles).",
          "Norwich: Approximately 1 hour 40 minutes without traffic (84 miles).",
          "Distances shown are approximate and measured by road to central destinations. Your journey time can change depending on your exact destination, traffic, roadworks, and the route you take.",
        ] },
      ],
      closing: "If you have an early-morning flight or are coming back to Essex after your trip, One Airport Taxi makes booking your Stansted Airport transfer easy. You can see your fare before you book, choose the right vehicle for your group and luggage, and plan your journey. With fixed prices, professional drivers, and simple airport pickup, we want every trip to be comfortable and stress-free.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    extraSections: briefSections("stansted", STANSTED_BRIEF),
    // The airport cards cover the CMS routes; the CMS cruise section stays, as this brief has no ports.
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Luton: {
    heroHeading: "Luton Airport Taxi – Reliable Transfers to and from LTN",
    heroSubhead: "Book your Luton Airport taxi and lock in your fare before you travel. One Airport Taxi offers pre-booked transfers from London, Bedfordshire, Hertfordshire, and towns across the UK. Our professional, licensed drivers operate a range of vehicles, including saloon cars, executive vehicles, MPVs, and 8-seater minibuses. Whether you’re traveling alone, with family, or in a group, choose the vehicle that best suits your needs and book your journey to Luton with confidence.",
    heroCallLine: true,
    heroCallText: "Get a free, instant quote for your Luton Airport taxi online and plan your journey, or call our team on",
    intro: {
      heading: "Luton Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        "Booking a reliable taxi to Luton Airport should be simple. With One Airport Taxi, enter your pickup and drop-off locations to see your fare before you confirm your booking. If you need a taxi to Luton Airport from London, a private transfer from St Albans or Milton Keynes, or a ride from Luton Airport to your home, hotel, or business address, every journey is pre-booked and tailored to your plans.",
        <>Luton has a <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>single main passenger terminal</Link>, making things straightforward. Add your flight number when you book, and we’ll plan your pickup based on your actual arrival time. Your fare is confirmed before you travel so that you can budget with confidence. There’s no meter running and no surge pricing, even when the roads are busy. Whether it’s a single airport trip, a <Link className={linkClass} href="#vehicles">family holiday</Link>, or a <Link className={linkClass} href="/destinations">long-distance transfer</Link>, booking with us is easy.</>,
      ],
      cta: "Get Your Luton Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "See your fare before you confirm." },
        { title: "One main terminal", text: "Making things straightforward." },
        { title: "No meter, no surge", text: "Even when the roads are busy." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Luton Airport Transfers?",
    benefitsSubhead: "Choosing the right airport taxi service can improve your whole journey. We focus on clear pricing, planned pickups, comfortable vehicles, and helpful support.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "See your journey cost before you confirm your Luton Airport taxi booking. Our fixed fares mean no meter-based pricing and no unexpected changes. Check what’s included before you book." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We monitor your flight information to coordinate your pickup. If your arrival time shifts, our team uses the updated information to plan your collection." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Travel with licensed, background-checked drivers who know that punctuality, safe driving, and good customer service are important. Our drivers plan for the M1’s traffic to keep you on schedule." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when you book and your driver can meet you inside the arrivals area at the agreed meeting point, subject to the service selected and your booking details." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flight schedules don’t always fit standard working hours. Our support team is available 24/7 for booking enquiries and travel questions." },
      { icon: Car, title: "Vehicles for Different Travel Needs", text: "Choose from saloon cars, executive vehicles, estate cars, MPVs, and 8-seater minibuses. Whether you need a business transfer, a family airport taxi, or transport for a larger group, select the vehicle that fits your passengers and luggage." },
    ],
    fleet: {
      heading: "Luton Airport Taxi Fleet and Pricing",
      paragraphs: [
        "It’s important to choose the right vehicle when booking a taxi to or from Luton Airport. Think about both passenger capacity and luggage space before you select your car.",
        "We offer a range of vehicles to suit different travel needs, from everyday airport transfers to executive journeys and group transport.",
      ],
      closing: "Choose your vehicle based on your passenger count and luggage requirements. Check the vehicle details and available capacity before confirming your booking.",
      descriptions: {
        standard: "A practical choice for individuals, couples, and small groups with standard luggage. It’s suitable for everyday airport journeys and comfortable transfers to and from Luton.",
        executive: "A good option for business travellers and anyone who prefers a more premium travel experience. It’s ideal for corporate airport transfers and professional journeys.",
        estate: "An estate car offers more luggage space than a standard saloon, making it useful for passengers with several suitcases.",
        mpv_4seater: "A spacious choice for families and small groups needing extra space for passengers and luggage. It’s a good option for family holidays with extra bags.",
        mpv: "This option suits larger families and small groups, offering more passenger space. Luggage allowance depends on how many people are traveling.",
        minibus_8seater: "A convenient option for larger groups, group holidays, and business trips. It can carry up to eight passengers with enough space for luggage.",
      },
      pricing: {
        heading: "Fixed Luton Airport Taxi Prices",
        paragraphs: [
          "Your Luton taxi quote is provided before you confirm your journey. Enter your pickup location, destination, travel date, and passenger requirements to check your available fare.",
          "We make our pricing easy to understand, so you can compare vehicles and plan your trip. Luton is a busy airport for transfers, so booking ahead helps you get the vehicle you want.",
        ],
        cta: "Compare Luton Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Luton Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Arriving at Luton after your flight? Pre-booking your Luton Airport taxi makes the rest of your journey easier.",
        "We provide airport pickups from the terminal. Give us your flight number, arrival date, and destination when you book, and we’ll plan the journey around your flight.",
      ],
      stepsHeading: "How Your Luton Airport Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "Once you’ve landed, follow signs for passport control and baggage reclaim. Your booking confirmation has your specific driver meeting instructions." },
        MEET_DRIVER_STEP,
        { title: "Head to your destination.", text: "From there it’s a straight run to your home, hotel, office or wherever else in the UK you’re heading. The first 60 minutes of waiting after landing are free, measured from your actual arrival time." },
      ],
      dropHeading: "Luton Airport Drop-Off Service",
      dropText: "Travelling into Luton from London or elsewhere in the UK? Your driver takes you to the terminal drop-off area and covers the airport charge. Please make sure you provide the correct flight details and allow extra time in your schedule for M1 traffic and security queues.",
    },
    travelInfo: {
      heading: "Luton Airport Taxis and Transfers",
      lead: [
        "Located in Bedfordshire, approximately 32 miles north of Central London by road, London Luton Airport is one of the UK’s major international airports and an important base for low-cost airlines. Whether you are travelling to the airport for an early flight or need a taxi after landing, One Airport Taxi provides reliable pre-booked airport transfers with professional drivers, comfortable vehicles and clear pricing.",
        "Book online for a reliable Luton Airport taxi with Meet and Greet service, flight monitoring, and up to 60 minutes of free waiting time for airport pickups.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Information", items: [
          "Location: London Luton Airport is situated in Bedfordshire, approximately 32 miles by road from Central London.",
          "Nearby London Airports: Heathrow Airport is approximately 37 miles away by road, while Stansted Airport is around 54 miles away. Actual distances depend on the route and airport terminal.",
          "Nearest Rail Link: Luton Airport Parkway railway station is connected to the terminal by the Luton DART automated people mover. The journey takes less than 4 minutes, providing convenient connections to the wider rail network.",
          "Road Access: London Luton Airport is easily accessible from the M1 at Junction 10, approximately 2 miles away. The A505 provides access from the east, while the M25 connects with the M1 for journeys across London and other parts of the UK.",
          "Airport Drop-off Charge: London Luton Airport charges £9 for up to 12 minutes in its Drop-off and Pick-up Zone, followed by £1 per additional minute, with a maximum stay of 30 minutes. Payment must be made online by midnight the following day. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare so that you won’t incur any extra charges at the airport.",
        ] },
        { icon: Car, title: "Driving Times to Major Cities from Luton Airport", items: [
          "London (Central): Approximately 45 minutes–1 hour 20 minutes (32 miles).",
          "Milton Keynes: Approximately 30–45 minutes (25 miles).",
          "Cambridge: Approximately 45 minutes–1 hour 10 minutes (35 miles).",
          "Northampton: Approximately 45 minutes–1 hour 10 minutes (40 miles).",
          "Oxford: Approximately 1 hour 10 minutes–1 hour 40 minutes (50 miles).",
          "Distances are approximate road distances to central destination areas. Journey times may vary depending on your exact postcode, traffic conditions, route and roadworks.",
        ] },
      ],
      closing: "Whether you are travelling along the M1 for an early departure or returning to Bedfordshire after your trip, One Airport Taxi makes your journey straightforward. Get your fare before booking, choose a vehicle to suit your passengers and luggage, and arrange your transfer in advance. With fixed pricing, professional drivers, and convenient airport pickup, we aim to make every journey to and from Luton Airport comfortable and hassle-free.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    extraSections: briefSections("luton", LUTON_BRIEF),
    // The airport cards cover the CMS routes.
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  // A short-hop, business-heavy airport by Canary Wharf and the City: executive cars come first.
  "London City": {
    heroHeading: "London City Airport Taxi – Reliable Transfers to and from LCY",
    heroSubhead: "Book a London City Airport taxi and get a fixed fare confirmed before you travel. One Airport Taxi runs pre-booked London City Airport transfers from Canary Wharf, the City, Central London, and destinations across the UK, with professional, licensed drivers and a choice of saloon cars, executive vehicles, MPVs, and 8-seater minibuses. Whether it’s a quick business run to Docklands or a family transfer with luggage, you pick the vehicle that fits — and we handle the rest.",
    heroCallLine: true,
    heroCallText: "Get your free instant London City Airport taxi quote online and plan the journey before you travel, or call our team on",
    heroNotes: ["No account needed", "Invoice on request", "No surge pricing"],
    intro: {
      heading: "London City Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        "Arranging a reliable taxi to London City Airport should be simple, and it is. With One Airport Taxi, you book ahead, enter your pickup and drop-off, and see your fare before you confirm. Whether you need a taxi to London City Airport from the City, a transfer in from Canary Wharf or Stratford, or a cab from the airport to your home, hotel or office, every journey is pre-booked and built around your timetable.",
        <><Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>LCY is small and fast to get through</Link>, but it’s also the airport where a missed pickup hurts most — the whole point of flying from Docklands is saving time. That’s exactly why a pre-booked car beats hailing one. The price you’re quoted is the price you pay. No meter, no surge, no surprises. From a single business run to a <Link className={linkClass} href="#vehicles">group transfer</Link>, booking your London City journey with us is straightforward.</>,
      ],
      cta: "Get Your London City Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "See your fare before you confirm." },
        { title: "One terminal", text: "Small and fast to get through." },
        { title: "No meter, no surge", text: "The price you’re quoted is the price you pay." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for London City Airport Transfers?",
    benefitsSubhead: "The right airport taxi service shapes the whole journey, not just the drive. We focus on clear pricing, planned pickups, comfortable cars, and support that actually answers.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "You’ll know the cost of your London City Airport taxi before you confirm. Fixed fares mean no meter-based pricing and no last-minute changes — check exactly what’s included before you book." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We track your flight. If you land early or late, we use live arrival information to adjust your pickup — which is especially useful at LCY, where short-haul schedules can change." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Our drivers are licensed, background-checked, and know East London properly — from the A13 to the Blackwall Tunnel and the back routes when it’s busy. Punctuality and safe driving come as standard." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when you book and your driver can meet you inside arrivals at an agreed meeting point. Availability depends on the service you select and your booking details." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flights and business travel don’t keep office hours, so neither do we. Call or WhatsApp any time for booking questions or anything that comes up on the day." },
      { icon: Car, title: "Vehicles for Different Travel Needs", text: "Saloon, executive, estate, MPV or 8-seater minibus — pick based on passenger numbers and luggage. A single exec car for a City meeting, an MPV for a family arrival, a minibus for the team: all covered." },
    ],
    vehicleFirst: "executive",
    bestFor: { executive: "Best for client meetings and business travel" },
    fleet: {
      heading: "London City Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Choosing the right vehicle matters when you’re booking a taxi to London City Airport or arranging a transfer out of it. Consider both seats and suitcase space.",
        "We run a range of vehicles, from everyday airport runs to executive travel and group transport.",
      ],
      closing: "Choose your vehicle around your passenger numbers and luggage. Check the capacity details before you confirm.",
      descriptions: {
        standard: "The sensible choice for solo travellers, couples and small groups with standard luggage. Comfortable, practical, ideal for a straightforward airport transfer.",
        executive: "The most popular choice for LCY, frankly. Premium, quiet, and well-suited to corporate transfers, client pickups, and professional journeys.",
        estate: "An estate gives you noticeably more luggage room than a standard saloon — handy when you’re travelling with several suitcases.",
        mpv_4seater: "A roomier option for families and small groups who need extra space for people and bags.",
        mpv: "Suits larger families and small groups, with extra passenger capacity. Luggage allowance depends on how many of you are travelling, so check before booking.",
        minibus_8seater: "The practical answer for bigger groups, team travel and event transport. Up to eight passengers, with luggage capacity to match.",
      },
      pricing: {
        heading: "Fixed London City Airport Taxi Prices",
        paragraphs: [
          "Your quote comes before you confirm. Enter your pickup and destination, travel date, and passenger requirements to see what’s available.",
          "The pricing is set out clearly so you can compare vehicles and plan. If your plans change — an extra stop, a different pickup — the fare only changes if the journey does.",
        ],
        cta: "Compare London City Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from London City Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Landed at London City? Pre-booking your taxi takes the guesswork out of what happens next.",
        "We provide pickups from the terminal. Give us your flight number, arrival date, and destination when you book, and we’ll plan the collection around your flight.",
      ],
      stepsHeading: "How Your London City Airport Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "Once you’ve landed, follow signs for passport control and baggage reclaim. LCY is compact — you’ll be through in minutes. Your booking confirmation has your specific driver meeting instructions." },
        MEET_DRIVER_STEP,
        { title: "Head to your destination.", text: "From there it’s a straight run to your office, hotel, home or wherever else in the UK you’re heading. The first 60 minutes of waiting after landing are free, counted from your actual arrival time." },
      ],
      dropHeading: "London City Airport Drop-Off Service",
      dropText: "Travelling into LCY from London or elsewhere in the UK? Your driver takes you to the terminal drop-off area and covers the airport charge. Just make sure you’ve given the correct flight details, and leave time in your schedule for traffic through the Docklands and security queues.",
    },
    travelInfo: {
      heading: "London City Airport Taxis and Transfers",
      lead: [
        "Located in the Royal Docks in East London, London City Airport is the closest airport to central London and a convenient choice for business travellers, holidaymakers and international visitors. Whether you need a taxi to the airport or a transfer after landing, One Airport Taxi provides pre-booked airport journeys with professional drivers, comfortable vehicles and clear pricing.",
        "Book online for a reliable London City Airport taxi, with a Meet and Greet service and up to 60 minutes of free waiting time for airport pickups.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Info", items: [
          "Nearest London Airports: Heathrow Airport (around 26 miles by road) and Gatwick Airport (around 49 miles by road).",
          "Nearest rail: London City Airport DLR station (adjacent to terminal), with connections to Bank, Stratford, and across London.",
          "Road access: A13 for direct city access; A406 North Circular; M25 for routes across the UK.",
          "Drop-off charge: London City Airport charges £8 for the first 5 minutes in the terminal drop-off zone, followed by £1 per additional minute (up to a maximum stay of 10 minutes). If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fixed fare, so you won’t face any unexpected charges at the airport.",
        ] },
        { icon: Car, title: "Driving Times to Major Cities", items: [
          "London (City Centre): Approximately 20–40 minutes (5–10 miles).",
          "Oxford: Approximately 1 hour 45 minutes–2 hours 15 minutes (70–80 miles).",
          "Cambridge: Approximately 1 hour 20 minutes–1 hour 40 minutes (55–65 miles).",
          "Brighton: Approximately 1 hour 30 minutes–2 hours (60–75 miles).",
          "Southampton: Approximately 1 hour 45 minutes–2 hours 15 minutes (around 85 miles).",
          "Distances are approximate road distances to central destinations. Journey times may vary depending on traffic, roadworks and your chosen route.",
        ] },
      ],
      closing: "If you’re going to London City Airport for a flight or heading home after you land, One Airport Taxi gives you upfront pricing with no hidden fees or sudden price increases. You can plan your trip and travel without stress.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    finalHeading: "Landing at London City? Your driver's ready.",
    finalChip: "Executive cars",
    extraSections: briefSections("london-city", LONDON_CITY_BRIEF),
    // The airport cards cover the CMS routes.
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Southend: {
    heroHeading: "Southend Airport Taxi – Reliable Transfers to and from SEN",
    heroSubhead: "Book your Southend Airport taxi and lock in your fare before you travel. One Airport Taxi offers pre-booked transfers from London, Essex, and towns across the UK. Our professional, licensed drivers can pick you up in a saloon car, executive vehicle, MPV, or 8-seater minibus. Whether you’re traveling for business, with family, or as a group, pick the vehicle that suits your passengers and luggage. We’ll handle the driving.",
    heroCallLine: true,
    heroCallText: "Get your free instant Southend Airport taxi quote online and have the whole journey sorted before you travel, or call our team on",
    intro: {
      heading: "Southend Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        <>Sorting a reliable cab to Southend Airport shouldn’t be a last-minute scramble. With One Airport Taxi, you book ahead, enter your pickup and drop-off locations, and see the price before you commit. So whether you need a <Link className={linkClass} href={`#${BRIEF_DESTINATIONS_ID}`}>taxi to Southend Airport from London</Link>, a transfer in from Chelmsford or Basildon, or a taxi from Southend Airport to your home, hotel or office, every journey is pre-booked and planned around your schedule.</>,
        <>London Southend Airport has <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>one compact terminal</Link>, making pickups refreshingly simple. There’s no confusion about which terminal or long walks. Add your flight number when you book, and we’ll plan your collection based on your actual arrival. The fare you’re quoted is exactly what you’ll pay. There’s no meter, no surge pricing, and no surprises at your destination. Whether it’s a short airport trip or a long-distance transfer, booking your Southend journey with <Link className={linkClass} href="#vehicles">our fleet</Link> is simple.</>,
      ],
      cta: "Get Your Southend Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "See the price before you commit." },
        { title: "One compact terminal", text: "No confusion about which terminal." },
        { title: "No meter, no surge", text: "The fare you’re quoted is exactly what you’ll pay." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Southend Airport Transfers?",
    benefitsSubhead: "The right airport transfer service shapes the whole journey, not just the drive. We focus on clear pricing, scheduled pickups, comfortable cars, and support that actually answers the phone.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "You’ll know the cost of your Southend Airport taxi before you confirm. Our fixed-fare approach means no meter-based pricing and no last-minute changes. You can check exactly what’s included before you book." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We track your flight. If you land early or late, our team uses live arrival information to adjust your pickup. This way, your driver isn’t left waiting, and you won’t have to search for your car outside." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Our drivers are licensed, background-checked, and know the Essex roads properly. Punctuality, safe driving, and good manners aren’t optional extras." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when you book and your driver can meet you inside the arrivals area at an agreed meeting point. Availability depends on the service you select and your booking details." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flights don’t stick to office hours, and neither do we. Call or WhatsApp us any time. You’ll always reach a real person, not an automated queue." },
    ],
    benefitsClosing: "Choose from a saloon, executive, estate, MPV, or 8-seater minibus, depending on how many people are traveling and how much luggage you have. Whether it’s a business trip, family holiday, or group transfer, we have a vehicle to suit your needs.",
    fleet: {
      heading: "Southend Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Choosing the right vehicle matters when you’re booking a taxi to Southend Airport or arranging a transfer out of it. Think about seats and suitcase space before you choose.",
        "We run a range of vehicles, from everyday airport runs to executive travel and group transport.",
      ],
      closing: "Choose your vehicle around your passenger numbers and luggage. Check the capacity details before you confirm.",
      descriptions: {
        ...VEHICLE_TEXT,
        standard: "The sensible choice for solo travellers, couples and small groups with standard luggage. Comfortable, practical, ideal for a straightforward airport transfer.",
        estate: "An estate car gives you noticeably more luggage room than a standard saloon. This is helpful if you’re traveling with several suitcases.",
        minibus_8seater: "This is a practical choice for bigger groups, group holidays, and business transport. It fits up to 8 passengers and their luggage. It’s ideal when you’d otherwise need two cabs.",
      },
      pricing: {
        heading: "Fixed Southend Airport Taxi Prices",
        paragraphs: [
          "Your quote comes before you confirm. Enter your pickup, destination, travel date, and passenger requirements to see what’s available.",
          "Our pricing is clear, so you can compare vehicles and plan without dealing with fine print. If your plans change, like adding an extra stop or changing your pickup, the fare only changes if the journey does.",
        ],
        cta: "Compare Southend Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Southend Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Landed at Southend after a flight? Pre-booking your taxi takes the guesswork out of what happens next.",
        "We provide pickups from the terminal. Give us your flight number, arrival date, and destination when you book, and we’ll plan the collection around your flight.",
      ],
      stepsHeading: "How Your Southend Airport Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "Once you’ve landed, follow the signs for passport control and baggage reclaim. Southend is small, so you’ll get through quickly. Your booking confirmation includes your specific driver meeting instructions." },
        MEET_DRIVER_STEP,
        { title: "Head to your destination.", text: "From there, it’s a direct trip to your home, hotel, office, or anywhere else in the UK you’re going. The first 60 minutes of waiting after you land are free, starting from your actual arrival time." },
      ],
      dropHeading: "Southend Airport Drop-Off Service",
      dropText: "Travelling into Southend from London or elsewhere in the UK? Your driver takes you to the terminal drop-off area and covers the airport charge. Just make sure you’ve provided the correct flight details, and leave time in your schedule for traffic and security.",
    },
    final: {
      heading: "Book Your Southend Airport Taxi with One Airport Taxi",
      paragraphs: [
        "If you need a taxi to Southend Airport, a ride from the airport to your destination, or a long-distance transfer, One Airport Taxi makes it easy to plan your trip.",
        <>Pick your vehicle, enter your travel details, and check your fare before you book. With pre-booked transfers, licensed drivers, flight tracking, and <Link className="font-semibold text-white underline underline-offset-4" href="/Contact-Us">24/7 support</Link>, we make your Southend Airport trip comfortable, reliable, and easy.</>,
      ],
      tagline: "You’ll know your price before your journey begins.",
    },
    comfortOrder: 75,
    extraSections: briefSections("southend", SOUTHEND_BRIEF),
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Southampton: {
    heroHeading: "Southampton Airport Taxi – Reliable Transfers to and from SOU",
    heroSubhead: "Book a Southampton Airport taxi and know your fare before you even leave the house. One Airport Taxi offers pre-booked Southampton Airport transfers for passengers flying out, landing back in, or simply moving between the airport and the city, with professional, licensed drivers and a choice of saloon cars, executive vehicles, MPVs, 8-seater minibuses, and wheelchair-accessible vehicles. Whether you’re heading off on a short-haul city break or arriving back tired after a long one, pick the vehicle that suits your group and your luggage, and let someone else do the driving.",
    heroCallLine: true,
    heroCallText: "Get your free instant Southampton Airport taxi quote online and have the journey sorted before you travel, or call our team on",
    intro: {
      heading: "Southampton Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        "Finding a dependable taxi to Southampton Airport shouldn’t mean waiting on a street corner hoping one turns up. With One Airport Taxi, you book in advance, enter your pickup and drop-off details, and see the price before you confirm.",
        "So whether you need a taxi to Southampton Airport from the city centre, a transfer in from Winchester or Eastleigh, or a taxi from Southampton Airport to your home, hotel or business address, every journey is pre-booked and built around your actual travel plans — not a queue at a taxi rank.",
        <>Southampton Airport is one of the UK’s smaller, more manageable regional airports, with <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>a single terminal and a railway station right outside</Link>. That makes pickups and drop-offs straightforward. Add your flight number when you book, and we’ll plan your collection around your real arrival time, not the scheduled one.</>,
        <>The fare you’re quoted is the fare you pay, whether you’re booking an everyday airport taxi service in Southampton or a longer transfer to Heathrow or Gatwick. No meter, no last-minute mark-up. From a routine airport run to a <Link className={linkClass} href="/destinations/southampton-taxi">cruise terminal connection</Link>, booking with us is simple from the start.</>,
      ],
      cta: "Get Your Southampton Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "See the price before you confirm." },
        { title: "One terminal", text: "A railway station right outside." },
        { title: "No meter, no mark-up", text: "The fare you’re quoted is the fare you pay." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Southampton Airport Transfers?",
    benefitsSubhead: "A good airport transfer service shapes the whole trip, not just the drive itself. We focus on clear pricing, planned pickups, comfortable cars, and support that’s actually there when you need it.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "You’ll know the cost of your Southampton Airport taxi before you confirm the booking. Our fixed-fare approach means no meter-based pricing and no surprise extras — check exactly what’s included before you book." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We track your flight. If your arrival time shifts, our team adjusts your pickup based on live information, so you’re not left waiting, and your driver isn’t guessing." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Our drivers are licensed, properly checked, and know the routes around Southampton, the cruise terminals, and the wider Hampshire area well. Punctuality and safe driving come as standard." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when you book and your driver will meet you inside the arrivals area at an agreed point. Availability depends on the service selected and your booking details." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flights and cruise ships don’t run to office hours, so neither do we. Reach a real person any time, day or night." },
      { icon: Accessibility, title: "Vehicles for Different Travel Needs, Including Wheelchair Access", text: "Saloon, executive, estate, MPV, 8-seater minibus or wheelchair-accessible taxi — choose based on your passengers, luggage, and any accessibility needs. If you need a wheelchair accessible taxi in Southampton, let us know when booking so we can arrange the right vehicle." },
    ],
    fleet: {
      heading: "Southampton Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Picking the right vehicle matters whether you’re booking a taxi to Southampton Airport, a cruise terminal transfer, or a longer run to another UK airport. Think about seats and suitcase space together.",
        "We run a range of vehicles, from everyday airport taxis to executive travel, group transport and accessible vehicles.",
        <><strong>Wheelchair Accessible Taxi:</strong> a dedicated wheelchair-accessible taxi is available for passengers who need it. <Link className={linkClass} href="/Contact-Us">Let us know your requirements</Link> when booking so that the right vehicle and equipment can be arranged in advance.</>,
      ],
      closing: "Choose your vehicle based on your passenger numbers, luggage, and any accessibility needs. Check availability before you confirm.",
      descriptions: {
        standard: "The practical choice for solo travellers, couples and small groups with standard luggage. Comfortable and straightforward for everyday Southampton airport transfers.",
        executive: "For business travellers and anyone who prefers a more premium ride to or from the airport or cruise terminal.",
        estate: "Extra boot space compared with a standard saloon — useful if you’re travelling with several suitcases or sports equipment.",
        mpv_4seater: "More room for families and small groups who need extra space for passengers and luggage, including cruise passengers travelling with larger cases.",
        mpv: "Suits larger families and small groups. Luggage allowance depends on the number of passengers, so check before booking.",
        minibus_8seater: "The practical option for bigger groups, cruise send-offs and business transport. Up to eight passengers, with luggage capacity to match.",
      },
      pricing: {
        heading: "Fixed Southampton Airport Taxi Prices",
        paragraphs: [
          "Your quote comes before you confirm. Enter your pickup and destination, travel date, and passenger requirements to see your available fare, whether that’s a short airport transfer or a longer run to Heathrow or Bournemouth Airport.",
          "Our pricing is designed to be easy to compare, so you know what a cheap Southampton airport taxi should actually cost before you book one.",
        ],
        cta: "Compare Southampton Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Southampton Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Landed at Southampton after a flight? Pre-booking your taxi from Southampton Airport means one less thing to think about after a tiring journey.",
        "We provide airport pickups from the terminal. Share your flight number, arrival date, and destination when booking, and we’ll plan your collection around your actual flight.",
      ],
      stepsHeading: "How Your Southampton Airport Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "After landing, follow the signs for baggage reclaim and the exit. Your booking confirmation has your specific driver meeting instructions." },
        MEET_DRIVER_STEP,
        { title: "Continue to your destination.", text: "From there, it’s a straight run to your home, hotel, office or cruise terminal, or further afield if you’re continuing your journey." },
      ],
      dropHeading: "Southampton Airport Drop-Off Service",
      dropText: "Travelling into Southampton Airport from elsewhere in the UK? Your driver takes you to the terminal drop-off area, with time allowed for traffic and check-in.",
    },
    travelInfo: {
      heading: "Southampton Airport Taxis and Transfers",
      lead: [
        "Located in Eastleigh, Hampshire, approximately 4 miles from Southampton city centre, Southampton Airport is a convenient gateway for passengers travelling across Hampshire, Dorset and the South Coast. Whether you need a taxi to Southampton Airport for an upcoming flight or a transfer after landing, One Airport Taxi provides pre-booked airport journeys with professional drivers, comfortable vehicles and transparent pricing.",
        "Book online for a reliable Southampton Airport taxi with a Meet and Greet service, flight monitoring and up to 60 minutes of free waiting time for airport pickups. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare so that you won’t incur any extra charges at the airport.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Information", items: [
          "Nearby airports: Bournemouth Airport (around 31 miles), Heathrow Airport (approximately 65–70 miles) and Gatwick Airport (around 88 miles).",
          "Nearest rail: Southampton Airport Parkway railway station is located directly beside the terminal, providing connections to Southampton, Winchester, London and other destinations.",
          "Road access: M27 Junction 5 provides access to the airport, with connections to the M3, A27 and A31 for journeys across Hampshire, Dorset and the wider UK.",
          "Airport drop-off charge: Southampton Airport’s designated drop-off and pick-up area is located in the short-stay car park, approximately a one-minute walk from the terminal. The published charge is £7 for 20 minutes. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare so that you won’t incur any extra charges at the airport.",
        ] },
        { icon: Car, title: "Driving Times to Major Cities", items: [
          "Southampton City Centre: Approximately 15–25 minutes (4–5 miles).",
          "Winchester: Approximately 20–30 minutes (12–14 miles).",
          "Portsmouth: Approximately 35–50 minutes (20–22 miles).",
          "Bournemouth: Approximately 40–60 minutes (35–40 miles).",
          "Salisbury: Approximately 40–55 minutes (25–30 miles).",
          "London: Approximately 1 hour 30 minutes–2 hours (75–80 miles).",
          "Distances are approximate road distances to central destinations. Journey times may vary depending on traffic, roadworks, your exact pickup or drop-off location and the route taken.",
        ] },
      ],
      closing: "Whether you’re travelling to Southampton Airport for a flight or heading home after landing, One Airport Taxi makes arranging your airport transfer straightforward. Get your fare before booking, choose a suitable vehicle for your passengers and luggage, and enjoy a comfortable journey with professional drivers and transparent pricing.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    extraSections: briefSections("southampton", SOUTHAMPTON_BRIEF),
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Bournemouth: {
    heroHeading: "Bournemouth Airport Taxi – Reliable Transfers to and from BOH",
    heroSubhead: "Book a Bournemouth Airport taxi and get a fixed fare agreed in advance. One Airport Taxi operates pre-booked Bournemouth Airport transfers across Dorset and the wider UK, with professional, licensed drivers and a choice of saloon cars, executive vehicles, MPVs, 8-seater minibuses, and wheelchair-accessible vehicles. Whether you’re flying off on holiday from Dorset or landing back after one, choose the vehicle that fits your passengers and luggage, and skip the queue at the taxi rank.",
    heroCallLine: true,
    heroCallText: "Get your free instant Bournemouth Airport taxi quote online and have your journey arranged before you travel, or call our team on",
    intro: {
      heading: "Bournemouth Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        "Booking a reliable taxi to Bournemouth Airport shouldn’t involve guesswork over the price. With One Airport Taxi, you plan, enter your pickup and drop-off details, and see your fare before you confirm.",
        "So whether you need a taxi to Bournemouth Airport from Poole or Christchurch, a transfer in from further afield in Dorset, or a taxi from Bournemouth Airport to your home, hotel or office, every journey is pre-booked and planned around your schedule.",
        <>Bournemouth Airport is a small, easy-to-use regional airport with <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>a single terminal</Link>, which keeps pickups and drop-offs simple. Add your flight details when you book, and we’ll time your collection to your actual arrival.</>,
        <>The fare you’re quoted is the fare you pay — a cheaper and more predictable option than hunting for the cheapest taxi to Bournemouth Airport on the day and hoping for the best. From a routine airport run to a longer transfer to Gatwick or Southampton, booking with <Link className={linkClass} href="#vehicles">our fleet</Link> is straightforward.</>,
      ],
      cta: "Get Your Bournemouth Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "See your fare before you confirm." },
        { title: "One terminal", text: "Pickups and drop-offs stay simple." },
        { title: "No guesswork", text: "The fare you’re quoted is the fare you pay." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Bournemouth Airport Transfers?",
    benefitsSubhead: "The right airport transfer service shapes the whole journey, not just the drive. We focus on clear pricing, planned pickups, comfortable vehicles, and support that’s genuinely available when you need it.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "You’ll know the cost of your Bournemouth Airport taxi before you confirm. Our fixed-fare approach means no meter-based pricing and no last-minute changes — check what’s included before you book." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We track your flight. If your arrival time changes, our team adjusts your pickup based on live information, so you’re not left standing outside waiting on a car that hasn’t been told you’ve landed early." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Our drivers are licensed, properly checked, and know Dorset’s roads well, from the airport out to Poole, Christchurch and beyond. Punctuality and safe driving come as standard." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when you book and your driver can meet you inside the arrivals area at an agreed point, depending on the service selected." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flights don’t keep office hours, so neither do we. Call or message anytime with booking questions or help on the day." },
      { icon: Accessibility, title: "Vehicles for Different Travel Needs", text: "Saloon, executive, estate, MPV, 8-seater minibus or a wheelchair-accessible taxi — choose based on your passengers, luggage and any accessibility requirements." },
    ],
    fleet: {
      heading: "Bournemouth Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Choosing the right vehicle matters when booking a taxi to Bournemouth Airport or arranging a transfer from it. Weigh up seats and luggage space together before you choose.",
        "We run a range of vehicles, from everyday airport runs to executive travel, group transport and accessible vehicles.",
        <><strong>Wheelchair Accessible Taxi:</strong> a wheelchair-accessible taxi is available for passengers who need one — <Link className={linkClass} href="/Contact-Us">let us know your requirements</Link> when booking so the right vehicle can be arranged in advance.</>,
      ],
      closing: "Choose your vehicle around your passenger numbers and luggage. Check availability before you confirm.",
      descriptions: {
        standard: "The sensible choice for solo travellers, couples and small groups with standard luggage. Comfortable and practical for a straightforward Bournemouth airport transfer.",
        executive: "For business travellers and anyone who prefers a more premium journey to or from the airport.",
        estate: "More boot space than a standard saloon — useful when you’re travelling with several suitcases or bulkier luggage.",
        mpv_4seater: "A roomier option for families and small groups who need extra space for people and bags.",
        mpv: "Suits larger families and small groups, with extra passenger capacity. Luggage allowance depends on the number of travellers, so check before booking.",
        minibus_8seater: "The practical answer for larger groups, group holidays, and business travel. Up to eight passengers, with luggage capacity to match.",
      },
      pricing: {
        heading: "Fixed Bournemouth Airport Taxi Prices",
        paragraphs: [
          "Your quote comes before you confirm. Enter your pickup, destination, travel date and passenger requirements to see your available fare — including longer transfers such as Bournemouth to Gatwick or Bournemouth to Southampton Airport.",
          "Pricing is laid out clearly so you can compare vehicles and avoid overpaying for a last-minute taxi to the airport.",
        ],
        cta: "Compare Bournemouth Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Bournemouth Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Landed at Bournemouth after a flight? Pre-booking your taxi takes the uncertainty out of what happens next.",
        "We provide pickups from the terminal. Share your flight number, arrival date, and destination when booking, and we’ll plan your collection around your flight.",
      ],
      stepsHeading: "How Your Bournemouth Airport Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "After landing, follow the signs for baggage reclaim and the exit. Your booking confirmation has your specific driver meeting instructions." },
        MEET_DRIVER_STEP,
        { title: "Continue to your destination.", text: "From there, it’s a straight run to your home, hotel, office or wherever else in the UK you’re heading." },
      ],
      dropHeading: "Bournemouth Airport Drop-Off Service",
      dropText: "Travelling into Bournemouth Airport from elsewhere in the UK? Your driver takes you to the terminal drop-off area, with time allowed for traffic and check-in.",
    },
    travelInfo: {
      heading: "Bournemouth Airport Taxis and Transfers",
      lead: [
        "Located in Hurn, Dorset, approximately 4 miles northeast of Bournemouth town centre, Bournemouth Airport is a convenient gateway for passengers travelling across Dorset, Hampshire and the South Coast. Whether you need a taxi to Bournemouth Airport for an upcoming flight or a transfer after landing, One Airport Taxi provides pre-booked airport journeys with professional drivers, comfortable vehicles and transparent pricing.",
        "Book online for a reliable Bournemouth Airport taxi with Meet and Greet service, flight monitoring and up to 60 minutes of free waiting time for airport pickups. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare so that you won’t incur any extra charges at the airport.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Information", items: [
          "Nearby airports: Southampton Airport (around 30 miles), Bristol Airport (approximately 70–80 miles) and Heathrow Airport (around 90 miles).",
          "Nearest railway station: Bournemouth railway station, around 5–6 miles from the airport.",
          "Road access: Convenient access via the B3073, A338 and A31, connecting the airport with Bournemouth, Poole, Christchurch and surrounding areas.",
          "Airport drop-off: Check the airport’s latest drop-off arrangements before travelling. Your pre-booked One Airport Taxi fare includes the applicable drop-off charge.",
        ] },
        { icon: Car, title: "Driving Times to Major Towns and Cities", items: [
          "Bournemouth Town Centre: 10–20 minutes (around 7 miles).",
          "Poole: 20–30 minutes (10–12 miles).",
          "Christchurch: 10–20 minutes (around 4 miles).",
          "Wimborne: 15–25 minutes (8–10 miles).",
          "Southampton: 40–60 minutes (around 29 miles).",
          "Salisbury: 40–55 minutes (25–30 miles).",
          "London: 2–2.5 hours (approximately 105–115 miles).",
          "Journey times are estimates and may vary depending on traffic, road conditions and your destination.",
        ] },
      ],
      closing: "With One Airport Taxi, you can arrange a Bournemouth Airport transfer to suit your travel plans. Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater vehicles for individual travellers, families and larger groups. Your fare is confirmed before travel, helping you plan your journey with confidence.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    extraSections: briefSections("bournemouth", BOURNEMOUTH_BRIEF),
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Oxford: {
    heroHeading: "Oxford Airport Taxi – Reliable Transfers to and from OXF",
    heroSubhead: "Book an Oxford Airport taxi or arrange a private transfer between Oxford and the UK’s major airports. One Airport Taxi offers pre-booked Oxford airport transfers with professional, licensed drivers and a choice of saloon cars, executive vehicles, MPVs, and 8-seater minibuses. Whether you’re flying from Oxford Airport itself or need a taxi from Oxford to Heathrow, Gatwick, Luton or Birmingham Airport, choose the vehicle that suits your passengers and luggage, and have the fare agreed before you set off.",
    heroCallLine: true,
    heroCallText: "Get your free instant Oxford Airport taxi quote online and have the journey planned before you travel, or call our team on",
    intro: {
      heading: "Oxford Airport Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        "Arranging a reliable airport transfer in Oxford shouldn’t mean checking three different bus timetables and still not knowing what you’ll pay. With One Airport Taxi, you book ahead, enter your pickup and drop-off details, and see your fare before you confirm anything.",
        <>Most Oxford journeys aren’t to <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>Oxford (London) Airport</Link> itself but between Oxford and Heathrow, Gatwick, Luton, Stansted or Birmingham Airport — and that’s exactly where we specialise. Whether you need a taxi from Oxford to Heathrow, from Heathrow to Oxford, or from Oxford to Luton Airport, every journey is pre-booked and planned around your flight, not a fixed bus schedule.</>,
        "Add your flight number when you book, and we’ll track it, so your pickup time adjusts automatically if your flight runs early or late.",
        <>The fare you’re quoted is the fare you pay. Compare that to the uncertainty of the Oxford-to-Heathrow bus or coach — no waiting at a stop, and no guessing what a taxi from Oxford to Heathrow will actually cost until you’re already in the cab. See <Link className={linkClass} href="#vehicles">our fleet</Link> and <Link className={linkClass} href="/destinations/oxford-taxi">our Oxford taxi guide</Link>.</>,
      ],
      cta: "Get Your Oxford Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "See your fare before you confirm anything." },
        { title: "Planned around your flight", text: "Not a fixed bus schedule." },
        { title: "Flight tracked", text: "Your pickup adjusts if your flight runs early or late." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Oxford Airport Transfers?",
    benefitsSubhead: "A good airport transfer service shapes the whole journey, not just the drive. We focus on clear pricing, planned pickups, comfortable cars, and support that’s actually available when you need it.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "You’ll know the cost of your Oxford airport transfer before you confirm, whether that’s a short hop to Oxford Airport or a longer run to Heathrow Terminal 5 or Luton. No meter, no surprises." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We track your flight. If your arrival or departure time changes, our team adjusts your pickup using the live information." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Our drivers are licensed, properly checked, and know the routes between Oxford and every major London airport well — including the M40, A34 and M25 connections." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when you book and your driver can meet you inside the arrivals area at an agreed point, subject to the service selected." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flights don’t run to office hours, so neither do we. Reach a real person any time, day or night." },
      { icon: Car, title: "Vehicles for Different Travel Needs", text: "Saloon, executive, estate, MPV or 8-seater minibus — choose based on your passengers and luggage, whether you’re a solo business traveller or a family heading off on holiday." },
    ],
    fleet: {
      heading: "Oxford Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Choosing the right vehicle matters whether you’re booking a short taxi to Oxford Airport or a longer transfer to Heathrow, Gatwick or Luton. Think about both passenger numbers and luggage space.",
        "We run a range of vehicles, from everyday airport runs to executive travel and group transport.",
      ],
      closing: "Choose your vehicle around your passenger numbers and luggage. Check availability before you confirm.",
      descriptions: {
        standard: "The sensible choice for solo travellers, couples and small groups with standard luggage. Comfortable and practical for a straightforward transfer.",
        executive: "For business travellers and anyone who prefers a more premium ride — a popular option for Oxford-to-Heathrow business transfers.",
        estate: "More boot space than a standard saloon, useful when you’re travelling with several suitcases.",
        mpv_4seater: "A roomier option for families and small groups who need extra space for people and bags.",
        mpv: "Suits larger families and small groups, with extra passenger capacity. Luggage allowance depends on the number of travellers.",
        minibus_8seater: "The practical option for larger groups, group holidays, and business travel. Up to eight passengers, with luggage capacity to match.",
      },
      pricing: {
        heading: "Fixed Oxford Airport Taxi Prices",
        paragraphs: [
          "Your quote comes before you confirm. Enter your pickup, destination, travel date, and passenger requirements to see your available fares — whether that’s an Oxford to Heathrow taxi fare, an Oxford to Luton Airport taxi fare, or a transfer to Birmingham Airport.",
          "Our pricing is laid out clearly, so you can compare the actual cost of a taxi with the time and hassle of the Heathrow-to-Oxford bus or National Express coach.",
        ],
        cta: "Compare Oxford Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Heathrow (and Other Airports) to Oxford – Meet Your Driver and Travel with Confidence",
      lead: [
        "Landed at Heathrow, Gatwick, Luton, Stansted or Birmingham and heading to Oxford? Pre-booking your taxi from the airport to Oxford means one less thing to think about after a long flight.",
        "Give us your flight number, arrival date and destination when booking, and we’ll plan your collection around your actual flight.",
      ],
      stepsHeading: "How Your Airport-to-Oxford Pickup Works",
      steps: [
        PICKUP_STEP_ONE,
        { title: "Follow the arrival signs.", text: "After landing, follow the signs for baggage reclaim and the exit. Your booking confirmation has your specific driver meeting instructions." },
        MEET_DRIVER_STEP,
        { title: "Continue to Oxford.", text: "From there, it’s a direct run to your home, college, hotel or business address in Oxford or the surrounding area." },
      ],
      dropHeading: "Oxford Drop-Off Service",
      dropText: "Travelling from Oxford to an airport? Your driver takes you directly to the correct terminal, with time built in for traffic on the M40 or M25 and for check-in and security.",
    },
    travelInfo: {
      heading: "Oxford Airport Taxis and Transfers",
      lead: [
        "Located in Kidlington, approximately 7 miles north of Oxford city centre, London Oxford Airport is a convenient airport for private aviation, business travellers and passengers using charter flights. Whether you need a taxi to Oxford Airport or a transfer after landing, One Airport Taxi provides pre-booked airport journeys with professional drivers, comfortable vehicles and transparent pricing.",
        "Book online for a reliable Oxford Airport taxi, with a Meet and Greet service and up to 60 minutes of free waiting time for airport pickups.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Information", items: [
          "Nearby airports: Birmingham Airport (around 62 miles), Heathrow Airport (approximately 50–60 miles) and London Luton Airport (around 69 miles).",
          "Nearest railway station: Oxford Parkway, around 3.5 miles from the airport, with connections to Oxford and London Marylebone.",
          "Road access: Convenient access via the A44, A34 and A40, connecting the airport with Oxford, the Cotswolds and surrounding areas.",
          "Airport drop-off: Check the airport’s latest drop-off arrangements before travelling. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare so that you won’t incur any extra charges at the airport.",
        ] },
        { icon: Car, title: "Driving Times to Major Cities", items: [
          "Oxford City Centre: Approximately 20–30 minutes (around 10 miles).",
          "Bicester: Approximately 20–30 minutes (around 10 miles).",
          "Witney: Approximately 20–30 minutes (around 10 miles).",
          "Abingdon: Approximately 25–40 minutes (15–18 miles).",
          "Banbury: Approximately 30–45 minutes (around 18 miles).",
          "Birmingham: Approximately 1 hour 15 minutes–1 hour 40 minutes (65–75 miles).",
          "London: Approximately 1 hour 15 minutes–1 hour 50 minutes (55–65 miles).",
          "Distances are approximate road distances to central destinations. Journey times may vary depending on traffic, roadworks and your chosen route.",
        ] },
      ],
      closing: "Whether you are travelling to London Oxford Airport for a private flight, arranging transport for a business trip or heading home after landing, One Airport Taxi offers convenient pre-booked transfers with fares confirmed before travel. Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater vehicles to suit your passengers and luggage.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    extraSections: briefSections("oxford", OXFORD_BRIEF),
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Farnborough: {
    heroHeading: "Farnborough Airport Taxi – Reliable Transfers to and from Farnborough",
    heroSubhead: "Book a taxi at Farnborough Airport for a smooth, professional transfer to or from the UK’s leading business aviation airport. One Airport Taxi provides pre-booked Farnborough Airport transfers with professional licensed drivers and a choice of executive cars, saloon cars, MPVs and 8-seater minibuses, suited to the discretion and timing that private and business aviation travel demands. Whether you’re met off a private jet, travelling for a corporate meeting, or arranging transport for colleagues or clients, choose a vehicle that matches the journey.",
    heroCallLine: true,
    heroCallText: "Get your free, instant Farnborough Airport taxi quote online and arrange your transfer before you travel, or call our team on",
    heroNotes: ["No account needed", "Invoice on request", "No surge pricing"],
    intro: {
      heading: "Farnborough Airport Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        <>Farnborough Airport, formerly TAG Farnborough Airport, is the UK’s principal dedicated business aviation airport, <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>handling private jets and corporate flights</Link> rather than scheduled commercial services. That makes transfers here a little different — timings can be tighter, flexibility matters more, and discretion is often part of the brief.</>,
        <>With One Airport Taxi, you book ahead, enter your pickup and drop-off details, and see your fare before you confirm. Whether you need a Farnborough Airport taxi for an arriving private jet passenger, a transfer to a London meeting straight off the aircraft, or an <Link className={linkClass} href="#vehicles">executive car</Link> to take you to Farnborough ahead of a departure, every journey is pre-booked and planned around your schedule.</>,
        "Add your flight details when you book, including private or corporate flight information where applicable, and our team will plan the pickup around your actual arrival time rather than a published timetable.",
        "The fare you’re quoted is the fare you pay, with the professionalism and punctuality that business and private aviation transfers call for.",
      ],
      cta: "Get Your Farnborough Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "See your fare before you confirm." },
        { title: "Planned around your arrival", text: "Not a published timetable." },
        { title: "Discreet and punctual", text: "Built for business and private aviation." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Farnborough Airport Transfers?",
    benefitsSubhead: "Business aviation passengers expect a certain standard, and that shapes how we run this service. We focus on clear pricing, precise timing, professional vehicles and discreet, reliable drivers.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "You’ll know the cost of your Farnborough Airport transfer before you confirm. No meter, no last-minute changes — a fixed price agreed in advance, suited to business accounts and expense reporting." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We track flight information where it’s available, so your pickup can be adjusted if timings shift — important when private aviation schedules can move at short notice." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Our drivers are licensed, professionally presented and experienced with business and executive transfers, understanding the discretion and punctuality that corporate and private clients expect." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Add Meet and Greet when you book, and your driver can meet you at the agreed-upon point at the airport, depending on the service selected." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Private aviation doesn’t run to a fixed schedule, so neither do we. Our team is available around the clock for bookings and last-minute changes." },
      { icon: Car, title: "Executive and Group Vehicles", text: "Choose from executive cars for individual business travel, saloon cars for everyday transfers, or MPVs and 8-seater minibuses when a group of colleagues or clients is travelling together." },
    ],
    vehicleFirst: "executive",
    bestFor: { executive: "Best for corporate travel and client pickups" },
    fleet: {
      heading: "Farnborough Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Choosing the right vehicle matters for business and private aviation transfers, where the impression a journey makes can matter as much as getting there on time.",
      ],
      closing: "Choose your vehicle around the nature of the trip, your passenger numbers and luggage. Check availability before you confirm.",
      descriptions: {
        standard: "A comfortable, practical option for individual transfers and standard business journeys to or from Farnborough Airport.",
        executive: "Our most popular choice for Farnborough transfers — suited to corporate travel, client pickups and journeys where presentation matters.",
        estate: "Extra luggage space compared with a saloon, useful for business travellers with additional equipment or baggage.",
        mpv_4seater: "A practical option when a small group of colleagues or family members are travelling together.",
        mpv: "Suits larger groups travelling to or from the airport together, with capacity depending on luggage.",
        minibus_8seater: "The right choice for larger corporate groups, event transport or teams travelling together through Farnborough.",
      },
      pricing: {
        heading: "Fixed Farnborough Airport Taxi Prices",
        paragraphs: [
          "Your quote comes before you confirm. Enter your pickup and destination, travel date, and passenger requirements to see your available fare for a Farnborough Airport transfer or a longer executive journey to London or beyond.",
        ],
        cta: "Compare Farnborough Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Farnborough Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Landed at Farnborough after a private or corporate flight? Pre-booking your taxi means a smooth, well-timed pickup straight off the aircraft.",
        "Share your flight or arrival details when booking, and we’ll plan your collection around the actual arrival.",
      ],
      stepsHeading: "How Your Farnborough Airport Pickup Works",
      steps: [
        { title: "Share your flight and arrival details.", text: "Add your flight number or arrival information when you book, so we know when to expect you." },
        { title: "Our driver tracks your arrival.", text: "Where flight information is available, we monitor it to time your pickup accurately." },
        { title: "Meet your driver.", text: "If you’ve chosen Meet and Greet, your driver will be waiting at the agreed point. Otherwise, follow the pickup instructions in your confirmation." },
        { title: "Continue to your destination.", text: "From there, it’s a direct run into London, to a meeting, or to your home, hotel or office elsewhere in the UK." },
      ],
      dropHeading: "Farnborough Airport Drop-Off Service",
      dropText: "Travelling to Farnborough before departure? Your driver takes you directly to the airport, allowing time for traffic on the M3 or A331.",
    },
    travelInfo: {
      heading: "Farnborough Airport Taxis and Transfers",
      lead: [
        "Located in Farnborough, Hampshire, close to the Surrey border and approximately 35 miles southwest of central London, Farnborough Airport is a leading UK business aviation airport serving private flights, corporate travellers and charter services. Whether you need a taxi to Farnborough Airport or a transfer after landing, One Airport Taxi provides pre-booked airport journeys with professional drivers, comfortable vehicles and transparent pricing.",
        "Book online for a reliable Farnborough Airport taxi, with a Meet and Greet service and up to 60 minutes of free waiting time for airport pickups.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Information", items: [
          "Nearby airports: Heathrow Airport (approximately 25–30 miles), Gatwick Airport (approximately 45–55 miles) and Southampton Airport (approximately 40–45 miles).",
          "Nearest railway station: Farnborough Main railway station, around 2 miles from the airport by road, with direct train services to London Waterloo.",
          "Road access: Convenient access via the M3 at Junctions 4 and 4A, as well as the A31 and A325, connecting the airport with Hampshire, Surrey and London.",
          "Airport drop-off: Check the airport’s latest drop-off and parking arrangements before travelling. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare so that you won’t incur any extra charges at the airport.",
        ] },
        { icon: Car, title: "Driving Times to Major Towns and Cities", items: [
          "Farnborough Town Centre: Approximately 5–10 minutes (2–3 miles).",
          "Aldershot: Approximately 15–20 minutes (5–7 miles).",
          "Camberley: Approximately 15–25 minutes (around 5.5 miles).",
          "Guildford: Approximately 25–40 minutes (15–18 miles).",
          "Reading: Approximately 35–50 minutes (around 20 miles).",
          "Heathrow Airport: Approximately 30–45 minutes (25–30 miles).",
          "Central London: Approximately 1–1.5 hours (35–40 miles).",
          "Gatwick Airport: Approximately 50–75 minutes (45–55 miles).",
          "Distances are approximate road distances to central destinations. Journey times may vary depending on traffic, roadworks and your chosen route.",
        ] },
      ],
      closing: "Whether you are travelling to Farnborough Airport for a private flight, arranging transport for a corporate trip or heading home after landing, One Airport Taxi offers convenient pre-booked transfers with fares confirmed before travel. Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater vehicles to suit your passengers and luggage. For a comfortable and reliable Farnborough Airport transfer, get your instant taxi quote online and plan your journey with confidence. Important: Farnborough Airport primarily serves private and business aviation rather than regular scheduled commercial passenger flights. Check your flight arrangements directly with your operator before travelling.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    finalChip: "Executive cars",
    extraSections: briefSections("farnborough", FARNBOROUGH_BRIEF),
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },

  Birmingham: {
    heroHeading: "Birmingham Airport Taxi – Reliable Transfers to and from BHX",
    heroSubhead: "Book a Birmingham Airport taxi and get a fixed fare confirmed before you travel. One Airport Taxi operates pre-booked Birmingham Airport transfers across the Midlands and the wider UK, with professional, licensed drivers and a choice of saloon cars, executive vehicles, MPVs, and 8-seater minibuses. Whether you’re travelling alone, with family or as part of a group, choose the vehicle that fits your passengers and luggage, and have your Birmingham journey sorted with confidence.",
    heroCallLine: true,
    heroCallText: "Get your free instant Birmingham Airport taxi quote online and plan your journey before you travel, or call our team on",
    intro: {
      heading: "Birmingham Airport Taxi Transfers – Your Fare Confirmed Before You Travel",
      paragraphs: [
        "Arranging a reliable taxi from Birmingham Airport should be straightforward. With One Airport Taxi, you can plan your journey, enter your pickup and drop-off details, and receive your fare before confirming your booking.",
        "Whether you need a taxi from the city centre to Birmingham Airport, a private transfer from Solihull or Coventry, or a taxi from Birmingham Airport to your home, hotel or business address, we provide pre-booked journeys tailored to your travel plans.",
        <>Birmingham Airport operates from <Link className={linkClass} href={`#${BRIEF_GUIDE_ID}`}>a single, well-organised terminal</Link>, which keeps pickups and drop-offs simple. Provide your flight number when you book, and we’ll track it and adjust your pickup if your flight runs early or late.</>,
        <>Your quoted fare is confirmed before you travel, helping you plan your transport costs without unexpected pricing changes. From individual airport journeys to family holidays and business transfers, <Link className={linkClass} href="#vehicles">our fleet</Link> makes booking your Birmingham journey simple.</>,
      ],
      cta: "Get Your Birmingham Airport Taxi Quote",
      points: [
        { title: "Fare first", text: "Receive your fare before confirming your booking." },
        { title: "One terminal", text: "Pickups and drop-offs stay simple." },
        { title: "Flight tracked", text: "We adjust your pickup if your flight runs early or late." },
      ],
    },
    benefitsHeading: "Why Choose One Airport Taxi for Birmingham Airport Transfers?",
    benefitsSubhead: "Choosing the right airport taxi service can make a difference to your entire journey. We focus on clear pricing, planned pickups, comfortable vehicles, and helpful customer support.",
    benefitCards: [
      { icon: Banknote, title: "Fixed and Transparent Fares", text: "Know your journey cost before confirming your Birmingham Airport taxi booking. Our fixed-fare approach helps you plan your travel budget without meter-based pricing or unexpected fare changes." },
      { icon: PlaneTakeoff, title: "Flight Monitoring", text: "We monitor your flight information to help coordinate your airport pickup. If your arrival time changes, our team uses the updated information to plan your collection." },
      { icon: ShieldCheck, title: "Professional Licensed Drivers", text: "Travel with professional, licensed drivers who understand the importance of punctuality, safe driving, and good customer service across Birmingham and the wider Midlands road network." },
      { icon: UsersRound, title: "Meet and Greet Service", text: "Make your arrival easier by adding a Meet and Greet service when booking. Your driver can meet you in the airport arrivals area at an agreed-upon meeting point, depending on the service selected." },
      { icon: Headphones, title: "24/7 Customer Support", text: "Flight schedules don’t always fit standard working hours. Our support team is available around the clock to help with booking enquiries and journey-related questions." },
      { icon: Car, title: "Vehicles for Different Travel Needs", text: "Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater minibuses. Whether you need a business transfer, a family airport taxi or transport for a larger group, select a vehicle based on your passengers and luggage." },
    ],
    fleet: {
      heading: "Birmingham Airport Taxi Fleet and Pricing",
      paragraphs: [
        "Choosing the right vehicle is important when booking a taxi to Birmingham Airport or arranging a transfer from Birmingham. Consider both passenger capacity and luggage space before selecting your car.",
      ],
      closing: "Choose your vehicle based on your passenger count and luggage requirements. Check the vehicle details and available capacity before confirming your booking.",
      descriptions: {
        standard: "A practical choice for individuals, couples and small groups travelling with standard luggage. Suitable for everyday airport journeys and comfortable transfers to and from Birmingham Airport.",
        executive: "A suitable option for business travellers and passengers who prefer a more premium travel experience. Ideal for corporate airport transfers and professional journeys into Birmingham city centre or the NEC.",
        estate: "An estate vehicle offers more luggage space than a standard saloon, making it useful for passengers travelling with several suitcases.",
        mpv_4seater: "A spacious option for families and small groups who need additional passenger and luggage capacity.",
        mpv: "Suitable for larger families and small groups. This vehicle offers additional passenger capacity, with luggage allowance depending on the number of people travelling.",
        minibus_8seater: "A convenient option for larger groups, group holidays and business transportation. An 8-seater minibus can accommodate up to 8 passengers and has sufficient luggage capacity.",
      },
      pricing: {
        heading: "Fixed Birmingham Airport Taxi Prices",
        paragraphs: [
          "Your Birmingham taxi quote is provided before you confirm your journey. Enter your pickup location, destination, travel date and passenger requirements to check your available fare.",
          "Our pricing information is designed to make airport taxi costs easier to understand, helping you compare suitable vehicles and plan your journey.",
        ],
        cta: "Compare Birmingham Airport Taxi Prices",
      },
    },
    pickup: {
      heading: "Taxi from Birmingham Airport – Meet Your Driver and Travel with Confidence",
      lead: [
        "Arriving at Birmingham Airport after a long flight? Pre-booking your taxi can make the next part of your journey easier.",
        "One Airport Taxi provides airport pickups from the terminal. When booking, provide your flight number, arrival date, and destination so your journey can be planned around your flight.",
      ],
      stepsHeading: "How Your Birmingham Airport Pickup Works",
      steps: [
        { title: "Complete your flight and arrival details.", text: "Provide your flight number and arrival information when making your booking. This helps us identify your expected arrival time." },
        { title: "Follow the airport arrival signs.", text: "After landing, follow the signs for passport control and baggage collection. Check your booking confirmation for your specific driver meeting instructions." },
        { title: "Meet your driver.", text: "If you have selected Meet and Greet, your driver will meet you at the agreed arrivals meeting point. Otherwise, follow the pickup instructions supplied with your booking." },
        { title: "Continue to your destination.", text: "Once you have met your driver, you can continue to your home, hotel, business address or another destination in the UK." },
      ],
      dropHeading: "Birmingham Airport Drop-Off Service",
      dropText: "If you are travelling to Birmingham Airport from elsewhere in the UK, your driver will take you to the terminal drop-off area. Make sure you provide the correct flight details and allow enough time for traffic, check-in and airport security.",
    },
    travelInfo: {
      heading: "Birmingham Airport Taxis and Transfers",
      lead: [
        "Located in Solihull, approximately 8 miles southeast of Birmingham city centre, Birmingham Airport is one of the UK’s busiest international airports and an important gateway to the West Midlands. Whether you need a taxi to Birmingham Airport for an upcoming flight or a transfer after landing, One Airport Taxi provides pre-booked airport journeys with professional drivers, comfortable vehicles and transparent pricing.",
        "Book online for a reliable Birmingham Airport taxi, with a Meet and Greet service and up to 60 minutes of free waiting time for airport pickups.",
      ],
      cards: [
        { icon: TrainFront, title: "Key Travel Information", items: [
          "Nearby airports: East Midlands Airport (around 37 miles), Manchester Airport (approximately 85–95 miles) and London Luton Airport (around 82 miles).",
          "Nearest railway station: Birmingham International Station, directly connected to the airport terminal by the free Air-Rail Link, which takes approximately 1.5 minutes.",
          "Road access: Convenient access via the M42 at Junction 6 and the A45, connecting the airport with Birmingham, Coventry, Solihull and other major destinations.",
          "Airport drop-off: Birmingham Airport offers a free drop-off car park for stays of up to 10 minutes, around a 5–10-minute walk from the terminal. Premium Set Down, located directly outside the terminal, costs £8 for the first 15 minutes. If you pre-book a taxi with One Airport Taxi, the drop-off charge is included in your fare so that you won’t incur any extra charges at the airport.",
        ] },
        { icon: Car, title: "Driving Times to Major Cities", items: [
          "Birmingham City Centre: Approximately 20–35 minutes (8–10 miles).",
          "Coventry: Approximately 20–30 minutes (11–13 miles).",
          "Wolverhampton: Approximately 35–50 minutes (25–30 miles).",
          "Leicester: Approximately 40–60 minutes (35–40 miles).",
          "Worcester: Approximately 40–55 minutes (35–40 miles).",
          "Nottingham: Approximately 55–75 minutes (around 48 miles).",
          "Oxford: Approximately 1 hour 15 minutes–1 hour 40 minutes (65–75 miles).",
          "London: Approximately 2–2.5 hours (110–120 miles).",
          "Distances are approximate road distances to central destinations. Journey times may vary depending on traffic, roadworks and your chosen route.",
        ] },
      ],
      closing: "Whether you are travelling to Birmingham Airport for a holiday, business trip or international flight, or heading home after landing, One Airport Taxi offers convenient pre-booked transfers with fares confirmed before travel. Choose from saloon cars, executive vehicles, estate cars, MPVs and 8-seater vehicles to suit your passengers and luggage.",
    },
    travelInfoOrder: 67,
    comfortOrder: 75,
    extraSections: briefSections("birmingham", BIRMINGHAM_BRIEF),
    hiddenSections: ["ferry_cruise", "related_destinations"],
  },
}
