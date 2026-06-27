import type { ServiceLocation, VehicleClass } from "./types"

export const AIRPORTS: ServiceLocation[] = [
  { id: "jfk", name: "JFK International", area: "Queens", distanceKm: 0 },
  { id: "lga", name: "LaGuardia (LGA)", area: "Queens", distanceKm: 0 },
  { id: "ewr", name: "Newark Liberty (EWR)", area: "New Jersey", distanceKm: 0 },
]

export const LOCATIONS: ServiceLocation[] = [
  { id: "midtown", name: "Midtown Manhattan", area: "Manhattan", distanceKm: 24 },
  { id: "downtown", name: "Downtown / Financial District", area: "Manhattan", distanceKm: 27 },
  { id: "brooklyn", name: "Brooklyn Heights", area: "Brooklyn", distanceKm: 18 },
  { id: "williamsburg", name: "Williamsburg", area: "Brooklyn", distanceKm: 16 },
  { id: "uws", name: "Upper West Side", area: "Manhattan", distanceKm: 29 },
  { id: "harlem", name: "Harlem", area: "Manhattan", distanceKm: 31 },
  { id: "lic", name: "Long Island City", area: "Queens", distanceKm: 12 },
  { id: "jerseycity", name: "Jersey City", area: "New Jersey", distanceKm: 22 },
  { id: "stamford", name: "Stamford", area: "Connecticut", distanceKm: 64 },
  { id: "whiteplains", name: "White Plains", area: "Westchester", distanceKm: 52 },
]

export const VEHICLE_CLASSES: VehicleClass[] = [
  {
    id: "standard",
    name: "Standard Sedan",
    description: "Comfortable everyday sedan, ideal for solo travelers and couples.",
    capacity: 3,
    luggage: 2,
    image: "/vehicles/standard-sedan.png",
    baseFare: 22,
    perKm: 1.9,
    features: ["Meet & greet", "Free 60 min wait", "Bottled water"],
  },
  {
    id: "executive",
    name: "Executive Sedan",
    description: "Premium business-class sedan with extra legroom and quiet ride.",
    capacity: 3,
    luggage: 3,
    image: "/vehicles/executive-sedan.png",
    baseFare: 34,
    perKm: 2.6,
    features: ["Meet & greet", "Free 60 min wait", "Pro chauffeur", "Phone charger"],
  },
  {
    id: "suv",
    name: "SUV / Minivan",
    description: "Spacious SUV for families or groups with plenty of luggage room.",
    capacity: 6,
    luggage: 6,
    image: "/vehicles/suv-minivan.png",
    baseFare: 42,
    perKm: 2.9,
    features: ["Meet & greet", "Free 90 min wait", "Child seat on request", "Extra luggage"],
  },
  {
    id: "luxury",
    name: "First Class",
    description: "Top-tier luxury vehicle for VIP arrivals and special occasions.",
    capacity: 3,
    luggage: 3,
    image: "/vehicles/luxury-sedan.png",
    baseFare: 68,
    perKm: 4.2,
    features: ["VIP meet & greet", "Free 90 min wait", "Premium interior", "Refreshments"],
  },
]

export function getVehicle(id: string): VehicleClass | undefined {
  return VEHICLE_CLASSES.find((v) => v.id === id)
}

export function getLocation(id: string): ServiceLocation | undefined {
  return [...LOCATIONS, ...AIRPORTS].find((l) => l.id === id)
}

export function getAirport(id: string): ServiceLocation | undefined {
  return AIRPORTS.find((a) => a.id === id)
}

export interface FareQuote {
  distanceKm: number
  fare: number
}

/** Flat zone-based fare: base fare + per-km rate over the zone distance. */
export function calculateFare(vehicleId: string, locationId: string): FareQuote | null {
  const vehicle = getVehicle(vehicleId)
  const location = getLocation(locationId)
  if (!vehicle || !location) return null

  const distanceKm = location.distanceKm
  const raw = vehicle.baseFare + vehicle.perKm * distanceKm
  // round to nearest dollar
  const fare = Math.round(raw)
  return { distanceKm, fare }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}
