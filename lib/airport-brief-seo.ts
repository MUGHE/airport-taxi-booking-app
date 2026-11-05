// Title tags and meta descriptions from the client's airport content briefs, keyed by airport slug.
// They replace the CMS ones; the page copy itself is in components/airport-page/airport-briefs.tsx.
export const AIRPORT_BRIEF_SEO: Record<string, { title: string; description: string }> = {
  "heathrow-airport-taxi": {
    title: "Heathrow Airport Taxi | Fixed-Fare Transfers to and from LHR",
    description: "Book your Heathrow Airport taxi with One Airport Taxi and know your fare in advance. We offer fixed prices for transfers to and from Heathrow terminals anywhere in the UK.",
  },
  "gatwick-airport-taxi": {
    title: "Gatwick Airport Taxi | Fixed-Fare Transfers to and from LGW",
    description: "Book your Gatwick Airport taxi with One Airport Taxi and know your fare in advance. We offer fixed-price transfers to and from Gatwick Airport across the UK.",
  },
  "stansted-airport-taxi": {
    title: "Stansted Airport Taxi | Fixed Price Transfers to & from STN",
    description: "Book a Stansted Airport taxi with fixed fares confirmed before you travel. Licensed drivers, flight tracking, meet-and-greet, and 8-seater minibuses. Instant quote.",
  },
  "luton-airport-taxi": {
    title: "Luton Airport Taxi | Fixed Price Transfers to & from LTN",
    description: "Book your Luton Airport taxi with a fixed fare confirmed before you travel. Our licensed drivers offer flight tracking, meet-and-greet service, and 8-seater minibuses. Get an instant quote.",
  },
  "london-city-airport-taxi": {
    title: "London City Airport Taxi | Fixed Price LCY Transfers",
    description: "Book a London City Airport taxi with fixed fares confirmed before you travel. Licensed drivers, flight tracking, meet and greet. Instant LCY transfer quote.",
  },
  "southend-airport-taxi": {
    title: "Southend Airport Taxi | Fixed Price Transfers to & from SEN",
    description: "Book a Southend Airport taxi with fixed fares confirmed before you travel. Licensed drivers, flight tracking, meet-and-greet, and 8-seater minibuses. Get an instant quote.",
  },
  "southampton-airport-taxi": {
    title: "Southampton Airport Taxi | Fixed Price Transfers to & from SOU",
    description: "Book a Southampton Airport taxi with a fixed fare confirmed before you travel. Licensed drivers, flight monitoring, meet-and-greet, and wheelchair-accessible vehicles. Instant quote.",
  },
  "bournemouth-airport-taxi": {
    title: "Bournemouth Airport Taxi | Fixed Price Transfers to & from BOH",
    description: "Book a Bournemouth Airport taxi with a fixed fare confirmed before you travel. Licensed drivers, flight monitoring, meet-and-greet, and 8-seater minibuses. Instant quote.",
  },
  "oxford-airport-taxi": {
    title: "Oxford Airport Taxi | Fixed Price Transfers to & from OXF",
    description: "Book an Oxford Airport taxi with a fixed fare confirmed before you travel. Licensed drivers, flight monitoring, meet-and-greet, plus Oxford-to-Heathrow and London airport transfers.",
  },
  "farnborough-airport-taxi": {
    title: "Farnborough Airport Taxi | Fixed Price Private Transfers",
    description: "Book a Farnborough Airport taxi with a fixed fare confirmed before you travel. Licensed drivers, flight monitoring and executive vehicles for private and business aviation transfers.",
  },
  "birmingham-airport-taxi": {
    title: "Birmingham Airport Taxi | Fixed Price Transfers to & from BHX",
    description: "Book a Birmingham Airport taxi with a fixed fare confirmed before you travel. Licensed drivers, flight monitoring, meet-and-greet, and 8-seater minibuses. Instant quote.",
  },
  "manchester-airport-taxi": {
    title: "Manchester Airport Taxi | Fixed Price Transfers T2 & T3",
    description: "Book a Manchester Airport taxi with a fixed fare confirmed before you travel. Flight monitoring, meet-and-greet, and 8-seater minibuses. Instant quote.",
  },
}
