import { randomInt, randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { AdminUser, Booking, BookingAddOn, BookingStatus, CongestionZone, Customer, ReferralCommission, ReferralPayout, ReferralSettings, Destination, PromoCode, PromoDiscountType, Review, ReturnTripDiscount, SitePromotion, StopPricing, VehicleClass } from "./types"
import { DEFAULT_CONGESTION_ZONE } from "./fleet"
import { VEHICLE_CLASSES } from "./fleet"
import type { AdminRole } from "./admin-roles"

type BookingRow = {
  reference: string; status: BookingStatus; payment_status: Booking["paymentStatus"]; payment_method: Booking["paymentMethod"]
  direction: Booking["direction"]; airport_id: string; source_place_id: string | null; source_place_slug: string | null; destination_address: string
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
  review_requested_at: string | null
  referrer_customer_id?: string | null
}

type ReviewRow = {
  id: string; booking_reference: string; rating: number; comment: string; customer_name: string; created_at: string
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
    airportId: row.airport_id, sourcePlaceId: row.source_place_id ?? undefined, sourcePlaceSlug: row.source_place_slug ?? undefined, destinationAddress: row.destination_address,
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
    reviewRequestedAt: row.review_requested_at ?? undefined,
    referrerCustomerId: row.referrer_customer_id ?? undefined,
  }
}

function toReview(row: ReviewRow): Review {
  return { id: row.id, bookingReference: row.booking_reference, rating: row.rating, comment: row.comment, customerName: row.customer_name, createdAt: row.created_at }
}

function toBookingRow(booking: Booking): BookingRow {
  return {
    reference: booking.reference, status: booking.status, payment_status: booking.paymentStatus, payment_method: booking.paymentMethod, direction: booking.direction,
    airport_id: booking.airportId, source_place_id: booking.sourcePlaceId ?? null, source_place_slug: booking.sourcePlaceSlug ?? null, destination_address: booking.destinationAddress,
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
    review_requested_at: booking.reviewRequestedAt ?? null,
  }
}
type DatabaseError = { code?: string; message: string }

function isMissingRelationError(error: DatabaseError): boolean {
  // PostgREST returns PGRST205 when its schema cache cannot find a table.
  // Keep the message fallback for older PostgREST responses which omit a code.
  return error.code === "PGRST205" || /could not find (?:the )?(?:table|relation)/i.test(error.message)
}

