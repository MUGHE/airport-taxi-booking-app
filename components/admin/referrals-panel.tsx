"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { markReferrerPaidAction, updateReferralSettingsAction } from "@/lib/actions"
import type { ReferralPayout, ReferralSettings } from "@/lib/types"

export interface ReferrerSummary {
  referrerId: string
  name: string
  email: string
  code: string
  rides: number
  pending: number
  paid: number
  /** Exactly the commissions shown as owed, so "Mark paid" never covers one earned after the page loaded. */
  pendingReferences: string[]
}

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value)

const RECEIPT_ACCEPT = ".jpg,.jpeg,image/jpeg"
const RECEIPT_MAX_BYTES = 200 * 1024 // 200 KB, matches lib/store.ts

function ReferrerRow({ referrer }: { referrer: ReferrerSummary }) {
  const router = useRouter()
  const [paying, setPaying] = useState(false)
  const [isPending, startTransition] = useTransition()

  function recordPayout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const receipt = formData.get("receipt")
    if (!(receipt instanceof File) || receipt.size === 0) return toast.error("Attach the transfer receipt.")
    if (receipt.type !== "image/jpeg") return toast.error("The receipt must be a JPG/JPEG image.")
    if (receipt.size > RECEIPT_MAX_BYTES) return toast.error(`The receipt is ${Math.ceil(receipt.size / 1024)} KB. It must be 200 KB or less.`)
    formData.set("referrerId", referrer.referrerId)
    formData.set("references", JSON.stringify(referrer.pendingReferences))
    startTransition(async () => {
      const result = await markReferrerPaidAction(formData)
      if (!result.ok) { toast.error(result.error || "Could not record the payout."); return }
      toast.success(`${money(referrer.pending)} recorded as paid to ${referrer.name}.`)
      setPaying(false)
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border px-3 py-3 text-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
        <div className="min-w-0">
          <p className="font-medium">{referrer.name} <span className="font-mono text-xs text-muted-foreground">{referrer.code}</span></p>
          <p className="truncate text-muted-foreground">{referrer.email} · {referrer.rides} completed {referrer.rides === 1 ? "ride" : "rides"}</p>
        </div>
        <p className="md:text-right">
          <span className="block font-semibold">{money(referrer.pending)} owed</span>
          <span className="text-muted-foreground">{money(referrer.paid)} paid</span>
        </p>
        <Button size="sm" variant={referrer.pending > 0 ? "default" : "outline"} disabled={isPending || referrer.pending <= 0 || paying} onClick={() => setPaying(true)}>
          Mark paid
        </Button>
      </div>
      {paying && (
        <form onSubmit={recordPayout} className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor={`receipt-${referrer.referrerId}`}>Transfer receipt for {money(referrer.pending)} <span className="text-destructive">*</span></Label>
            <Input id={`receipt-${referrer.referrerId}`} name="receipt" type="file" accept={RECEIPT_ACCEPT} required />
            <p className="text-xs text-muted-foreground">JPG/JPEG only, up to 200 KB. {referrer.name} will be able to view it from their account.</p>
          </div>
          <Button type="submit" size="sm" disabled={isPending}>{isPending && <Loader2 className="size-4 animate-spin" />}Record payout</Button>
          <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => setPaying(false)}>Cancel</Button>
        </form>
      )}
    </div>
  )
}

export function ReferralsPanel({ settings, referrers, payouts }: { settings: ReferralSettings; referrers: ReferrerSummary[]; payouts: ReferralPayout[] }) {
  const router = useRouter()
  const [percent, setPercent] = useState(String(settings.commissionPercent))
  const [isPending, startTransition] = useTransition()
  const totalOwed = referrers.reduce((total, referrer) => total + referrer.pending, 0)

  function save(active: boolean) {
    const value = Number(percent)
    if (!Number.isFinite(value) || value <= 0 || value > 100) return toast.error("Enter a commission between 0.01 and 100%.")
    startTransition(async () => {
      const result = await updateReferralSettingsAction(active, value)
      if (!result.ok) { toast.error(result.error || "Could not update the referral programme."); return }
      toast.success(active ? `Referrers now earn ${value}% of each completed ride.` : "Referral programme turned off.")
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Referral programme</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              While on, the first booking made through a customer&apos;s link is credited to them (one ride per link visit). Commission is a share of the final fare, earned when the ride is marked completed.
            </p>
          </div>
          {settings.active && <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Live · {settings.commissionPercent}% commission</span>}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36">
            <Label htmlFor="referral-percent">Commission %</Label>
            <Input id="referral-percent" type="number" min="0.01" max="100" step="0.5" value={percent} onChange={(e) => setPercent(e.target.value)} />
          </div>
          {settings.active ? (
            <>
              <Button disabled={isPending} onClick={() => save(true)}>Save rate</Button>
              <Button variant="outline" disabled={isPending} onClick={() => save(false)}>Turn off</Button>
            </>
          ) : (
            <Button disabled={isPending} onClick={() => save(true)}>Activate</Button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold">Payouts</h3>
          <p className="text-sm text-muted-foreground">Owed in total: <span className="font-semibold text-foreground">{money(totalOwed)}</span></p>
        </div>
        {referrers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No commissions yet. They appear here once a referred ride is completed.</p>
        ) : (
          <div className="space-y-2">
            {referrers.map((referrer) => (
              <ReferrerRow key={referrer.referrerId} referrer={referrer} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 text-lg font-semibold">Payout history</h3>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payouts recorded yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {payouts.map((payout) => (
              <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-medium">{payout.referrer?.name ?? "Deleted customer"} · {money(payout.amount)}</p>
                  <p className="text-muted-foreground">{new Date(payout.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                {payout.receiptUrl
                  ? <a href={payout.receiptUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">View receipt</a>
                  : <span className="text-muted-foreground">Receipt unavailable</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
