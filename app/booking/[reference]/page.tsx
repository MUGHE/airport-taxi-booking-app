import Link from "next/link"
import { notFound } from "next/navigation"
import { Banknote, CheckCircle2, CircleAlert, Home, Repeat, Search } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookingDetails } from "@/components/booking-details"
import { PaymentStep } from "@/components/booking/payment-step"
import { Button } from "@/components/ui/button"
import { confirmBookingPayment, lookupBooking } from "@/lib/actions"
import { formatCurrency } from "@/lib/fleet"

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ payment?: string; session_id?: string }>
}) {
  const { reference } = await params
  const query = await searchParams

  // When we've just come back from Stripe, confirmBookingPayment already returns the
  // up-to-date booking — reuse that instead of a second lookupBooking call. A second call
  // would issue an identical fetch to the one confirmBookingPayment made before updating the
  // row, and React's per-request fetch memoization would hand back that stale, pre-payment
  // copy instead of hitting the database again, which is why the page kept showing "pending"
  // until a manual reload started a fresh request (and a fresh memoization cache).
  const booking =
    query.payment === "success" && query.session_id
      ? await confirmBookingPayment(reference, query.session_id)
      : await lookupBooking(reference)
  if (!booking) notFound()

  const isPaid = booking.paymentStatus === "paid"
  const isCash = booking.paymentMethod === "cash"
  const isCancelledPayment = query.payment === "cancelled"

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <div className="mb-6 text-center">
          {isPaid || isCash ? (
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              {isCash ? <Banknote className="size-7" /> : <CheckCircle2 className="size-7" />}
            </span>
          ) : (
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
              <CircleAlert className="size-7" />
            </span>
          )}
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {isPaid || isCash ? "You're all set!" : "One last step: pay now"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isPaid ? (
              <>
                A confirmation has been sent to{" "}
                <span className="font-medium text-foreground">{booking.email}</span>.
                Save your reference to track this trip anytime.
              </>
            ) : isCash ? (
              <>
                Your trip is reserved under{" "}
                <span className="font-medium text-foreground">{booking.reference}</span>.
                Pay your driver{" "}
                <span className="font-medium text-foreground">{formatCurrency(booking.fare)}</span>{" "}
                in cash at the end of your journey.
              </>
            ) : (
              <>
                Your trip is reserved under{" "}
                <span className="font-medium text-foreground">{booking.reference}</span>.
                Complete payment to confirm your transfer.
              </>
            )}
          </p>
        </div>

        <BookingDetails booking={booking} />

        {(booking.returnTripReference || booking.outboundTripReference) && (
          <Link
            href={`/booking/${booking.returnTripReference || booking.outboundTripReference}`}
            className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-sm transition-colors hover:border-primary/40"
          >
            <span className="flex items-center gap-2 font-medium">
              <Repeat className="size-4 text-primary" />
              {booking.returnTripReference
                ? `View your return trip (${booking.returnTripReference})`
                : `View your outbound trip (${booking.outboundTripReference})`}
            </span>
            <span className="text-muted-foreground">→</span>
          </Link>
        )}

        {!isPaid && !isCash && (
          <>
            {isCancelledPayment && (
              <p className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                Checkout was cancelled. Your booking is still saved. Click Pay securely
                to complete your card payment.
              </p>
            )}
            <PaymentStep reference={booking.reference} amount={booking.fare} />
          </>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/track" />}
          >
            <Search className="size-4" />
            Track this booking
          </Button>
          <Button nativeButton={false} render={<Link href="/" />}>
            <Home className="size-4" />
            Back to home
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