function isMissingColumnError(error: DatabaseError): boolean {
  // PostgREST surfaces an unknown column as PostgreSQL's 42703, or as PGRST204 when its
  // schema cache is the one that hasn't caught up yet.
  return error.code === "42703" || error.code === "PGRST204" || /column .* does not exist/i.test(error.message)
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
export async function markReviewRequested(reference: string): Promise<void> {
  const { error } = await getSupabase().from("bookings").update({ review_requested_at: new Date().toISOString() }).eq("reference", reference.trim().toUpperCase())
  if (error) throwDatabaseError(error)
}
export async function findReviewByBooking(reference: string): Promise<Review | null> {
  const { data, error } = await getSupabase().from("reviews").select("*").eq("booking_reference", reference.trim().toUpperCase()).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toReview(data as ReviewRow) : null
}
export async function saveReview(review: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const { data, error } = await getSupabase()
    .from("reviews")
    .insert({ booking_reference: review.bookingReference, rating: review.rating, comment: review.comment, customer_name: review.customerName })
    .select("*")
    .single()
  if (error) throwDatabaseError(error)
  return toReview(data as ReviewRow)
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
  // Existing projects apply migrations one at a time, so the deadhead columns may not be
  // there yet. Retry without them rather than taking every page down: the code defaults
  // carry a deadhead rate of 0, which prices exactly as this engine did before.
  const base = "vehicle_id, min_fare, per_mile_after, per_minute_rate"
  let { data, error } = await getSupabase().from("vehicle_pricing").select(`${base}, long_distance_threshold_miles, deadhead_per_mile`)
  if (error && isMissingColumnError(error)) {
    ({ data, error } = await getSupabase().from("vehicle_pricing").select(base))
  }
  if (error) throwDatabaseError(error)
  type PricingRow = { vehicle_id: string; min_fare: number; per_mile_after: number; per_minute_rate: number; long_distance_threshold_miles?: number; deadhead_per_mile?: number }
  const prices = new Map((data as PricingRow[]).map((row) => [row.vehicle_id, {
    minFare: Number(row.min_fare),
    perMileAfter: Number(row.per_mile_after),
    perMinuteRate: Number(row.per_minute_rate),
    ...(row.long_distance_threshold_miles != null ? { longDistanceThresholdMiles: Number(row.long_distance_threshold_miles) } : {}),
    ...(row.deadhead_per_mile != null ? { deadheadPerMile: Number(row.deadhead_per_mile) } : {}),
  }]))
  return VEHICLE_CLASSES.map((vehicle) => ({ ...vehicle, ...prices.get(vehicle.id) }))
}
export async function updateVehiclePricing(vehicleId: string, minFare: number, perMileAfter: number, perMinuteRate: number, longDistanceThresholdMiles: number, deadheadPerMile: number): Promise<VehicleClass | null> {
  const base = VEHICLE_CLASSES.find((vehicle) => vehicle.id === vehicleId)
  if (!base) return null
  const { error } = await getSupabase().from("vehicle_pricing").upsert({ vehicle_id: vehicleId, min_fare: minFare, per_mile_after: perMileAfter, per_minute_rate: perMinuteRate, long_distance_threshold_miles: longDistanceThresholdMiles, deadhead_per_mile: deadheadPerMile }, { onConflict: "vehicle_id" })
  // Reads fall back to the code defaults when the deadhead columns are missing, but a write
  // must not: silently dropping the rate the admin just typed would look like it saved.
  if (error && isMissingColumnError(error)) {
    throw new Error("Deadhead pricing needs a database migration. Run supabase/migrations/20260906000000_add_deadhead_pricing.sql, then try again.")
  }
  if (error) throwDatabaseError(error)
  return { ...base, minFare, perMileAfter, perMinuteRate, longDistanceThresholdMiles, deadheadPerMile }
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

type CongestionZoneRow = { name: string; fee: number; zone: [number, number][]; updated_at: string }
function toCongestionZone(row: CongestionZoneRow): CongestionZone {
  return { name: row.name, fee: Number(row.fee), zone: row.zone ?? [], updatedAt: row.updated_at }
}
const DEFAULT_CONGESTION_ZONES: CongestionZone[] = [{ name: "Congestion Charge Zone", fee: 18, zone: DEFAULT_CONGESTION_ZONE, updatedAt: new Date(0).toISOString() }]
export async function listCongestionZones(): Promise<CongestionZone[]> {
  const { data, error } = await getSupabase().from("congestion_zones").select("*").order("name")
  if (error) {
    if (isMissingRelationError(error)) return DEFAULT_CONGESTION_ZONES
    throwDatabaseError(error)
  }
  return (data as CongestionZoneRow[]).map(toCongestionZone)
}
export async function upsertCongestionZone(name: string, fee: number, zone: [number, number][]): Promise<CongestionZone> {
  const { data, error } = await getSupabase().from("congestion_zones")
    .upsert({ name: name.trim(), fee, zone, updated_at: new Date().toISOString() }, { onConflict: "name" })
    .select("*").single()
  if (error) throwDatabaseError(error)
  return toCongestionZone(data as CongestionZoneRow)
}
export async function deleteCongestionZone(name: string): Promise<boolean> {
  const { error } = await getSupabase().from("congestion_zones").delete().eq("name", name.trim())
  if (error) throwDatabaseError(error)
  return true
}

// --- Accounts ---------------------------------------------------------------
// Password hashes never leave this module except through the `find*Credentials`
// lookups sign-in needs.

type AdminUserRow = { id: string; email: string; name: string; role: AdminRole; password_hash: string; active: boolean; must_change_password: boolean | null; created_at: string }
function toAdminUser(row: AdminUserRow): AdminUser {
  return { id: row.id, email: row.email, name: row.name, role: row.role, active: row.active, mustChangePassword: row.must_change_password ?? false, createdAt: row.created_at }
}
const isUniqueViolation = (error: DatabaseError) => error.code === "23505"

export async function findAdminCredentials(email: string): Promise<(AdminUser & { passwordHash: string }) | null> {
  const { data, error } = await getSupabase().from("admin_users").select("*").eq("email", email.trim().toLowerCase()).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? { ...toAdminUser(data as AdminUserRow), passwordHash: (data as AdminUserRow).password_hash } : null
}
export async function findAdminUser(id: string): Promise<AdminUser | null> {
  const { data, error } = await getSupabase().from("admin_users").select("*").eq("id", id).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toAdminUser(data as AdminUserRow) : null
}
export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await getSupabase().from("admin_users").select("*").order("created_at")
  if (error) throwDatabaseError(error)
  return (data as AdminUserRow[]).map(toAdminUser)
}
/** Returns `null` when the email is already taken. */
export async function createAdminUser(user: { email: string; name: string; role: AdminRole; passwordHash: string }): Promise<AdminUser | null> {
  const { data, error } = await getSupabase().from("admin_users")
    .insert({ email: user.email.trim().toLowerCase(), name: user.name.trim(), role: user.role, password_hash: user.passwordHash, must_change_password: true })
    .select("*").single()
  if (error) return isUniqueViolation(error) ? null : throwDatabaseError(error)
  return toAdminUser(data as AdminUserRow)
}
export async function updateAdminUser(id: string, changes: { role?: AdminRole; active?: boolean; passwordHash?: string; mustChangePassword?: boolean }): Promise<AdminUser | null> {
  const { data, error } = await getSupabase().from("admin_users")
    .update({ role: changes.role, active: changes.active, password_hash: changes.passwordHash, must_change_password: changes.mustChangePassword })
    .eq("id", id).select("*").maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toAdminUser(data as AdminUserRow) : null
}

type CustomerRow = {
  id: string; email: string; name: string; phone: string; password_hash: string; created_at: string
  email_verified: boolean; otp_hash: string | null; otp_expires_at: string | null; otp_attempts: number; referral_code: string | null; pending_email: string | null; google_sub: string | null
}
function toCustomer(row: CustomerRow): Customer {
  return { id: row.id, email: row.email, name: row.name, phone: row.phone, referralCode: row.referral_code ?? undefined }
}
export type CustomerCredentials = Customer & { passwordHash: string; emailVerified: boolean; otpHash: string | null; otpExpiresAt: string | null; otpAttempts: number; pendingEmail: string | null; googleSub: string | null }
function toCustomerCredentials(row: CustomerRow): CustomerCredentials {
  return { ...toCustomer(row), passwordHash: row.password_hash, emailVerified: row.email_verified, otpHash: row.otp_hash, otpExpiresAt: row.otp_expires_at, otpAttempts: row.otp_attempts, pendingEmail: row.pending_email ?? null, googleSub: row.google_sub ?? null }
}
export async function findCustomerCredentials(email: string): Promise<CustomerCredentials | null> {
  const { data, error } = await getSupabase().from("customers").select("*").eq("email", email.trim().toLowerCase()).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toCustomerCredentials(data as CustomerRow) : null
}
/** Only verified customers can hold a session. */
export async function findCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await getSupabase().from("customers").select("*").eq("id", id).eq("email_verified", true).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toCustomer(data as CustomerRow) : null
}
/**
 * Creates an unverified sign-up, or replaces the details of one still awaiting its code (so
 * someone who never verifies can't squat on an email). Returns `null` when the email already
 * belongs to a verified account, which is never overwritten.
 */
