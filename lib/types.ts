export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "completed"
  | "cancelled"

export type PaymentStatus = "unpaid" | "paid"

export type TripDirection = "from-airport" | "to-airport"

export interface VehicleClass {
  id: string
  name: string
  description: string
  capacity: number
  luggage: number
  image: string
  /** Minimum fare — covers up to MIN_DISTANCE_MILES of travel. */
  minFare: number
  /** Rate charged per mile once distance exceeds MIN_DISTANCE_MILES. */
  perMileAfter: number
  features: string[]
}

export interface ServiceLocation {
  id: string
  name: string
  area: string
  /** Approximate driving distance from the airport in miles. */
  distanceMiles: number
}

export interface Booking {
  reference: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  direction: TripDirection
  airportId: string
  locationId: string
  vehicleId: string
  pickupDate: string
  pickupTime: string
  flightNumber: string
  passengers: number
  bags: number
  customerName: string
  email: string
  phone: string
  notes: string
  fare: number
  distanceMiles: number
  stripeCheckoutSessionId?: string
  stripePaymentIntentId?: string
  paidAt?: string
  createdAt: string
}

export type NewBookingInput = Omit
  Booking,
  "reference" | "status" | "createdAt" | "fare" | "distanceMiles"
>