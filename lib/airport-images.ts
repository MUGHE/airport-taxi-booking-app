/** Card photos for each airport, served from our own /public folder (no third-party image host). */
export const AIRPORT_IMAGES: Record<string, string> = {
  "heathrow-airport-taxi": "/hero-airport-transfer.webp",
  "gatwick-airport-taxi": "/airport-transfers/gatwick.webp",
  "stansted-airport-taxi": "/airport-transfers/gatwick.webp",
  "luton-airport-taxi": "/airport-transfers/luton.webp",
  "london-city-airport-taxi": "/airport-transfers/london-city.webp",
  "southend-airport-taxi": "/airport-transfers/southend.webp",
  "southampton-airport-taxi": "/airport-transfers/hero.webp",
  "bournemouth-airport-taxi": "/airport-transfers/hero.webp",
  "oxford-airport-taxi": "/airport-transfers/hero.webp",
  "farnborough-airport-taxi": "/airport-transfers/hero.webp",
  "birmingham-airport-taxi": "/airport-transfers/hero.webp",
  "manchester-airport-taxi": "/airport-transfers/hero.webp",
}

/** Alt text for an airport card photo, e.g. "Heathrow Airport (LHR) taxi transfer service". */
export function airportImageAlt(name: string, iataCode?: string): string {
  const airport = /\bairport$/i.test(name.trim()) ? name.trim() : `${name.trim()} Airport`
  return `${airport}${iataCode ? ` (${iataCode})` : ""} taxi transfer service`
}
