import type { PromoCode, ServiceLocation, VehicleClass } from "./types"

export const AIRPORTS: ServiceLocation[] = [
  // --- HEATHROW (LHR) ---
  { id: "lhr-t2", name: "London Heathrow (LHR) - Terminal 2", area: "Hillingdon", lat: 51.4714, lng: -0.4494 },
  { id: "lhr-t3", name: "London Heathrow (LHR) - Terminal 3", area: "Hillingdon", lat: 51.4716, lng: -0.4578 },
  { id: "lhr-t4", name: "London Heathrow (LHR) - Terminal 4", area: "Hillingdon", lat: 51.4595, lng: -0.4470 },
  { id: "lhr-t5", name: "London Heathrow (LHR) - Terminal 5", area: "Hillingdon", lat: 51.4721, lng: -0.4878 },

  // --- GATWICK (LGW) ---
  { id: "lgw-north", name: "London Gatwick (LGW) - North Terminal", area: "Crawley", lat: 51.1601, lng: -0.1771 },
  { id: "lgw-south", name: "London Gatwick (LGW) - South Terminal", area: "Crawley", lat: 51.1492, lng: -0.1587 },

  // --- STANSTED (STN) ---
  { id: "stn", name: "London Stansted (STN)", area: "Uttlesford", lat: 51.8850, lng: 0.2350 },

  // --- LUTON (LTN) ---
  { id: "ltn", name: "London Luton (LTN)", area: "Luton", lat: 51.8747, lng: -0.3683 },

  // --- LONDON CITY (LCY) ---
  { id: "lcy", name: "London City (LCY)", area: "Newham", lat: 51.5053, lng: 0.0553 },

  // --- SOUTHEND (SEN) ---
  { id: "sen", name: "London Southend (SEN)", area: "Southend-on-Sea", lat: 51.5714, lng: 0.6956 }
];


type LegacyLocation = Omit<ServiceLocation, "lat" | "lng"> & { distanceMiles: number }

export const LOCATIONS: LegacyLocation[] = [
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
    name: "Saloon Car",
    description: "Up to 3 passengers with 2 standard suitcases (up to 23kg each), or 4 passengers with hand luggage only.",
    capacity: 3,
    luggage: 2,
    image: "/vehicles/standard-sedan.png",
    minFare: 40,
    perMileAfter: 1.7,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 60 min wait", "Bottled water"],
  },
  {
    id: "executive",
    name: "Executive Car",
    description: "Travel in premium comfort with our Executive Car. Accommodates up to 3 passengers with 3 standard suitcases (23kg each), or 4 passengers with hand luggage only.",
    capacity: 3,
    luggage: 3,
    image: "/vehicles/executive-sedan.png",
    minFare: 55,
    perMileAfter: 2.2,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 60 min wait", "Pro chauffeur", "Phone charger"],
  },
  {
    id: "estate",
    name: "Estate Car",
    description: "Comfortably accommodates up to 4 passengers with space for 4 standard suitcases (up to 23kg each).",
    capacity: 4,
    luggage: 4,
    image: "/vehicles/estate-car.png",
    minFare: 60,
    perMileAfter: 2.5,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 60 min wait", "Child seat on request", "Extra luggage"],
  },
  {
    id: "mpv_4seater",
    name: "4 Seater MPV",
    description: "Comfortably accommodates up to 4 passengers, 4 standard suitcases (23kg each) and 4 backpacks — with plenty of space for a relaxed, stress-free journey.",
    capacity: 4,
    luggage: 4,
    image: "/vehicles/mpv-4seater.png",
    minFare: 62,
    perMileAfter: 2.5,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 60 min wait", "Child seat on request", "Extra luggage"],
  },
  {
    id: "mpv",
    name: "6 Seater MPV",
    description: "Comfortably accommodates up to 5 passengers with 5 standard suitcases (23kg each), or up to 6 passengers with hand luggage only. Ideal for families, airport transfers, and small groups, offering generous space for both passengers and luggage without compromising on comfort.",
    capacity: 5,
    luggage: 5,
    image: "/vehicles/mpv-6seater.png",
    minFare: 65,
    perMileAfter: 2.5,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 60 min wait", "Child seat on request", "Extra luggage"],
  },
  {
    id: "minibus_8seater",
    name: "8 Seater Minibus",
    description: "Comfortably seats up to 8 passengers with space for up to 8 standard suitcases (23kg max). Ideal for airport transfers and group travel.",
    capacity: 8,
    luggage: 8,
    image: "/vehicles/minibus-8seater.png",
    minFare: 95,
    perMileAfter: 2.8,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 60 min wait", "Extra luggage", "Group travel specialist"],
  },
]

export function getVehicle(id: string): VehicleClass | undefined {
  return VEHICLE_CLASSES.find((v) => v.id === id)
}

export function getLocation(id: string): ServiceLocation | LegacyLocation | undefined {
  return [...LOCATIONS, ...AIRPORTS].find((l) => l.id === id)
}

export function getAirport(id: string): ServiceLocation | undefined {
  return AIRPORTS.find((a) => a.id === id)
}

export interface FareQuote {
  distanceMiles: number
  durationMinutes: number
  fare: number
}

export function computeFare(
  vehicle: Pick<VehicleClass, "minFare" | "perMileAfter" | "perMinuteRate">,
  distanceMiles: number,
  durationMinutes: number,
): FareQuote {
  const extraMiles = Math.max(0, distanceMiles - MIN_DISTANCE_MILES)
  const fare = Math.round(
    vehicle.minFare +
      extraMiles * vehicle.perMileAfter +
      Math.max(0, durationMinutes) * vehicle.perMinuteRate,
  )
  return {
    distanceMiles: Math.round(distanceMiles * 10) / 10,
    durationMinutes: Math.max(0, Math.ceil(durationMinutes)),
    fare,
  }
}

/** Discount amount for a subtotal, clamped so it never exceeds the subtotal itself. */
export function computeDiscount(subtotal: number, promo: Pick<PromoCode, "discountType" | "discountValue">): number {
  const raw = promo.discountType === "percent" ? subtotal * (promo.discountValue / 100) : promo.discountValue
  return Math.min(subtotal, Math.max(0, Math.round(raw)))
}

/** Applies the site-wide "X% off" promotion to a price. */
export function applyPromotion(amount: number, discountPercent: number): number {
  return Math.max(0, Math.round(amount * (1 - discountPercent / 100)))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value)
}	
