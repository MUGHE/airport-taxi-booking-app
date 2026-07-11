"use server"

import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { calculateFare } from "./fleet"
import {
  findBooking,
  generateReference,
  listBookings,
  markBookingAsPaid,
  saveBooking,
  setBookingStatus,
} from "./store"
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "./auth"
import { isAdminAuthenticated } from "./session"
import type { Booking, BookingStatus, NewBookingInput } from "./types"
import { getStripeClient } from "./stripe"

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

export async function createBooking(
  input: NewBookingInput,
): Promise<CreateBookingResult> {
  // Basic server-side validation
  if (!input.customerName?.trim()) return { ok: false, error: "Name is required." }
  if (!input.email?.trim()) return { ok: false, error: "Email is required." }
  if (!input.phone?.trim()) return { ok: false, error: "Phone is required." }
  if (!input.locationId || !input.vehicleId || !input.airportId) {
    return { ok: false, error: "Please complete your trip details." }
  }
  if (!input.pickupDate || !input.pickupTime) {
    return { ok: false, error: "Please choose a pickup date and time." }
  }

  const quote = calculateFare(input.vehicleId, input.locationId)
  if (!quote) return { ok: false, error: "Unable to price this trip." }

  const booking: Booking = {
    ...input,
    reference: generateReference(),
    status: "pending",
    paymentStatus: "unpaid",
    fare: quote.fare,
    distanceKm: quote.distanceKm,
    createdAt: new Date().toISOString(),
  }

  await saveBooking(booking)
  revalidatePath("/admin")
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
  } catch {
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
