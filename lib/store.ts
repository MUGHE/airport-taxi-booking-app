import { createClient } from "@supabase/supabase-js"
import type { Booking, BookingStatus, VehicleClass } from "./types"
import { VEHICLE_CLASSES } from "./fleet"

type BookingRow = {
  reference: string; status: BookingStatus; payment_status: Booking["paymentStatus"]
  direction: Booking["direction"]; airport_id: string; destination_address: string
  destination_lat: number; destination_lng: number; vehicle_id: string; pickup_date: string; pickup_time: string
  flight_number: string; passengers: number; bags: number; customer_name: string; email: string; phone: string
  notes: string; fare: number; distance_miles: number; stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null; paid_at: string | null; created_at: string
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
  // Server-only module: never expose this service-role key to browser code.
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

function toBooking(row: BookingRow): Booking {
  return {
    reference: row.reference, status: row.status, paymentStatus: row.payment_status, direction: row.direction,
    airportId: row.airport_id, destinationAddress: row.destination_address,
    destinationLat: Number(row.destination_lat), destinationLng: Number(row.destination_lng), vehicleId: row.vehicle_id,
    pickupDate: row.pickup_date, pickupTime: row.pickup_time, flightNumber: row.flight_number,
    passengers: row.passengers, bags: row.bags, customerName: row.customer_name, email: row.email, phone: row.phone,
    notes: row.notes, fare: Number(row.fare), distanceMiles: Number(row.distance_miles),
    stripeCheckoutSessionId: row.stripe_checkout_session_id ?? undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined, paidAt: row.paid_at ?? undefined, createdAt: row.created_at,
  }
}

function toBookingRow(booking: Booking): BookingRow {
  return {
    reference: booking.reference, status: booking.status, payment_status: booking.paymentStatus, direction: booking.direction,
    airport_id: booking.airportId, destination_address: booking.destinationAddress,
    destination_lat: booking.destinationLat, destination_lng: booking.destinationLng, vehicle_id: booking.vehicleId,
    pickup_date: booking.pickupDate, pickup_time: booking.pickupTime, flight_number: booking.flightNumber,
    passengers: booking.passengers, bags: booking.bags, customer_name: booking.customerName, email: booking.email,
    phone: booking.phone, notes: booking.notes, fare: booking.fare, distance_miles: booking.distanceMiles,
    stripe_checkout_session_id: booking.stripeCheckoutSessionId ?? null,
    stripe_payment_intent_id: booking.stripePaymentIntentId ?? null, paid_at: booking.paidAt ?? null, created_at: booking.createdAt,
  }
}
function throwDatabaseError(error: { message: string }): never { throw new Error(`Database request failed: ${error.message}`) }

export function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `AT-${code}`
}
export async function saveBooking(booking: Booking): Promise<void> {
  const { error } = await getSupabase().from("bookings").insert(toBookingRow(booking))
  if (error) throwDatabaseError(error)
}
export async function findBooking(reference: string): Promise<Booking | null> {
  const { data, error } = await getSupabase().from("bookings").select("*").eq("reference", reference.trim().toUpperCase()).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toBooking(data as BookingRow) : null
}
export async function listBookings(): Promise<Booking[]> {
  const { data, error } = await getSupabase().from("bookings").select("*").order("created_at", { ascending: false })
  if (error) throwDatabaseError(error)
  return (data as BookingRow[]).map(toBooking)
}
export async function setBookingStatus(reference: string, status: BookingStatus): Promise<Booking | null> {
  const { data, error } = await getSupabase().from("bookings").update({ status }).eq("reference", reference.trim().toUpperCase()).select("*").maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toBooking(data as BookingRow) : null
}
export async function markBookingAsPaid(reference: string, stripeCheckoutSessionId: string, stripePaymentIntentId?: string): Promise<Booking | null> {
  const existing = await findBooking(reference)
  if (!existing) return null
  const { data, error } = await getSupabase().from("bookings").update({
    status: existing.status === "pending" ? "confirmed" : existing.status, payment_status: "paid",
    stripe_checkout_session_id: stripeCheckoutSessionId, stripe_payment_intent_id: stripePaymentIntentId ?? null, paid_at: new Date().toISOString(),
  }).eq("reference", existing.reference).select("*").single()
  if (error) throwDatabaseError(error)
  return toBooking(data as BookingRow)
}
export async function listVehiclesWithPricing(): Promise<VehicleClass[]> {
  const { data, error } = await getSupabase().from("vehicle_pricing").select("vehicle_id, min_fare, per_mile_after, per_minute_rate")
  if (error) throwDatabaseError(error)
  const prices = new Map((data as Array<{ vehicle_id: string; min_fare: number; per_mile_after: number; per_minute_rate: number }>).map((row) => [row.vehicle_id, { minFare: Number(row.min_fare), perMileAfter: Number(row.per_mile_after), perMinuteRate: Number(row.per_minute_rate) }]))
  return VEHICLE_CLASSES.map((vehicle) => ({ ...vehicle, ...prices.get(vehicle.id) }))
}
export async function updateVehiclePricing(vehicleId: string, minFare: number, perMileAfter: number, perMinuteRate: number): Promise<VehicleClass | null> {
  const base = VEHICLE_CLASSES.find((vehicle) => vehicle.id === vehicleId)
  if (!base) return null
  const { error } = await getSupabase().from("vehicle_pricing").upsert({ vehicle_id: vehicleId, min_fare: minFare, per_mile_after: perMileAfter, per_minute_rate: perMinuteRate }, { onConflict: "vehicle_id" })
  if (error) throwDatabaseError(error)
  return { ...base, minFare, perMileAfter, perMinuteRate }
}
