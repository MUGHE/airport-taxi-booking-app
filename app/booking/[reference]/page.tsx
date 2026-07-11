import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2, CircleAlert, Home, Search } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookingDetails } from "@/components/booking-details"
import { PaymentStep } from "@/components/booking/payment-step"
import { Button } from "@/components/ui/button"
import { confirmBookingPayment, lookupBooking } from "@/lib/actions"

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ payment?: string; session_id?: string }>
}) {
  const { reference } = await params
  const query = await searchParams

  if (query.payment === "success" && query.session_id) {
    await confirmBookingPayment(reference, query.session_id)
  }

  const booking = await lookupBooking(reference)
  if (!booking) notFound()

  const isPaid = booking.paymentStatus === "paid"
  const isCancelledPayment = query.payment === "cancelled"

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <div className="mb-6 text-center">
          {isPaid ? (
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="size-7" />
            </span>
          ) : (
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
              <CircleAlert className="size-7" />
            </span>
          )}
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {isPaid ? "You&apos;re all set!" : "One last step: pay now"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isPaid ? (
              <>
                A confirmation has been sent to{" "}
                <span className="font-medium text-foreground">{booking.email}</span>.
                Save your reference to track this trip anytime.
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

        {!isPaid && (
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
