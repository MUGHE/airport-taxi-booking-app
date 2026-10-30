import Link from "next/link"
import { Baby, Banknote, Briefcase, Car, CircleParking, Clock, Headphones, MapPin, PlaneTakeoff, Route, ShieldCheck, TrainFront, UsersRound } from "lucide-react"
import { BRIEF_DESTINATIONS_ID, BRIEF_GUIDE_ID, briefSections, type AirportBrief, type BriefPlace } from "@/components/airport-page/airport-brief-sections"
import type { AirportCopy } from "@/components/airport-page/airport-page-renderer"

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
}
