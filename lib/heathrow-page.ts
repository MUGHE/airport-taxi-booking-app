// Heathrow page copy from the client's Heathrow content brief. The CMS still supplies the terminals,
// vehicles, images, reviews and FAQs; this file supplies the wording and the route cards.

export const HEATHROW_SLUG = "heathrow-airport-taxi"

export const HEATHROW_SEO = {
  title: "Heathrow Airport Taxi | Fixed-Fare Transfers to and from LHR",
  description: "Book your Heathrow Airport taxi with One Airport Taxi and know your fare in advance. We offer fixed prices for transfers to and from Heathrow terminals anywhere in the UK.",
}

export type HeathrowPlace = { name: string; address: string; latitude: number; longitude: number; text?: string; href?: string; hrefLabel?: string }

// Coordinates are town centres, terminals and port gates; the booking form prices the route from them.
export const HEATHROW_CITIES: HeathrowPlace[] = [
  { name: "London", address: "Central London (Charing Cross)", latitude: 51.5073, longitude: -0.1276 },
  { name: "Slough", address: "Slough, Berkshire", latitude: 51.5105, longitude: -0.595 },
  { name: "Windsor", address: "Windsor, Berkshire", latitude: 51.4839, longitude: -0.6044 },
  { name: "Reading", address: "Reading, Berkshire", latitude: 51.4543, longitude: -0.9781, href: "/destinations/reading-taxi", hrefLabel: "Reading taxi guide" },
  { name: "Maidenhead", address: "Maidenhead, Berkshire", latitude: 51.5218, longitude: -0.7194 },
  { name: "Oxford", address: "Oxford, Oxfordshire", latitude: 51.752, longitude: -1.2577, href: "/destinations/oxford-taxi", hrefLabel: "Oxford taxi guide" },
  { name: "High Wycombe", address: "High Wycombe, Buckinghamshire", latitude: 51.6287, longitude: -0.7482 },
  { name: "Bracknell", address: "Bracknell, Berkshire", latitude: 51.4154, longitude: -0.7536 },
  { name: "Guildford", address: "Guildford, Surrey", latitude: 51.2362, longitude: -0.5704 },
]

export const HEATHROW_AIRPORT_ROUTES: HeathrowPlace[] = [
  { name: "Gatwick", address: "London Gatwick Airport (LGW) - North Terminal", latitude: 51.1601, longitude: -0.1771, href: "/airport-transfers/gatwick-airport-taxi", text: "Travelling between Heathrow and Gatwick? Book a direct private transfer and leave enough time for traffic plus your onward flight." },
  { name: "Luton", address: "London Luton Airport (LTN)", latitude: 51.8747, longitude: -0.3683, href: "/airport-transfers/luton-airport-taxi", text: "A straightforward taxi from Heathrow to Luton, with a vehicle sized to your passengers and luggage." },
  { name: "Stansted", address: "London Stansted Airport (STN)", latitude: 51.885, longitude: 0.235, href: "/airport-transfers/stansted-airport-taxi", text: "Pre-book your Heathrow to Stansted transfer for a connection or onward journey, and check the fare before you confirm." },
  { name: "London City", address: "London City Airport (LCY)", latitude: 51.5053, longitude: 0.0553, href: "/airport-transfers/london-city-airport-taxi", text: "Travelling between Heathrow and London City? Book a private transfer for business travel, connecting flights or anything else." },
  { name: "Southend", address: "London Southend Airport (SEN)", latitude: 51.5714, longitude: 0.6956, href: "/airport-transfers/southend-airport-taxi", text: "Plan the Heathrow-to-London Southend leg with a pre-booked transfer in a vehicle that suits your trip." },
]

export const HEATHROW_PORT_ROUTES: HeathrowPlace[] = [
  { name: "Southampton Cruise Terminal", address: "Southampton Cruise Terminal, Southampton", latitude: 50.8968, longitude: -1.3967, href: "/destinations/southampton-taxi", hrefLabel: "Southampton taxi guide", text: "Southampton is a big cruise departure point on the south coast. Book a private taxi from Heathrow to your specific cruise terminal and allow time for traffic and embarkation." },
  { name: "Dover Port", address: "Port of Dover, Dover", latitude: 51.1269, longitude: 1.3343, text: "Heading from Heathrow to Dover? Book a private transfer to the ferry or cruise facilities, and confirm your exact terminal or dock before you travel." },
  { name: "Portsmouth International Port", address: "Portsmouth International Port, Portsmouth", latitude: 50.8131, longitude: -1.0886, href: "/destinations/portsmouth-taxi", hrefLabel: "Portsmouth taxi guide", text: "Arrange a Heathrow-to-Portsmouth transfer for ferry departures and other journeys from Portsmouth International Port." },
  { name: "Harwich International Port", address: "Harwich International Port, Harwich", latitude: 51.9459, longitude: 1.2554, text: "Book a private transfer from Heathrow to Harwich International for onward ferry travel. Check your sailing time before you pick a pickup time." },
  { name: "Tilbury Cruise Terminal", address: "London International Cruise Terminal, Tilbury", latitude: 51.4547, longitude: 0.3593, text: "Sailing from Tilbury? Arrange a pre-booked transfer from Heathrow to London Cruise Terminal and time your arrival around embarkation." },
]

export const HEATHROW_TERMINAL_INFO: { label: string; title: string; info: string; transfer: string }[] = [
  { label: "Terminal 2", title: "Terminal 2 – The Queen’s Terminal", info: "Terminal 2 serves a wide range of international and European airlines. Check your airline and flight details before you travel so you arrive at the right terminal.", transfer: "Pre-book a taxi to Terminal 2 for domestic and international departures. Your driver drops you at the designated terminal area." },
  { label: "Terminal 3", title: "Terminal 3", info: "Terminal 3 handles a mix of international and long-haul services. Confirm your terminal with your airline before you arrange your taxi.", transfer: "Book a Terminal 3 transfer from your home, hotel or office. Double-check your airline and terminal before you travel." },
  { label: "Terminal 4", title: "Terminal 4", info: "Terminal 4 serves selected international airlines, with shops and food options inside. Leave enough time to reach the terminal and get through the formalities.", transfer: "Plan your Terminal 4 transfer — enter your pickup point and travel time to get a fare before you confirm." },
  { label: "Terminal 5", title: "Terminal 5", info: "A major Heathrow terminal, serving British Airways and selected partner airlines. Check your flight information before booking your pickup or drop-off.", transfer: "Flying from Terminal 5? Book ahead and leave enough time for the drive, check-in and security." },
]

// Keyed by vehicle id (lib/fleet.ts).
export const HEATHROW_VEHICLE_TEXT: Record<string, string> = {
  standard: "The sensible choice for solo travellers, couples and small groups with standard luggage. Comfortable, practical, and ideal for a straightforward airport transfer.",
  executive: "For business travellers and anyone who prefers a more premium ride. Well suited to corporate transfers and professional journeys.",
  estate: "An estate gives you noticeably more luggage room than a standard saloon. This is helpful when you’re travelling with several suitcases.",
  mpv_4seater: "A roomier option for families and small groups who need extra space for people and bags. A good fit for holidays when you have more luggage than usual.",
  mpv: "Suits larger families and small groups, with extra passenger capacity. Luggage allowance depends on how many of you are travelling, so check before booking.",
  minibus_8seater: "The practical answer for larger groups, group holidays, and business travel. Up to eight passengers, with luggage capacity to match.",
}
