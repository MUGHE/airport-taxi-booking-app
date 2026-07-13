import type { Booking, BookingStatus, VehicleClass } from "./types"
import { VEHICLE_CLASSES } from "./fleet"

/**
 * In-memory booking store.
 *
 * NOTE: This persists only for the lifetime of the server process and is shared
 * across requests within a single instance. It is intended as a stand-in until a
 * real database (e.g. Neon/Postgres) is connected. The function surface below is
 * intentionally async so swapping in a DB later requires no call-site changes.
 */


const globalForStore = globalThis as unknown as {
  __taxiBookings?: Map<string, Booking>
  __taxiVehiclePricing?: Map<string, { minFare: number; perMileAfter: number }>
}

const vehiclePricing: Map<string, { minFare: number; perMileAfter: number }> =
  globalForStore.__taxiVehiclePricing ?? new Map()

if (!globalForStore.__taxiVehiclePricing) {
  globalForStore.__taxiVehiclePricing = vehiclePricing
  for (const v of VEHICLE_CLASSES) {
    vehiclePricing.set(v.id, { minFare: v.minFare, perMileAfter: v.perMileAfter })
  }
}

const bookings: Map<string, Booking> =
  globalForStore.__taxiBookings ?? new Map<string, Booking>()

if (!globalForStore.__taxiBookings) {
  globalForStore.__taxiBookings = bookings
  seed(bookings)
}

function seed(map: Map<string, Booking>) {
  const today = new Date()
  const iso = (offsetDays: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offsetDays)
    return d.toISOString().slice(0, 10)
  }
  const samples: Booking[] = [
    {
      reference: "AT-7F3K9Q",
      status: "confirmed",
      paymentStatus: "paid",
      direction: "from-airport",
      airportId: "lhr-t5",
      destinationAddress: "Westminster, London, UK",
      destinationLat: 51.4975,
      destinationLng: -0.1357,
      vehicleId: "executive",
      pickupDate: iso(1),
      pickupTime: "14:30",
      flightNumber: "BA117",
      passengers: 2,
      bags: 2,
      customerName: "Olivia Bennett",
      email: "olivia@example.com",
      phone: "+1 212 555 0142",
      notes: "Please wait at Terminal 7 arrivals.",
      fare: 96,
      distanceMiles: 24,
      stripeCheckoutSessionId: "cs_test_seed_confirmed",
      stripePaymentIntentId: "pi_test_seed_confirmed",
      paidAt: new Date(today.getTime() - 3600_000 * 4).toISOString(),
      createdAt: new Date(today.getTime() - 3600_000 * 5).toISOString(),
    },
    {
      reference: "AT-2M8X1B",
      status: "pending",
      paymentStatus: "unpaid",
      direction: "to-airport",
      airportId: "lhr-t2",
      destinationAddress: "Canary Wharf, London, UK",
      destinationLat: 51.5054,
      destinationLng: -0.0235,
      vehicleId: "mpv",
      pickupDate: iso(0),
      pickupTime: "06:15",
      flightNumber: "UA88",
      passengers: 4,
      bags: 5,
      customerName: "Marcus Lee",
      email: "marcus@example.com",
      phone: "+1 201 555 0188",
      notes: "",
      fare: 106,
      distanceMiles: 22,
      createdAt: new Date(today.getTime() - 3600_000 * 2).toISOString(),
    },
    {
      reference: "AT-5J0P4D",
      status: "completed",
      paymentStatus: "paid",
      direction: "from-airport",
      airportId: "lgw-south",
      destinationAddress: "Brighton, UK",
      destinationLat: 50.8225,
      destinationLng: -0.1372,
      vehicleId: "standard",
      pickupDate: iso(-1),
      pickupTime: "19:00",
      flightNumber: "DL402",
      passengers: 1,
      bags: 1,
      customerName: "Priya Nair",
      email: "priya@example.com",
      phone: "+1 718 555 0110",
      notes: "",
      fare: 56,
      distanceMiles: 18,
      stripeCheckoutSessionId: "cs_test_seed_completed",
      stripePaymentIntentId: "pi_test_seed_completed",
      paidAt: new Date(today.getTime() - 3600_000 * 28).toISOString(),
      createdAt: new Date(today.getTime() - 3600_000 * 30).toISOString(),
    },
  ]
  for (const b of samples) map.set(b.reference, b)
}

export function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `AT-${code}`
}

export async function saveBooking(booking: Booking): Promise<void> {
  bookings.set(booking.reference, booking)
}

export async function findBooking(reference: string): Promise<Booking | null> {
  return bookings.get(reference.trim().toUpperCase()) ?? null
}

export async function listBookings(): Promise<Booking[]> {
  return [...bookings.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function setBookingStatus(
  reference: string,
  status: BookingStatus,
): Promise<Booking | null> {
  const existing = bookings.get(reference)
  if (!existing) return null
  const updated = { ...existing, status }
  bookings.set(reference, updated)
  return updated
}

export async function markBookingAsPaid(
  reference: string,
  stripeCheckoutSessionId: string,
  stripePaymentIntentId?: string,
): Promise<Booking | null> {
  const existing = bookings.get(reference)
  if (!existing) return null

  const updated: Booking = {
    ...existing,
    status: existing.status === "pending" ? "confirmed" : existing.status,
    paymentStatus: "paid",
    stripeCheckoutSessionId,
    stripePaymentIntentId,
    paidAt: new Date().toISOString(),
  }

  bookings.set(reference, updated)
  return updated
}

export async function listVehiclesWithPricing(): Promise<VehicleClass[]> {
  return VEHICLE_CLASSES.map((v) => {
    const pricing = vehiclePricing.get(v.id)
    return pricing ? { ...v, ...pricing } : v
  })
}

export async function updateVehiclePricing(
  vehicleId: string,
  minFare: number,
  perMileAfter: number,
): Promise<VehicleClass | null> {
  const base = VEHICLE_CLASSES.find((v) => v.id === vehicleId)
  if (!base) return null
  vehiclePricing.set(vehicleId, { minFare, perMileAfter })
  return { ...base, minFare, perMileAfter }
}
