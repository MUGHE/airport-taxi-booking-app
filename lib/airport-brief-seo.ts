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
}