export async function savePendingCustomer(customer: { email: string; name: string; phone: string; passwordHash: string }): Promise<CustomerCredentials | null> {
  const row = { email: customer.email.trim().toLowerCase(), name: customer.name.trim(), phone: customer.phone.trim(), password_hash: customer.passwordHash }
  const inserted = await getSupabase().from("customers").insert(row).select("*").single()
  if (!inserted.error) return toCustomerCredentials(inserted.data as CustomerRow)
  if (!isUniqueViolation(inserted.error)) throwDatabaseError(inserted.error)
  const { data, error } = await getSupabase().from("customers").update(row).eq("email", row.email).eq("email_verified", false).select("*").maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toCustomerCredentials(data as CustomerRow) : null
}
export async function findCustomerCredentialsById(id: string): Promise<CustomerCredentials | null> {
  const { data, error } = await getSupabase().from("customers").select("*").eq("id", id).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toCustomerCredentials(data as CustomerRow) : null
}
/** Profile edits, a new password, or holding a new email until it's confirmed. */
export async function updateCustomerAccount(id: string, changes: Partial<Pick<CustomerRow, "name" | "phone" | "password_hash" | "pending_email">>): Promise<void> {
  const { error } = await getSupabase().from("customers").update(changes).eq("id", id)
  if (error) throwDatabaseError(error)
}
/** Makes the confirmed pending email the login email. Returns false if someone else took it meanwhile. */
export async function applyPendingEmail(id: string, email: string): Promise<boolean> {
  const { error } = await getSupabase().from("customers")
    .update({ email, pending_email: null, otp_hash: null, otp_expires_at: null, otp_attempts: 0 })
    .eq("id", id)
  if (error) return isUniqueViolation(error) ? false : throwDatabaseError(error)
  return true
}
export async function findCustomerCredentialsByGoogleSub(sub: string): Promise<CustomerCredentials | null> {
  const { data, error } = await getSupabase().from("customers").select("*").eq("google_sub", sub).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toCustomerCredentials(data as CustomerRow) : null
}
/**
 * Attaches a Google account to an existing customer with the same (Google-verified) email.
 * If that customer never finished signing up, Google now proves the email is theirs: the
 * account becomes verified and the unconfirmed password is dropped, since whoever set it
 * may not own the email.
 */
