"use server"

import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  findActivePromoCode,
  findBooking,
  generateReference,
  getSitePromotion as getStoredSitePromotion,
  listBookings,
  listActiveAddOns,
  listAddOns,
  listPromoCodes,
  listVehiclesWithPricing,
  markBookingAsPaid,
  saveBooking,
  setBookingStatus,
  updateSitePromotion as setSitePromotion,
  updateVehiclePricing as setVehiclePricing,
  upsertAddOn as saveAddOn,
  upsertPromoCode as savePromoCode,
} from "./store"
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "./auth"
import { isAdminAuthenticated } from "./session"
import type { Booking, BookingAddOn, BookingStatus, NewBookingInput, PromoCode, PromoDiscountType, SitePromotion, VehicleClass } from "./types"
import { getStripeClient } from "./stripe"
import { calculateDrivingRoute } from "./google-distance"
import { applyPromotion, computeDiscount, computeFare } from "./fleet"
import { sendBookingNotificationEmails } from "./email"


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

export async function createBooking(input: NewBookingInput & { addOnIds: string[] }): Promise<CreateBookingResult> {
  if (!input.customerName?.trim()) return { ok: false, error: "Name is required." }
  if (!input.email?.trim()) return { ok: false, error: "Email is required." }
  if (!input.phone?.trim()) return { ok: false, error: "Phone is required." }
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

  const vehicles = await listVehiclesWithPricing()
  const vehicle = vehicles.find((v) => v.id === input.vehicleId)
  if (!vehicle) return { ok: false, error: "Unknown vehicle." }
  if (input.passengers > vehicle.capacity || input.bags > vehicle.luggage) {
    return { ok: false, error: "Passenger or bag count exceeds this vehicle's capacity." }
  }

  const route = await calculateDrivingRoute(
    { lat: input.pickupLat!, lng: input.pickupLng! },
    { lat: input.dropoffLat!, lng: input.dropoffLng! },
  )
  if (route == null) return { ok: false, error: "Unable to price this trip." }

  const quote = computeFare(vehicle, route.distanceMiles, route.durationMinutes)
  const promotion = await getStoredSitePromotion()
  const vehicleFare = promotion.active ? applyPromotion(quote.fare, promotion.discountPercent) : quote.fare
  const availableAddOns = await listActiveAddOns()
  const selectedIds = new Set(input.addOnIds)
  const addOns = availableAddOns.filter((addOn) => selectedIds.has(addOn.id))
  const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0)
  const subtotal = vehicleFare + addOnsTotal

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
    status: "pending",
    paymentStatus: "unpaid",
    fare: Math.max(0, subtotal - discountAmount),
    distanceMiles: quote.distanceMiles,
    addOns,
    addOnsTotal,
    promoCode,
    discountAmount,
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
): Promise<DistanceQuoteResult> {
  try {
    const route = await calculateDrivingRoute(
      pickup,
      dropoff,
    )
    if (route == null) {
      return { ok: false, error: "Couldn't find a driving route to that address." }
    }
    return {
      ok: true,
      distanceMiles: Math.round(route.distanceMiles * 10) / 10,
      durationMinutes: route.durationMinutes,
    }
  } catch {
    return { ok: false, error: "Distance service is temporarily unavailable." }
  }
}
