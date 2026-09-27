import type { Metadata } from "next"
import { ReferralsPanel, type ReferrerSummary } from "@/components/admin/referrals-panel"
import { requireAdminSection } from "@/lib/session"
import { getReferralSettings, listReferralCommissions, listReferralPayouts } from "@/lib/store"

export const metadata: Metadata = { title: "Referrals" }
export const dynamic = "force-dynamic"

export default async function AdminReferralsPage() {
  await requireAdminSection("referrals", "/admin/referrals")
  const [settings, commissions, payouts] = await Promise.all([getReferralSettings(), listReferralCommissions(), listReferralPayouts()])

  const byReferrer = new Map<string, ReferrerSummary>()
  for (const commission of commissions) {
    const summary = byReferrer.get(commission.referrerCustomerId) ?? {
      referrerId: commission.referrerCustomerId,
      name: commission.referrer?.name ?? "Deleted customer",
      email: commission.referrer?.email ?? "",
      code: commission.referrer?.referralCode ?? "",
      rides: 0, pending: 0, paid: 0, pendingReferences: [],
    }
    summary.rides += 1
    summary[commission.status] += commission.amount
    if (commission.status === "pending") summary.pendingReferences.push(commission.bookingReference)
    byReferrer.set(commission.referrerCustomerId, summary)
  }
  // Whoever is owed the most comes first.
  const referrers = [...byReferrer.values()].sort((a, b) => b.pending - a.pending || b.paid - a.paid)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Referrals</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers share their referral link and earn a commission on every completed ride booked through it.
        </p>
      </div>
      <ReferralsPanel settings={settings} referrers={referrers} payouts={payouts} />
    </div>
  )
}
