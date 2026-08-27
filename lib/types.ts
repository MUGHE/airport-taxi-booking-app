export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "completed"
  | "cancelled"

export type PaymentStatus = "unpaid" | "paid"

export type TripDirection = "from-airport" | "to-airport" | "custom"

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
  /** Rate charged for each minute of driving time. */
  perMinuteRate: number
  features: string[]
}
export interface ServiceLocation {
  id: string
  name: string
  area: string
  lat: number
  lng: number
}

export interface Destination {
  placeId: string
  address: string
  lat: number
  lng: number
}

export interface BookingAddOn {
  id: string
  name: string
  price: number
}

export interface Booking {
  reference: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  direction: TripDirection
  airportId: string
  destinationAddress: string
  destinationLat: number
  destinationLng: number
  pickupAddress?: string
  pickupLat?: number
  pickupLng?: number
  dropoffAddress?: string
  dropoffLat?: number
  dropoffLng?: number
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
  addOns: BookingAddOn[]
  addOnsTotal: number
  stripeCheckoutSessionId?: string
  stripePaymentIntentId?: string
  paidAt?: string
  createdAt: string
}

export type NewBookingInput = Omit<
  Booking,
  "reference" | "status" | "paymentStatus" | "createdAt" | "fare" | "distanceMiles" | "addOns" | "addOnsTotal"
>
