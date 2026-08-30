"use server"

import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  findActivePromoCode,
  findBooking,
  generateReference,
  getReturnTripDiscount as getStoredReturnTripDiscount,
  getSitePromotion as getStoredSitePromotion,
  getStopPricing as getStoredStopPricing,
  linkReturnTrip,
  listBookings,
  listActiveAddOns,
  listAddOns,
  listPromoCodes,
  listVehiclesWithPricing,
  markBookingAsPaid,
  replaceBooking,
  saveBooking,
  setBookingStatus,
  updateReturnTripDiscount as setReturnTripDiscount,
  updateSitePromotion as setSitePromotion,
  updateStopPricing as setStopPricing,
  updateVehiclePricing as setVehiclePricing,
  upsertAddOn as saveAddOn,
  upsertPromoCode as savePromoCode,
} from "./store"
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "./auth"
import { isAdminAuthenticated } from "./session"
import type { Booking, BookingAddOn, BookingStatus, Destination, NewBookingInput, PaymentMethod, PromoCode, PromoDiscountType, ReturnTripDiscount, SitePromotion, StopPricing, VehicleClass } from "./types"
import { getStripeClient } from "./stripe"
import { calculateDrivingRoute } from "./google-distance"
import { applyPromotion, computeDiscount, computeFare } from "./fleet"
import { sendBookingNotificationEmails, sendBookingUpdateEmail } from "./email"


export interface LoginResult {
  ok: boolean
  error?: string
}

export async function loginAdmin(password: string): Promise<LoginResult> {
  const expectedPassword = process.env.ADMIN_PASSWORD
  if (!expectedPassword) {
    return {
      ok: false,
      error: "Admin login isn't configured. Set ADMIN_PASSWORD on the server.",
    }
  }
  if (!password || password !== expectedPassword) {
    return { ok: false, error: "Incorrect password." }
  }

  const token = await createSessionToken()
  const store = await cookies()
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })

  return { ok: true }
}

export async function logoutAdmin(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_SESSION_COOKIE)
}

export interface CreateBookingResult {
  ok: boolean
  reference?: string
  error?: string
}

// Keeps routes reasonable and bounds the per-booking cost of extra Routes API stops.
const MAX_STOPS = 3

