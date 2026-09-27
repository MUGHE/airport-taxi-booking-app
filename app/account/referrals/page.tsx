import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ReferralShare } from "@/components/account-forms"
import { getCustomer } from "@/lib/session"
import { ensureReferralCode, getReferralSettings, listReferralCommissions, listReferralPayouts } from "@/lib/store"
import { formatDate } from "@/lib/datetime"

export const metadata: Metadata = { title: "Referrals" }
export const dynamic = "force-dynamic"

// Pence matter for commissions, unlike the whole-pound fares formatCurrency shows.
const formatMoney = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value)
const formatDay = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

export default async function AccountReferralsPage() {
  const customer = await getCustomer()
  if (!customer) redirect("/account")

  const [settings, commissions, payouts] = await Promise.all([getReferralSettings(), listReferralCommissions(customer.id), listReferralPayouts(customer.id)])
  if (!settings.active && commissions.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Referrals</h2>
        <p className="mt-1 text-sm text-muted-foreground">Our referral programme isn&apos;t running right now. Check back soon.</p>
      </section>
    )
  }

  const referralCode = customer.referralCode ?? (await ensureReferralCode(customer.id))
  const earned = (status: "pending" | "paid") => commissions.filter((c) => c.status === status).reduce((total, c) => total + c.amount, 0)

  // Payouts (with their receipts) are folded into the Earnings section below instead of a
  // card of their own, joined to each settled commission via payoutId.
  const payoutsById = new Map(payouts.map((payout) => [payout.id, payout]))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Refer friends, earn on every ride</h2>
        {settings.active ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Share your link. When a friend books through it, you earn {settings.commissionPercent}% of the fare once their ride is completed. Each visit through your link covers one booking.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">The referral programme is paused. Earnings you&apos;ve already made are still paid out.</p>
        )}
        {settings.active && <div className="mt-4"><ReferralShare code={referralCode} /></div>}
        <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-secondary/50 p-3"><dt className="text-muted-foreground">Completed rides</dt><dd className="mt-1 text-lg font-semibold">{commissions.length}</dd></div>
          <div className="rounded-xl bg-secondary/50 p-3"><dt className="text-muted-foreground">Awaiting payout</dt><dd className="mt-1 text-lg font-semibold">{formatMoney(earned("pending"))}</dd></div>
          <div className="rounded-xl bg-secondary/50 p-3"><dt className="text-muted-foreground">Paid to you</dt><dd className="mt-1 text-lg font-semibold">{formatMoney(earned("paid"))}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Your code: <span className="font-mono">{referralCode}</span>. Rides you book yourself don&apos;t count.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Earnings</h2>
        {commissions.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Nothing yet. You&apos;ll see each completed ride here.</p>
        ) : (
          <ul className="mt-2 divide-y text-sm">
            {/* Keyed by position, not booking reference: keys reach the browser, and a reference
                would let the referrer open their friend's full booking. */}
            {commissions.map((commission, index) => {
              const receiptUrl = commission.payoutId ? payoutsById.get(commission.payoutId)?.receiptUrl : undefined
              return (
                <li key={index} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {commission.ride ? `${commission.ride.passenger}'s ride · ${formatDate(commission.ride.date)}` : `Ride completed ${formatDay(commission.createdAt)}`}
                    </p>
                    {commission.ride && (
                      <p className="text-muted-foreground">{commission.ride.vehicle} · {formatMoney(commission.ride.fare)} fare</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">+{formatMoney(commission.amount)}</p>
                    <p className={commission.status === "paid" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
                      {commission.status === "paid" ? "Paid" : "Awaiting payout"}
                      {receiptUrl && (
                        <>
                          {" · "}
                          <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">Receipt</a>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
