import { randomInt } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { Booking, BookingAddOn, BookingStatus, Destination, PromoCode, PromoDiscountType, ReturnTripDiscount, SitePromotion, StopPricing, VehicleClass } from "./types"
import { VEHICLE_CLASSES } from "./fleet"

type BookingRow = {
  reference: string; status: BookingStatus; payment_status: Booking["paymentStatus"]; payment_method: Booking["paymentMethod"]
  direction: Booking["direction"]; airport_id: string; destination_address: string
  destination_lat: number; destination_lng: number; vehicle_id: string; pickup_date: string; pickup_time: string
  pickup_address: string | null; pickup_lat: number | null; pickup_lng: number | null
  dropoff_address: string | null; dropoff_lat: number | null; dropoff_lng: number | null
  flight_number: string; passengers: number; bags: number; customer_name: string; email: string; phone: string
  notes: string; fare: number; distance_miles: number; stripe_checkout_session_id: string | null
  add_ons: BookingAddOn[] | null; add_ons_total: number | null
  stops: Destination[] | null; stops_total: number | null
  promo_code: string | null; discount_amount: number | null
  outbound_trip_reference: string | null; return_trip_reference: string | null
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
    reference: row.reference, status: row.status, paymentStatus: row.payment_status,
    // Falls back to "card" for rows written before the payment_method column existed.
    paymentMethod: row.payment_method ?? "card", direction: row.direction,
    airportId: row.airport_id, destinationAddress: row.destination_address,
    destinationLat: Number(row.destination_lat), destinationLng: Number(row.destination_lng), vehicleId: row.vehicle_id,
    pickupAddress: row.pickup_address ?? undefined, pickupLat: row.pickup_lat ?? undefined, pickupLng: row.pickup_lng ?? undefined,
    dropoffAddress: row.dropoff_address ?? undefined, dropoffLat: row.dropoff_lat ?? undefined, dropoffLng: row.dropoff_lng ?? undefined,
    pickupDate: row.pickup_date, pickupTime: row.pickup_time, flightNumber: row.flight_number,
    passengers: row.passengers, bags: row.bags, customerName: row.customer_name, email: row.email, phone: row.phone,
    notes: row.notes, fare: Number(row.fare), distanceMiles: Number(row.distance_miles),
    addOns: row.add_ons ?? [], addOnsTotal: Number(row.add_ons_total ?? 0),
    stops: row.stops ?? [], stopsTotal: Number(row.stops_total ?? 0),
    promoCode: row.promo_code ?? undefined, discountAmount: Number(row.discount_amount ?? 0),
    outboundTripReference: row.outbound_trip_reference ?? undefined, returnTripReference: row.return_trip_reference ?? undefined,
    stripeCheckoutSessionId: row.stripe_checkout_session_id ?? undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined, paidAt: row.paid_at ?? undefined, createdAt: row.created_at,
  }
}

function toBookingRow(booking: Booking): BookingRow {
  return {
    reference: booking.reference, status: booking.status, payment_status: booking.paymentStatus, payment_method: booking.paymentMethod, direction: booking.direction,
    airport_id: booking.airportId, destination_address: booking.destinationAddress,
    destination_lat: booking.destinationLat, destination_lng: booking.destinationLng, vehicle_id: booking.vehicleId,
    pickup_address: booking.pickupAddress ?? null, pickup_lat: booking.pickupLat ?? null, pickup_lng: booking.pickupLng ?? null,
    dropoff_address: booking.dropoffAddress ?? null, dropoff_lat: booking.dropoffLat ?? null, dropoff_lng: booking.dropoffLng ?? null,
    pickup_date: booking.pickupDate, pickup_time: booking.pickupTime, flight_number: booking.flightNumber,
    passengers: booking.passengers, bags: booking.bags, customer_name: booking.customerName, email: booking.email,
    phone: booking.phone, notes: booking.notes, fare: booking.fare, distance_miles: booking.distanceMiles,
    add_ons: booking.addOns, add_ons_total: booking.addOnsTotal,
    stops: booking.stops, stops_total: booking.stopsTotal,
    promo_code: booking.promoCode ?? null, discount_amount: booking.discountAmount,
    outbound_trip_reference: booking.outboundTripReference ?? null, return_trip_reference: booking.returnTripReference ?? null,
    stripe_checkout_session_id: booking.stripeCheckoutSessionId ?? null,
    stripe_payment_intent_id: booking.stripePaymentIntentId ?? null, paid_at: booking.paidAt ?? null, created_at: booking.createdAt,
  }
}
type DatabaseError = { code?: string; message: string }