async function buildAndSaveBooking(
  input: NewBookingInput & { addOnIds: string[] },
  options: { extraDiscountPercent?: number; outboundTripReference?: string } = {},
): Promise<CreateBookingResult> {
  if (!input.customerName?.trim()) return { ok: false, error: "Name is required." }
  if (!input.email?.trim()) return { ok: false, error: "Email is required." }
  if (!input.phone?.trim()) return { ok: false, error: "Phone is required." }
  if (input.paymentMethod !== "card" && input.paymentMethod !== "cash") return { ok: false, error: "Please choose how you'd like to pay." }
  if (!input.vehicleId) return { ok: false, error: "Please complete your trip details." }
  if (!Number.isFinite(input.pickupLat) || !Number.isFinite(input.pickupLng) || !Number.isFinite(input.dropoffLat) || !Number.isFinite(input.dropoffLng)) {
    return { ok: false, error: "Please select both pickup and drop-off locations." }
  }
  if (!input.pickupDate || !input.pickupTime) {
    return { ok: false, error: "Please choose a pickup date and time." }
  }
  const serverToday = new Date().toISOString().slice(0, 10)
  if (input.pickupDate < serverToday) {
    return { ok: false, error: "Pickup date can't be in the past." }
  }
  const stops = (input.stops || []).slice(0, MAX_STOPS)
  if (stops.some((stop) => !stop.address?.trim() || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lng))) {
    return { ok: false, error: "Please select a valid location for each stop." }
  }

  const vehicles = await listVehiclesWithPricing()
  const vehicle = vehicles.find((v) => v.id === input.vehicleId)
  if (!vehicle) return { ok: false, error: "Unknown vehicle." }
  if (input.passengers > vehicle.capacity || input.bags > vehicle.luggage) {
    return { ok: false, error: "Passenger or bag count exceeds this vehicle's capacity." }
  }

  const route = await calculateDrivingRoute(
    { lat: input.pickupLat!, lng: input.pickupLng! },
    { lat: input.dropoffLat!, lng: input.dropoffLng! },
    stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
  )
  if (route == null) return { ok: false, error: "Unable to price this trip." }

  const quote = computeFare(vehicle, route.distanceMiles, route.durationMinutes)
  const promotion = await getStoredSitePromotion()
  let vehicleFare = promotion.active ? applyPromotion(quote.fare, promotion.discountPercent) : quote.fare
  // The return-trip discount (if any) stacks on top of the site-wide promotion — same
  // rule promo codes already follow below.
  if (options.extraDiscountPercent) vehicleFare = applyPromotion(vehicleFare, options.extraDiscountPercent)
  const availableAddOns = await listActiveAddOns()
  const selectedIds = new Set(input.addOnIds)
  const addOns = availableAddOns.filter((addOn) => selectedIds.has(addOn.id))
  const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0)
  // Never trust a client-supplied per-stop price — always the current admin-set rate.
  const stopPricing = await getStoredStopPricing()
  const stopsTotal = stops.length * stopPricing.pricePerStop
  const subtotal = vehicleFare + addOnsTotal + stopsTotal

  // Never trust a client-supplied discount amount — re-look-up the code and recompute
  // server-side, since it may have been disabled or changed since the customer applied it.
  let discountAmount = 0
  let promoCode: string | undefined
  if (input.promoCode?.trim()) {
    const promo = await findActivePromoCode(input.promoCode)
    if (!promo) return { ok: false, error: "This promo code is no longer valid. Remove it to continue." }
    discountAmount = computeDiscount(subtotal, promo)
    promoCode = promo.code
  }

  const booking: Booking = {
    ...input,
    reference: generateReference(),
    // A card booking is "pending" until Stripe checkout completes; a cash booking has
    // nothing left to collect online, so it's confirmed immediately — the fare is paid
    // to the driver at the end of the journey instead.
    status: input.paymentMethod === "cash" ? "confirmed" : "pending",
    paymentStatus: "unpaid",
    fare: Math.max(0, subtotal - discountAmount),
    distanceMiles: quote.distanceMiles,
    addOns,
    addOnsTotal,
    stops,
    stopsTotal,
    promoCode,
    discountAmount,
    outboundTripReference: options.outboundTripReference,
    createdAt: new Date().toISOString(),
  }

  await saveBooking(booking)
  revalidatePath("/admin")

  // Don't let a slow/failing email provider hold up the booking response —
  // sendBookingNotificationEmails already swallows and logs its own errors.
  sendBookingNotificationEmails(booking).catch((error) => {
    console.error("Unexpected error sending booking emails:", error)
  })

  return { ok: true, reference: booking.reference }
}

export async function createBooking(input: NewBookingInput & { addOnIds: string[] }): Promise<CreateBookingResult> {
  return buildAndSaveBooking(input)
}

/**
 * Books the return leg for an existing (outbound) booking. Route and fare are computed the
 * same way as any other booking — pickup/drop-off are simply reversed by the caller — with
 * the admin-configured return-trip discount (if active) applied on top.
 */
export async function createReturnBooking(
  outboundReference: string,
  input: NewBookingInput & { addOnIds: string[] },
): Promise<CreateBookingResult> {
  const outbound = await findBooking(outboundReference)
  if (!outbound) return { ok: false, error: "Outbound booking not found." }
  if (outbound.outboundTripReference) return { ok: false, error: "Can't attach a return trip to a return trip." }
  if (outbound.returnTripReference) return { ok: false, error: "This booking already has a return trip." }

  const discount = await getStoredReturnTripDiscount()
  const result = await buildAndSaveBooking(input, {
    extraDiscountPercent: discount.active ? discount.discountPercent : 0,
    outboundTripReference: outboundReference,
  })
  if (result.ok && result.reference) {
    await linkReturnTrip(outboundReference, result.reference)
    revalidatePath(`/booking/${outboundReference}`)
  }
  return result
}

