export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "completed"
  | "cancelled"

export type PaymentStatus = "unpaid" | "paid"

export type PaymentMethod = "card" | "cash"

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

export type PromoDiscountType = "percent" | "fixed"

export interface PromoCode {
  code: string
  discountType: PromoDiscountType
  discountValue: number
  active: boolean
  createdAt: string
}

/** Site-wide "X% off everything" promotion — a single on/off switch, distinct from one-off promo codes. */
export interface SitePromotion {
  active: boolean
  discountPercent: number
  updatedAt: string
}

/** "Book a return and save X%" — a single on/off switch, admin-managed like SitePromotion but applies only to the return leg. */
export interface ReturnTripDiscount {
  active: boolean
  discountPercent: number
  updatedAt: string
}

/** Flat fee charged per extra stop a customer adds to their trip, admin-managed. */
export interface StopPricing {
  pricePerStop: number
  updatedAt: string
}

export interface Booking {
  reference: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
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
  /** Extra stops between pickup and drop-off, in visiting order. */
  stops: Destination[]
  stopsTotal: number
  promoCode?: string
  discountAmount: number
  /** Set on the outbound leg once a return trip has been booked alongside it. */
  returnTripReference?: string
  /** Set on the return leg, pointing back to the outbound booking it belongs to. */
  outboundTripReference?: string
  stripeCheckoutSessionId?: string
  stripePaymentIntentId?: string
  paidAt?: string
  createdAt: string
}

export type NewBookingInput = Omit<
  Booking,
  "reference" | "status" | "paymentStatus" | "createdAt" | "fare" | "distanceMiles" | "addOns" | "addOnsTotal" | "discountAmount" | "returnTripReference" | "outboundTripReference" | "stopsTotal"
>
