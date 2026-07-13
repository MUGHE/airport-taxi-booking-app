import type { ServiceLocation, VehicleClass } from "./types"

export const AIRPORTS: ServiceLocation[] = [
  { id: "jfk", name: "JFK International", area: "Queens", distanceMiles: 0 },
  { id: "lga", name: "LaGuardia (LGA)", area: "Queens", distanceMiles: 0 },
  { id: "ewr", name: "Newark Liberty (EWR)", area: "New Jersey", distanceMiles: 0 },
]

export const LOCATIONS: ServiceLocation[] = [
  { id: "midtown", name: "Midtown Manhattan", area: "Manhattan", distanceMiles: 15 },
  { id: "downtown", name: "Downtown / Financial District", area: "Manhattan", distanceMiles: 17 },
  { id: "brooklyn", name: "Brooklyn Heights", area: "Brooklyn", distanceMiles: 11 },
  { id: "williamsburg", name: "Williamsburg", area: "Brooklyn", distanceMiles: 10 },
  { id: "uws", name: "Upper West Side", area: "Manhattan", distanceMiles: 18 },
  { id: "harlem", name: "Harlem", area: "Manhattan", distanceMiles: 19 },
  { id: "lic", name: "Long Island City", area: "Queens", distanceMiles: 7 },
  { id: "jerseycity", name: "Jersey City", area: "New Jersey", distanceMiles: 14 },
  { id: "stamford", name: "Stamford", area: "Connecticut", distanceMiles: 40 },
  { id: "whiteplains", name: "White Plains", area: "Westchester", distanceMiles: 32 },
]

// Minimum fare covers the first MIN_DISTANCE_MILES; every mile beyond that
// is charged at the vehicle's perMileAfter rate.
export const MIN_DISTANCE_MILES = 10

export const VEHICLE_CLASSES: VehicleClass[] = [
  {
    id: "standard",
    name: "Standard Sedan",
    description: "Comfortable everyday sedan, ideal for solo travelers and couples.",
    capacity: 3,
    luggage: 2,
    image: "/vehicles/standard-sedan.png",
    minFare: 40,
    perMileAfter: 1.7,
    features: ["Meet & greet", "Free 60 min wait", "Bottled water"],
  },
  {
    id: "executive",
    name: "Executive Sedan",
    description: "Premium business-class sedan with extra legroom and quiet ride.",
    capacity: 3,
    luggage: 3,
    image: "/vehicles/executive-sedan.png",
    minFare: 55,
    perMileAfter: 2.2,
    features: ["Meet & greet", "Free 60 min wait", "Pro chauffeur", "Phone charger"],
  },
  {
    id: "suv",
    name: "SUV / Minivan",
    description: "Spacious SUV for families or groups with plenty of luggage room.",
    capacity: 6,
    luggage: 6,
    image: "/vehicles/suv-minivan.png",
    minFare: 65,
    perMileAfter: 2.5,
    features: ["Meet & greet", "Free 90 min wait", "Child seat on request", "Extra luggage"],
  },
  {
    id: "luxury",
    name: "First Class",
    description: "Top-tier luxury vehicle for VIP arrivals and special occasions.",
    capacity: 3,
    luggage: 3,
    image: "/vehicles/luxury-sedan.png",
    minFare: 95,
    perMileAfter: 3.5,
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
  distanceMiles: number
  fare: number
}

/**
 * Minimum-fare pricing: every trip costs at least the vehicle's minFare
 * (covers up to MIN_DISTANCE_MILES). Distance beyond that is billed per
 * mile at the vehicle's perMileAfter rate. Takes the vehicle object
 * directly so callers can pass live (admin-edited) pricing.
 */
export function computeFare(
  vehicle: Pick<VehicleClass, "minFare" | "perMileAfter">,
  locationId: string,
): FareQuote | null {
  const location = getLocation(locationId)
  if (!location) return null

  const distanceMiles = location.distanceMiles
  const extraMiles = Math.max(0, distanceMiles - MIN_DISTANCE_MILES)
  const raw = vehicle.minFare + extraMiles * vehicle.perMileAfter
  const fare = Math.round(raw)

  return { distanceMiles, fare }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value)
}	