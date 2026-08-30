"use client"

import { useTransition } from "react"
import { CreditCard, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startBookingCheckout } from "@/lib/actions"
import { formatCurrency } from "@/lib/fleet"
import { toast } from "sonner"

export function PaymentStep({
  reference,
  amount,
  note,
}: {
  reference: string
  amount: number
  /** Optional clarifying note shown under the amount — e.g. that this charge also covers a linked return trip. */
  note?: string
}) {
  const [isPending, startTransition] = useTransition()

  function handlePayNow() {
    startTransition(async () => {
      const result = await startBookingCheckout(reference)
      if (!result.ok || !result.url) {
        toast.error(result.error || "Unable to start checkout.")
        return
      }
      window.location.href = result.url
    })
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight">Pay now</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Complete your card payment on Stripe&apos;s secure hosted checkout page.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Amount due</p>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(amount)}</p>
          {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
        </div>
        <Button onClick={handlePayNow} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CreditCard className="size-4" />
          )}
          Pay securely
        </Button>
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" />
        You are redirected to Stripe to enter card details.
      </p>
    </section>
  )
}