function isMissingRelationError(error: DatabaseError): boolean {
  // PostgREST returns PGRST205 when its schema cache cannot find a table.
  // Keep the message fallback for older PostgREST responses which omit a code.
  return error.code === "PGRST205" || /could not find (?:the )?(?:table|relation)/i.test(error.message)
}

function throwDatabaseError(error: DatabaseError): never { throw new Error(`Database request failed: ${error.message}`) }

export function generateReference(): string {
  // A booking's reference doubles as the only credential needed to look it up (/track,
  // /booking/[reference]) and to start checkout for it, so it needs to be hard to guess or
  // brute-force, not just unique. 12 chars from this 32-symbol alphabet is ~60 bits of
  // entropy (vs. ~30 bits at the old 6 chars) — computationally infeasible to enumerate —
  // drawn from Node's CSPRNG (crypto.randomInt) rather than Math.random(), which is not
  // cryptographically secure.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 12; i++) code += chars[randomInt(chars.length)]
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
/** Overwrites an existing booking's editable fields (support corrections) — the caller supplies the full, already-repriced booking. */
export async function replaceBooking(booking: Booking): Promise<Booking | null> {
  const { data, error } = await getSupabase().from("bookings").update(toBookingRow(booking)).eq("reference", booking.reference).select("*").maybeSingle()
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
/** Records that `returnReference` is the return leg booked alongside `outboundReference`. */
export async function linkReturnTrip(outboundReference: string, returnReference: string): Promise<void> {
  const { error } = await getSupabase().from("bookings").update({ return_trip_reference: returnReference }).eq("reference", outboundReference)
  if (error) throwDatabaseError(error)
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

export type AddOnRow = BookingAddOn & { active: boolean }

export async function listActiveAddOns(): Promise<BookingAddOn[]> {
  const { data, error } = await getSupabase().from("booking_add_ons").select("id, name, price").eq("active", true).order("name")
  // Existing projects can be upgraded one migration at a time. Until the
  // add-ons migration is applied, keep booking available without add-ons
  // rather than crashing the whole page with Supabase's 404 response.
  if (error) {
    if (isMissingRelationError(error)) return []
    throwDatabaseError(error)
  }
  return (data as BookingAddOn[]).map((item) => ({ ...item, price: Number(item.price) }))
}
export async function listAddOns(): Promise<AddOnRow[]> {
  const { data, error } = await getSupabase().from("booking_add_ons").select("id, name, price, active").order("name")
  if (error) throwDatabaseError(error)
  return (data as AddOnRow[]).map((item) => ({ ...item, price: Number(item.price) }))
}
export async function upsertAddOn(addOn: AddOnRow): Promise<AddOnRow | null> {
  const { data, error } = await getSupabase().from("booking_add_ons").upsert(addOn).select("id, name, price, active").maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? { ...(data as AddOnRow), price: Number(data.price) } : null
}
export async function deleteAddOn(id: string): Promise<boolean> {
  const { error } = await getSupabase().from("booking_add_ons").delete().eq("id", id)
  if (error) throwDatabaseError(error)
  return true
}

type PromoCodeRow = { code: string; discount_type: PromoDiscountType; discount_value: number; active: boolean; created_at: string }
function toPromoCode(row: PromoCodeRow): PromoCode {
  return { code: row.code, discountType: row.discount_type, discountValue: Number(row.discount_value), active: row.active, createdAt: row.created_at }
}
export async function listPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await getSupabase().from("promo_codes").select("*").order("created_at", { ascending: false })
  if (error) throwDatabaseError(error)
  return (data as PromoCodeRow[]).map(toPromoCode)
}
/** Looks up a code and returns it only if it is currently enabled — the sole gate admins use to turn a code on/off. */
export async function findActivePromoCode(code: string): Promise<PromoCode | null> {
  const { data, error } = await getSupabase().from("promo_codes").select("*").eq("code", code.trim().toUpperCase()).eq("active", true).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toPromoCode(data as PromoCodeRow) : null
}
export async function upsertPromoCode(promo: { code: string; discountType: PromoDiscountType; discountValue: number; active: boolean }): Promise<PromoCode | null> {
  const { data, error } = await getSupabase().from("promo_codes")
    .upsert({ code: promo.code.trim().toUpperCase(), discount_type: promo.discountType, discount_value: promo.discountValue, active: promo.active }, { onConflict: "code" })
    .select("*").maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toPromoCode(data as PromoCodeRow) : null
}
export async function deletePromoCode(code: string): Promise<boolean> {
  const { error } = await getSupabase().from("promo_codes").delete().eq("code", code.trim().toUpperCase())
  if (error) throwDatabaseError(error)
  return true
}

type SitePromotionRow = { active: boolean; discount_percent: number; updated_at: string }
function toSitePromotion(row: SitePromotionRow): SitePromotion {
  return { active: row.active, discountPercent: Number(row.discount_percent), updatedAt: row.updated_at }
}
const DEFAULT_PROMOTION: SitePromotion = { active: false, discountPercent: 0, updatedAt: new Date(0).toISOString() }
export async function getSitePromotion(): Promise<SitePromotion> {
  const { data, error } = await getSupabase().from("site_promotion").select("active, discount_percent, updated_at").eq("id", true).maybeSingle()
  // A missing optional promotions table must not make public pages 404 while
  // an existing Supabase project is being migrated.
  if (error) {
    if (isMissingRelationError(error)) return DEFAULT_PROMOTION
    throwDatabaseError(error)
  }
  return data ? toSitePromotion(data as SitePromotionRow) : DEFAULT_PROMOTION
}
export async function updateSitePromotion(active: boolean, discountPercent: number): Promise<SitePromotion> {
  const { data, error } = await getSupabase().from("site_promotion")
    .upsert({ id: true, active, discount_percent: discountPercent, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("active, discount_percent, updated_at").single()
  if (error) throwDatabaseError(error)
  return toSitePromotion(data as SitePromotionRow)
}

type ReturnTripDiscountRow = { active: boolean; discount_percent: number; updated_at: string }
function toReturnTripDiscount(row: ReturnTripDiscountRow): ReturnTripDiscount {
  return { active: row.active, discountPercent: Number(row.discount_percent), updatedAt: row.updated_at }
}
const DEFAULT_RETURN_TRIP_DISCOUNT: ReturnTripDiscount = { active: false, discountPercent: 10, updatedAt: new Date(0).toISOString() }
export async function getReturnTripDiscount(): Promise<ReturnTripDiscount> {
  const { data, error } = await getSupabase().from("return_trip_discount").select("active, discount_percent, updated_at").eq("id", true).maybeSingle()
  // Same graceful degradation as getSitePromotion — a project that hasn't run this migration yet
  // just doesn't offer a return-trip discount, rather than 404ing every page that reads it.
  if (error) {
    if (isMissingRelationError(error)) return DEFAULT_RETURN_TRIP_DISCOUNT
    throwDatabaseError(error)
  }
  return data ? toReturnTripDiscount(data as ReturnTripDiscountRow) : DEFAULT_RETURN_TRIP_DISCOUNT
}
export async function updateReturnTripDiscount(active: boolean, discountPercent: number): Promise<ReturnTripDiscount> {
  const { data, error } = await getSupabase().from("return_trip_discount")
    .upsert({ id: true, active, discount_percent: discountPercent, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("active, discount_percent, updated_at").single()
  if (error) throwDatabaseError(error)
  return toReturnTripDiscount(data as ReturnTripDiscountRow)
}

type StopPricingRow = { price_per_stop: number; updated_at: string }
function toStopPricing(row: StopPricingRow): StopPricing {
  return { pricePerStop: Number(row.price_per_stop), updatedAt: row.updated_at }
}
const DEFAULT_STOP_PRICING: StopPricing = { pricePerStop: 5, updatedAt: new Date(0).toISOString() }
export async function getStopPricing(): Promise<StopPricing> {
  const { data, error } = await getSupabase().from("stop_pricing").select("price_per_stop, updated_at").eq("id", true).maybeSingle()
  // Same graceful degradation as getSitePromotion — a project that hasn't run this migration
  // yet just falls back to the default per-stop fee, rather than 404ing every page.
  if (error) {
    if (isMissingRelationError(error)) return DEFAULT_STOP_PRICING
    throwDatabaseError(error)
  }
  return data ? toStopPricing(data as StopPricingRow) : DEFAULT_STOP_PRICING
}
export async function updateStopPricing(pricePerStop: number): Promise<StopPricing> {
  const { data, error } = await getSupabase().from("stop_pricing")
    .upsert({ id: true, price_per_stop: pricePerStop, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("price_per_stop, updated_at").single()
  if (error) throwDatabaseError(error)
  return toStopPricing(data as StopPricingRow)
}
