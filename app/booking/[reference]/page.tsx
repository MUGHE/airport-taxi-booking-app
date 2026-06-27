import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2, Home, Search } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookingDetails } from "@/components/booking-details"
import { Button } from "@/components/ui/button"
import { lookupBooking } from "@/lib/actions"

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const booking = await lookupBooking(reference)
  if (!booking) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="size-7" />
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            You&apos;re all set!
          </h1>
          <p className="mt-2 text-muted-foreground">
            A confirmation has been sent to{" "}
            <span className="font-medium text-foreground">{booking.email}</span>.
            Save your reference to track this trip anytime.
          </p>
        </div>

        <BookingDetails booking={booking} />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/track">
              <Search className="size-4" />
              Track this booking
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="size-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