export interface StartCheckoutResult {
  ok: boolean
  url?: string
  error?: string
}

export async function startBookingCheckout(
  reference: string,
): Promise<StartCheckoutResult> {
  const normalizedReference = reference.trim().toUpperCase()
  if (!normalizedReference) {
    return { ok: false, error: "Missing booking reference." }
  }

  const booking = await findBooking(normalizedReference)
  if (!booking) {
    return { ok: false, error: "Booking not found." }
  }
  if (booking.paymentStatus === "paid") {
    return { ok: false, error: "This booking is already paid." }
  }
  if (booking.paymentMethod === "cash") {
    return { ok: false, error: "This booking is set to pay cash to the driver." }
  }

  try {
    const stripe = getStripeClient()
    const appUrl = await getAppUrl()
    const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase()
    const pickupLabel = `${booking.pickupDate} ${booking.pickupTime}`

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.email,
      success_url: `${appUrl}/booking/${booking.reference}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booking/${booking.reference}?payment=cancelled`,
      payment_method_types: ["card"],
      metadata: {
        bookingReference: booking.reference,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: Math.round(booking.fare * 100),
            product_data: {
              name: `Airport transfer ${booking.reference}`,
              description: `Pickup ${pickupLabel}`,
            },
          },
        },
      ],
    })

    if (!checkoutSession.url) {
      return { ok: false, error: "Unable to create checkout session." }
    }

    return { ok: true, url: checkoutSession.url }
  } catch (error) {
    if (error instanceof Error && error.message === "STRIPE_SECRET_KEY is missing.") {
      return {
        ok: false,
        error: "Payments are not configured. Add STRIPE_SECRET_KEY to the server environment and restart the app.",
      }
    }

    return {
      ok: false,
      error: "Payment is temporarily unavailable. Please try again.",
    }
  }
}

export async function confirmBookingPayment(
  reference: string,
  checkoutSessionId: string,
): Promise<Booking | null> {
  const normalizedReference = reference.trim().toUpperCase()
  if (!normalizedReference || !checkoutSessionId?.trim()) return null

  const booking = await findBooking(normalizedReference)
  if (!booking) return null
  if (booking.paymentStatus === "paid") return booking

  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId)
    if (session.payment_status !== "paid") return booking
    if (session.metadata?.bookingReference !== booking.reference) return null

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id

    const updated = await markBookingAsPaid(
      booking.reference,
      session.id,
      paymentIntentId,
    )
    revalidatePath("/admin")
    revalidatePath(`/booking/${booking.reference}`)
    return updated
  } catch {
    return booking
  }
}

async function getAppUrl(): Promise<string> {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "")
  }

  const requestHeaders = await headers()
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? ""
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http"

  if (!host) {
    throw new Error("Unable to determine application URL.")
  }

  return `${protocol}://${host}`
}

export async function lookupBooking(reference: string): Promise<Booking | null> {
  if (!reference?.trim()) return null
  return findBooking(reference)
}

export async function getAllBookings(): Promise<Booking[]> {
  // Defense in depth: middleware already gates the /admin route, but this
  // keeps the action itself from leaking data if ever called directly.
  if (!(await isAdminAuthenticated())) return []
  return listBookings()
}

export async function updateBookingStatus(
  reference: string,
  status: BookingStatus,
): Promise<Booking | null> {
  if (!(await isAdminAuthenticated())) return null
  const updated = await setBookingStatus(reference, status)
  revalidatePath("/admin")
  return updated
}

/** Fields support can correct from the admin control panel. */
export interface BookingEditInput {
  pickupAddress: string; pickupLat: number; pickupLng: number
  dropoffAddress: string; dropoffLat: number; dropoffLng: number
  stops: Destination[]
  vehicleId: string
  pickupDate: string; pickupTime: string
  flightNumber: string
  passengers: number
  bags: number
  customerName: string; email: string; phone: string; notes: string
  addOnIds: string[]
  paymentMethod: PaymentMethod
}