export async function linkGoogleAccount(customer: CustomerCredentials, sub: string): Promise<void> {
  const takeOver = customer.emailVerified ? {} : { email_verified: true, password_hash: "", otp_hash: null, otp_expires_at: null, otp_attempts: 0 }
  const { error } = await getSupabase().from("customers").update({ google_sub: sub, ...takeOver }).eq("id", customer.id)
  if (error) throwDatabaseError(error)
}
/** New customer from Google, already verified and without a password. `null` if the email was just taken. */
export async function createGoogleCustomer(customer: { email: string; name: string; sub: string }): Promise<Customer | null> {
  const { data, error } = await getSupabase().from("customers")
    .insert({ email: customer.email.trim().toLowerCase(), name: customer.name.trim(), phone: "", password_hash: "", email_verified: true, google_sub: customer.sub })
    .select("*").single()
  if (error) return isUniqueViolation(error) ? null : throwDatabaseError(error)
  return toCustomer(data as CustomerRow)
}
export async function updateCustomerVerification(id: string, changes: Partial<Pick<CustomerRow, "email_verified" | "otp_hash" | "otp_expires_at" | "otp_attempts">>): Promise<void> {
  const { error } = await getSupabase().from("customers").update(changes).eq("id", id)
  if (error) throwDatabaseError(error)
}
/**
 * Counts one code guess. Only succeeds if nobody else guessed since `seenAttempts` was read,
 * so parallel requests can't slip past the attempt limit.
 */
export async function claimOtpAttempt(id: string, seenAttempts: number): Promise<boolean> {
  const { data, error } = await getSupabase().from("customers").update({ otp_attempts: seenAttempts + 1 }).eq("id", id).eq("otp_attempts", seenAttempts).select("id")
  if (error) throwDatabaseError(error)
  return data.length === 1
}
/** Records who a booking belongs to and whose referral it came through (either may be absent). */
export async function linkBookingAccounts(reference: string, links: { customerId?: string; referrerId?: string }): Promise<void> {
  if (!links.customerId && !links.referrerId) return
  const { error } = await getSupabase().from("bookings")
    .update({ customer_id: links.customerId, referrer_customer_id: links.referrerId })
    .eq("reference", reference)
  if (error) throwDatabaseError(error)
}
export async function listCustomerBookings(customerId: string): Promise<Booking[]> {
  const { data, error } = await getSupabase().from("bookings").select("*").eq("customer_id", customerId).order("pickup_date", { ascending: false })
  if (error) throwDatabaseError(error)
  return (data as BookingRow[]).map(toBooking)
}

