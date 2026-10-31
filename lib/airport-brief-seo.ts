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
  "southend-airport-taxi": {
    title: "Southend Airport Taxi | Fixed Price Transfers to & from SEN",
    description: "Book a Southend Airport taxi with fixed fares confirmed before you travel. Licensed drivers, flight tracking, meet-and-greet, and 8-seater minibuses. Get an instant quote.",
  },
}