export interface UpdateBookingResult {
  ok: boolean
  booking?: Booking
  error?: string
}

/**
 * Lets an admin correct a booking's locations, stops, vehicle, add-ons, or contact details —
 * the fare is always fully recomputed from the current rate card so pricing stays accurate,
 * the same way a fresh booking is priced. The site-wide promotion and return-trip discount are
 * deliberately not re-applied here (they're customer-facing incentives for new bookings, not
 * something a support correction should silently add); an existing promo code is re-validated
 * and recomputed against the new subtotal.
 */
export async function updateBookingAction(reference: string, input: BookingEditInput): Promise<UpdateBookingResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Not authorized." }
  const existing = await findBooking(reference)
  if (!existing) return { ok: false, error: "Booking not found." }

  if (!input.customerName?.trim()) return { ok: false, error: "Name is required." }
  if (!input.email?.trim()) return { ok: false, error: "Email is required." }
  if (!input.phone?.trim()) return { ok: false, error: "Phone is required." }
  if (input.paymentMethod !== "card" && input.paymentMethod !== "cash") return { ok: false, error: "Please choose how the customer is paying." }
  if (!input.vehicleId) return { ok: false, error: "Please choose a vehicle." }
  if (!Number.isFinite(input.pickupLat) || !Number.isFinite(input.pickupLng) || !Number.isFinite(input.dropoffLat) || !Number.isFinite(input.dropoffLng)) {
    return { ok: false, error: "Please select both pickup and drop-off locations." }
  }
  if (!input.pickupDate || !input.pickupTime) return { ok: false, error: "Please choose a pickup date and time." }
  const stops = (input.stops || []).slice(0, MAX_STOPS)
  if (stops.some((stop) => !stop.address?.trim() || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lng))) {
    return { ok: false, error: "Please select a valid location for each stop." }
  }

  const vehicles = await listVehiclesWithPricing()
  const vehicle = vehicles.find((v) => v.id === input.vehicleId)
  if (!vehicle) return { ok: false, error: "Unknown vehicle." }
  if (input.passengers > vehicle.capacity || input.bags > vehicle.luggage) {
    return { ok: false, error: "Passenger or bag count exceeds this vehicle's capacity." }
  }

  const route = await calculateDrivingRoute(
    { lat: input.pickupLat, lng: input.pickupLng },
    { lat: input.dropoffLat, lng: input.dropoffLng },
    stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
  )
  if (route == null) return { ok: false, error: "Unable to price this trip." }

  const quote = computeFare(vehicle, route.distanceMiles, route.durationMinutes)
  // Look up by id against every add-on (including disabled ones) so a since-deactivated
  // add-on that's still on this booking keeps its price rather than disappearing.
  const allAddOns = await listAddOns()
  const selectedIds = new Set(input.addOnIds)
  const addOns: BookingAddOn[] = allAddOns.filter((addOn) => selectedIds.has(addOn.id)).map(({ id, name, price }) => ({ id, name, price }))
  const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0)
  const stopPricing = await getStoredStopPricing()
  const stopsTotal = stops.length * stopPricing.pricePerStop
  const subtotal = quote.fare + addOnsTotal + stopsTotal

  let discountAmount = 0
  let promoCode = existing.promoCode
  if (promoCode) {
    const promo = await findActivePromoCode(promoCode)
    if (promo) discountAmount = computeDiscount(subtotal, promo)
    else promoCode = undefined
  }

  const updated: Booking = {
    ...existing,
    direction: "custom",
    airportId: "custom",
    pickupAddress: input.pickupAddress, pickupLat: input.pickupLat, pickupLng: input.pickupLng,
    dropoffAddress: input.dropoffAddress, dropoffLat: input.dropoffLat, dropoffLng: input.dropoffLng,
    destinationAddress: input.dropoffAddress, destinationLat: input.dropoffLat, destinationLng: input.dropoffLng,
    vehicleId: input.vehicleId,
    pickupDate: input.pickupDate, pickupTime: input.pickupTime,
    flightNumber: input.flightNumber.trim(), passengers: input.passengers, bags: input.bags,
    customerName: input.customerName.trim(), email: input.email.trim(), phone: input.phone.trim(), notes: input.notes.trim(),
    paymentMethod: input.paymentMethod,
    stops, stopsTotal, addOns, addOnsTotal,
    distanceMiles: route.distanceMiles,
    promoCode, discountAmount,
    fare: Math.max(0, subtotal - discountAmount),
  }

  const saved = await replaceBooking(updated)
  if (!saved) return { ok: false, error: "Could not save these changes." }
  revalidatePath("/admin")
  revalidatePath(`/booking/${saved.reference}`)

  // Don't let a slow/failing email provider hold up the admin's save —
  // sendBookingUpdateEmail already swallows and logs its own errors.
  sendBookingUpdateEmail(saved).catch((error) => {
    console.error("Unexpected error sending booking update email:", error)
  })

  return { ok: true, booking: saved }
}

