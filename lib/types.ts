export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "completed"
  | "cancelled"

export type TripDirection = "from-airport" | "to-airport"

export interface VehicleClass {
  id: string
  name: string
  description: string
  capacity: number
  luggage: number
  image: string
  baseFare: number
  perKm: number
  features: string[]
}

export interface ServiceLocation {
  id: string
  name: string
  area: string
  /** Approximate driving distance from the airport in km. */
  distanceKm: number
}

export interface Booking {
  reference: string
  status: BookingStatus
  direction: TripDirection
  airportId: string
  locationId: string
  vehicleId: string
  pickupDate: string // ISO date (yyyy-mm-dd)
  pickupTime: string // HH:mm
  flightNumber: string
  passengers: number
  bags: number
  customerName: string
  email: string
  phone: string
  notes: string
  fare: number
  distanceKm: number
  createdAt: string // ISO timestamp
}

export type NewBookingInput = Omit<
  Booking,
  "reference" | "status" | "createdAt" | "fare" | "distanceKm"
>