// --- Referrals ------------------------------------------------------------------

const REFERRAL_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = { active: false, commissionPercent: 5 }

/** Returns the customer's referral code, assigning a fresh unique one the first time. */
export async function ensureReferralCode(customerId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = ""
    for (let i = 0; i < 8; i++) code += REFERRAL_CODE_CHARS[randomInt(REFERRAL_CODE_CHARS.length)]
    // `is null` guard: never replaces a code that's already been shared.
    const { error } = await getSupabase().from("customers").update({ referral_code: code }).eq("id", customerId).is("referral_code", null)
    if (error && !isUniqueViolation(error)) throwDatabaseError(error)
    if (!error) break
  }
  const { data, error } = await getSupabase().from("customers").select("referral_code").eq("id", customerId).single()
  if (error) throwDatabaseError(error)
  return (data as { referral_code: string }).referral_code
}
export async function findCustomerByReferralCode(code: string): Promise<Customer | null> {
  const { data, error } = await getSupabase().from("customers").select("*").eq("referral_code", code.trim().toUpperCase()).eq("email_verified", true).maybeSingle()
  if (error) throwDatabaseError(error)
  return data ? toCustomer(data as CustomerRow) : null
}

type ReferralSettingsRow = { active: boolean; commission_percent: number }
export async function getReferralSettings(): Promise<ReferralSettings> {
  const { data, error } = await getSupabase().from("referral_settings").select("active, commission_percent").eq("id", true).maybeSingle()
  if (error) {
    if (isMissingRelationError(error)) return DEFAULT_REFERRAL_SETTINGS
    throwDatabaseError(error)
  }
  const row = data as ReferralSettingsRow | null
  return row ? { active: row.active, commissionPercent: Number(row.commission_percent) } : DEFAULT_REFERRAL_SETTINGS
}
export async function updateReferralSettings(active: boolean, commissionPercent: number): Promise<void> {
  const { error } = await getSupabase().from("referral_settings")
    .upsert({ id: true, active, commission_percent: commissionPercent, updated_at: new Date().toISOString() }, { onConflict: "id" })
  if (error) throwDatabaseError(error)
}

/** No-op if this booking already earned a commission. */
export async function recordReferralCommission(bookingReference: string, referrerId: string, amount: number): Promise<void> {
  const { error } = await getSupabase().from("referral_commissions")
    .upsert({ booking_reference: bookingReference, referrer_customer_id: referrerId, amount }, { onConflict: "booking_reference", ignoreDuplicates: true })
  if (error) throwDatabaseError(error)
}
/** Withdraws a commission that hasn't been paid yet (e.g. the ride was cancelled after all). */
export async function deletePendingReferralCommission(bookingReference: string): Promise<void> {
  const { error } = await getSupabase().from("referral_commissions").delete().eq("booking_reference", bookingReference).eq("status", "pending")
  if (error) throwDatabaseError(error)
}