export async function getVehicleFleet(): Promise<VehicleClass[]> {
  return listVehiclesWithPricing()
}

export async function getBookingAddOns(): Promise<BookingAddOn[]> {
  return listActiveAddOns()
}

export async function getAllBookingAddOns() {
  if (!(await isAdminAuthenticated())) return []
  return listAddOns()
}

export async function upsertBookingAddOn(addOn: { id?: string; name: string; price: number; active: boolean }) {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Not authorized." }
  const name = addOn.name.trim()
  if (!name) return { ok: false, error: "Add-on name is required." }
  if (!Number.isFinite(addOn.price) || addOn.price < 0) return { ok: false, error: "Enter a valid add-on price." }
  const saved = await saveAddOn({ id: addOn.id || crypto.randomUUID(), name, price: addOn.price, active: addOn.active })
  if (!saved) return { ok: false, error: "Could not save the add-on." }
  revalidatePath("/admin"); revalidatePath("/book"); revalidatePath("/")
  return { ok: true, addOn: saved }
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  if (!(await isAdminAuthenticated())) return []
  return listPromoCodes()
}

export interface UpsertPromoCodeResult {
  ok: boolean
  promoCode?: PromoCode
  error?: string
}

export async function upsertPromoCodeAction(promo: { code: string; discountType: PromoDiscountType; discountValue: number; active: boolean }): Promise<UpsertPromoCodeResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Not authorized." }
  const code = promo.code.trim().toUpperCase()
  if (!code) return { ok: false, error: "Promo code is required." }
  if (!/^[A-Z0-9_-]+$/.test(code)) return { ok: false, error: "Use letters, numbers, - or _ only." }
  if (!Number.isFinite(promo.discountValue) || promo.discountValue <= 0) return { ok: false, error: "Enter a valid discount value." }
  if (promo.discountType === "percent" && promo.discountValue > 100) return { ok: false, error: "Percentage discount can't exceed 100." }
  const saved = await savePromoCode({ ...promo, code })
  if (!saved) return { ok: false, error: "Could not save the promo code." }
  revalidatePath("/admin")
  return { ok: true, promoCode: saved }
}

export interface PreviewPromoCodeResult {
  ok: boolean
  code?: string
  discountType?: PromoDiscountType
  discountValue?: number
  discountAmount?: number
  error?: string
}

/** Client-side preview only — createBooking always re-validates and recomputes the discount itself. */
export async function previewPromoCode(code: string, subtotal: number): Promise<PreviewPromoCodeResult> {
  if (!code?.trim()) return { ok: false, error: "Enter a promo code." }
  if (!Number.isFinite(subtotal) || subtotal <= 0) return { ok: false, error: "Select a vehicle before applying a promo code." }
  const promo = await findActivePromoCode(code)
  if (!promo) return { ok: false, error: "Invalid or inactive promo code." }
  return { ok: true, code: promo.code, discountType: promo.discountType, discountValue: promo.discountValue, discountAmount: computeDiscount(subtotal, promo) }
}

