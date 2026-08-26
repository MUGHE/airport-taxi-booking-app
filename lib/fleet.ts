import type { ServiceLocation, VehicleClass } from "./types"

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
    name: "Standard Saloon",
    description: "Comfortable everyday sedan, Up to 3 passengers plus 2 standard suitcases (25kg max), or 4 passengers plus hand luggage.",
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
    description: "Premium business-class sedan, Up to 3 passengers plus 3 standard suitcases (23kg max), or 4 passengers plus hand luggage.",
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
    description: "Spacious Estate for families or groups, Up to 4 passengers plus 4 standard suitcases (23kg max).",
    capacity: 4,
    luggage: 4,
    image: "/vehicles/estate-car.png",
    minFare: 60,
    perMileAfter: 2.5,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 90 min wait", "Child seat on request", "Extra luggage"],
  },
  {
    id: "mpv",
    name: "6 Seater MPV",
    description: "Spacious, comfortable, and cost-effective travel, Up to 5 passengers plus 5 standard suitcases (23kg max), or 6 passengers plus hand luggage.",
    capacity: 5,
    luggage: 5,
    image: "/vehicles/mpv-6seater.png",
    minFare: 65,
    perMileAfter: 2.5,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 90 min wait", "Child seat on request", "Extra luggage"],
  },
  {
    id: "luxury_mpv",
    name: "Executive MPV",
    description: "premium luxury, sophisticated comfort, Up to 5 passengers plus 5 standard suitcases (23kg max), or 6 passengers plus hand luggage.",
    capacity: 5,
    luggage: 5,
    image: "/vehicles/executive-mpv.png",
    minFare: 85,
    perMileAfter: 2.5,
    perMinuteRate: 0.5,
    features: ["Meet & greet", "Free 90 min wait", "Child seat on request", "Extra luggage"],
  },
  // {
  //   id: "luxury",
  //   name: "First Class",
  //   description: "Top-tier luxury vehicle for VIP arrivals and special occasions.",
  //   capacity: 3,
  //   luggage: 3,
  //   image: "/vehicles/luxury-sedan.png",
  //   minFare: 95,
  //   perMileAfter: 3.5,
  //   features: ["VIP meet & greet", "Free 90 min wait", "Premium interior", "Refreshments"],
  // },
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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value)
}	