type ReferralCommissionRow = {
  booking_reference: string; referrer_customer_id: string; amount: number; status: ReferralCommission["status"]; created_at: string; paid_at: string | null
  customers?: { name: string; email: string; referral_code: string | null } | null
  bookings?: { pickup_date: string; customer_name: string; vehicle_id: string; fare: number } | null
}
/** "Sarah Jane Khan" → "Sarah K.": enough for a referrer to recognise their friend, no more. */
function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0] ?? ""
}
function toReferralCommission(row: ReferralCommissionRow): ReferralCommission {
  return {
    bookingReference: row.booking_reference, referrerCustomerId: row.referrer_customer_id, amount: Number(row.amount),
    status: row.status, createdAt: row.created_at, paidAt: row.paid_at ?? undefined,
    referrer: row.customers ? { name: row.customers.name, email: row.customers.email, referralCode: row.customers.referral_code } : undefined,
    ride: row.bookings ? {
      date: row.bookings.pickup_date,
      passenger: shortName(row.bookings.customer_name),
      vehicle: VEHICLE_CLASSES.find((vehicle) => vehicle.id === row.bookings!.vehicle_id)?.name ?? row.bookings.vehicle_id,
      fare: Number(row.bookings.fare),
    } : undefined,
  }
}
/** Every commission (with the referrer joined), or just one referrer's. Newest first. */
export async function listReferralCommissions(referrerId?: string): Promise<ReferralCommission[]> {
  let query = getSupabase().from("referral_commissions").select("*, customers(name, email, referral_code), bookings(pickup_date, customer_name, vehicle_id, fare)").order("created_at", { ascending: false })
  if (referrerId) query = query.eq("referrer_customer_id", referrerId)
  const { data, error } = await query
  if (error) {
    if (isMissingRelationError(error)) return []
    throwDatabaseError(error)
  }
  return (data as ReferralCommissionRow[]).map(toReferralCommission)
}
const RECEIPTS_BUCKET = "referral-receipts"
export const RECEIPT_MAX_BYTES = 200 * 1024 // 200 KB

/** Stores a transfer receipt privately and returns its storage path. */
export async function uploadReferralReceipt(referrerId: string, file: File): Promise<string> {
  const path = `${referrerId}/${randomUUID()}.jpg`
  const { error } = await getSupabase().storage.from(RECEIPTS_BUCKET).upload(path, file, { contentType: "image/jpeg" })
  if (error) throwDatabaseError(error)
  return path
}
/** Receipts are JPEG only (.jpg/.jpeg) and at most 200 KB; checks the file really is a JPEG, not just its name. */
export async function isAllowedReceipt(file: File): Promise<boolean> {
  if (file.size === 0 || file.size > RECEIPT_MAX_BYTES || file.type !== "image/jpeg") return false
  const [a, b, c] = new Uint8Array(await file.slice(0, 3).arrayBuffer())
  return a === 0xff && b === 0xd8 && c === 0xff // JPEG signature
}
export async function removeReferralReceipt(path: string): Promise<void> {
  await getSupabase().storage.from(RECEIPTS_BUCKET).remove([path])
}

/**
 * Settles the given pending commissions against an uploaded receipt, atomically (see the
 * record_referral_payout function). Returns `null` when none of them is still owed.
 */
export async function recordReferralPayout(referrerId: string, bookingReferences: string[], receiptPath: string, paidBy: string): Promise<{ id: string; amount: number } | null> {
  const { data, error } = await getSupabase().rpc("record_referral_payout", { p_referrer: referrerId, p_references: bookingReferences, p_receipt_path: receiptPath, p_paid_by: paidBy })
  if (error) return /Nothing is owed/.test(error.message) ? null : throwDatabaseError(error)
  const result = data as { id: string; amount: number }
  return { id: result.id, amount: Number(result.amount) }
}

type ReferralPayoutRow = { id: string; referrer_customer_id: string; amount: number; receipt_path: string; created_at: string; customers?: { name: string; email: string } | null }
/** Payouts newest first, each with a receipt link valid for an hour. All of them, or one referrer's. */
export async function listReferralPayouts(referrerId?: string): Promise<ReferralPayout[]> {
  let query = getSupabase().from("referral_payouts").select("*, customers(name, email)").order("created_at", { ascending: false })
  if (referrerId) query = query.eq("referrer_customer_id", referrerId)
  const { data, error } = await query
  if (error) {
    if (isMissingRelationError(error)) return []
    throwDatabaseError(error)
  }
  const rows = data as ReferralPayoutRow[]
  if (rows.length === 0) return []
  const { data: signed } = await getSupabase().storage.from(RECEIPTS_BUCKET).createSignedUrls(rows.map((row) => row.receipt_path), 60 * 60)
  const urls = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]))
  return rows.map((row) => ({
    id: row.id, referrerCustomerId: row.referrer_customer_id, amount: Number(row.amount), createdAt: row.created_at,
    receiptUrl: urls.get(row.receipt_path) ?? undefined,
    referrer: row.customers ? { name: row.customers.name, email: row.customers.email } : undefined,
  }))
}