export async function getSitePromotion(): Promise<SitePromotion> {
  return getStoredSitePromotion()
}

export interface UpdateSitePromotionResult {
  ok: boolean
  promotion?: SitePromotion
  error?: string
}

export async function updateSitePromotionAction(active: boolean, discountPercent: number): Promise<UpdateSitePromotionResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Not authorized." }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return { ok: false, error: "Enter a discount percentage between 0 and 100." }
  }
  const promotion = await setSitePromotion(active, discountPercent)
  revalidatePath("/admin"); revalidatePath("/book"); revalidatePath("/")
  return { ok: true, promotion }
}

export async function getReturnTripDiscount(): Promise<ReturnTripDiscount> {
  return getStoredReturnTripDiscount()
}

export interface UpdateReturnTripDiscountResult {
  ok: boolean
  discount?: ReturnTripDiscount
  error?: string
}

export async function updateReturnTripDiscountAction(active: boolean, discountPercent: number): Promise<UpdateReturnTripDiscountResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Not authorized." }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return { ok: false, error: "Enter a discount percentage between 0 and 100." }
  }
  const discount = await setReturnTripDiscount(active, discountPercent)
  revalidatePath("/admin"); revalidatePath("/book")
  return { ok: true, discount }
}

export async function getStopPricing(): Promise<StopPricing> {
  return getStoredStopPricing()
}

export interface UpdateStopPricingResult {
  ok: boolean
  pricing?: StopPricing
  error?: string
}

export async function updateStopPricingAction(pricePerStop: number): Promise<UpdateStopPricingResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Not authorized." }
  if (!Number.isFinite(pricePerStop) || pricePerStop < 0) {
    return { ok: false, error: "Enter a valid price per stop." }
  }
  const pricing = await setStopPricing(pricePerStop)
  revalidatePath("/admin"); revalidatePath("/book")
  return { ok: true, pricing }
}

export interface UpdateVehiclePricingResult {
  ok: boolean
  vehicle?: VehicleClass
  error?: string
}

export async function updateVehiclePricing(
  vehicleId: string,
  minFare: number,
  perMileAfter: number,
  perMinuteRate: number,
): Promise<UpdateVehiclePricingResult> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Not authorized." }
  }
  if (!Number.isFinite(minFare) || minFare < 0) {
    return { ok: false, error: "Minimum fare must be a positive number." }
  }
  if (!Number.isFinite(perMileAfter) || perMileAfter < 0) {
    return { ok: false, error: "Per-mile rate must be a positive number." }
  }
  if (!Number.isFinite(perMinuteRate) || perMinuteRate < 0) {
    return { ok: false, error: "Per-minute rate must be a positive number." }
  }
  const updated = await setVehiclePricing(vehicleId, minFare, perMileAfter, perMinuteRate)
  if (!updated) return { ok: false, error: "Vehicle not found." }
  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/book")
  return { ok: true, vehicle: updated }
}

export interface DistanceQuoteResult {
  ok: boolean
  distanceMiles?: number
  durationMinutes?: number
  error?: string
}

export async function getDistanceQuote(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
  stops: { lat: number; lng: number }[] = [],
): Promise<DistanceQuoteResult> {
  try {
    const route = await calculateDrivingRoute(
      pickup,
      dropoff,
      stops,
    )
    if (route == null) {
      return { ok: false, error: "Couldn't find a driving route to that address." }
    }
    return {
      ok: true,
      distanceMiles: Math.round(route.distanceMiles * 10) / 10,
      durationMinutes: route.durationMinutes,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message === "GOOGLE_MAPS_SERVER_API_KEY is missing.") {
      return {
        ok: false,
        error: "Distance pricing is not configured. Add GOOGLE_MAPS_SERVER_API_KEY on the server.",
      }
    }
    if (message.startsWith("Google Routes API rejected")) {
      return { ok: false, error: message }
    }
    return { ok: false, error: "Distance service is temporarily unavailable." }
  }
}
