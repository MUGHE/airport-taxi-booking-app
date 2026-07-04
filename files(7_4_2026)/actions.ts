"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { calculateFare } from "./fleet"
import {
  findBooking,
  generateReference,
  listBookings,
  saveBooking,
  setBookingStatus,
} from "./store"
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "./auth"
import { isAdminAuthenticated } from "./session"
import type { Booking, BookingStatus, NewBookingInput } from "./types"

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
    status: "confirmed",
    fare: quote.fare,
    distanceKm: quote.distanceKm,
    createdAt: new Date().toISOString(),
  }

  await saveBooking(booking)
  revalidatePath("/admin")
  return { ok: true, reference: booking.reference }
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
