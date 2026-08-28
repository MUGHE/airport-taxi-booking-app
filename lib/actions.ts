"use server"

import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  findBooking,
  generateReference,
  listBookings,
  listActiveAddOns,
  listAddOns,
  listVehiclesWithPricing,
  markBookingAsPaid,
  saveBooking,
  setBookingStatus,
  updateVehiclePricing as setVehiclePricing,
  upsertAddOn as saveAddOn,
} from "./store"
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "./auth"
import { isAdminAuthenticated } from "./session"
import type { Booking, BookingAddOn, BookingStatus, NewBookingInput, VehicleClass } from "./types"
import { getStripeClient } from "./stripe"
import { calculateDrivingRoute } from "./google-distance"
import { computeFare } from "./fleet"
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
  const availableAddOns = await listActiveAddOns()
  const selectedIds = new Set(input.addOnIds)
  const addOns = availableAddOns.filter((addOn) => selectedIds.has(addOn.id))
  const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0)

  const booking: Booking = {
    ...input,
    reference: generateReference(),
    status: "pending",
    paymentStatus: "unpaid",
    fare: quote.fare + addOnsTotal,
    distanceMiles: quote.distanceMiles,
    addOns,
    addOnsTotal,
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
