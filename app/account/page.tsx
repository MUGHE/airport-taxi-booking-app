import type { Metadata } from "next"
import Link from "next/link"
import { AccountForms } from "@/components/account-forms"
import { Badge } from "@/components/ui/badge"
import { getCustomer } from "@/lib/session"
import { isGoogleSignInConfigured } from "@/lib/google-oauth"
import { listCustomerBookings } from "@/lib/store"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status"
import { formatDate, formatTimeLabel } from "@/lib/datetime"
import { formatCurrency } from "@/lib/fleet"

export const metadata: Metadata = { title: "Bookings" }
export const dynamic = "force-dynamic"

export default async function AccountBookingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const customer = await getCustomer()

  if (!customer) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Sign in or create an account</h1>
          <p className="mt-2 text-muted-foreground">Keep all your bookings in one place and book faster — your details are filled in for you.</p>
        </div>
        <AccountForms googleEnabled={isGoogleSignInConfigured()} googleError={(await searchParams).error} />
      </>
    )
  }

  const bookings = await listCustomerBookings(customer.id)
  return (
    <>
      <h2 className="mb-3 text-lg font-semibold">Your bookings</h2>
      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          No bookings yet. Bookings you make while signed in will appear here.{" "}
          <Link href="/book" className="font-medium text-primary underline-offset-4 hover:underline">Book a ride</Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {bookings.map((booking) => (
            <li key={booking.reference}>
              <Link href={`/booking/${booking.reference}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm transition-colors hover:bg-secondary/50">
                <div className="min-w-0">
                  <p className="font-medium">{formatDate(booking.pickupDate)} · {formatTimeLabel(booking.pickupTime)}</p>
                  <p className="truncate text-muted-foreground">{booking.pickupAddress ?? "Pickup"} → {booking.dropoffAddress ?? booking.destinationAddress}</p>
                  <p className="font-mono text-xs text-muted-foreground">{booking.reference}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={STATUS_STYLES[booking.status]}>{STATUS_LABELS[booking.status]}</Badge>
                  <span className="font-medium">{formatCurrency(booking.fare)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
