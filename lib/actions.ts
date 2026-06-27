"use server"

import { revalidatePath } from "next/cache"
import { calculateFare } from "./fleet"
import {
  findBooking,
  generateReference,
  listBookings,
  saveBooking,
  setBookingStatus,
} from "./store"
import type { Booking, BookingStatus, NewBookingInput } from "./types"

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
  return listBookings()
}

export async function updateBookingStatus(
  reference: string,
  status: BookingStatus,
): Promise<Booking | null> {
  const updated = await setBookingStatus(reference, status)
  revalidatePath("/admin")
  return updated
}
