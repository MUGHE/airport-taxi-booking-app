import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { PricingPanel } from "@/components/admin/pricing-panel"
import { LogoutButton } from "@/components/admin/logout-button"
import { AddOnsPanel } from "@/components/admin/add-ons-panel"
import { PromoCodesPanel } from "@/components/admin/promo-codes-panel"
import { SitePromotionPanel } from "@/components/admin/site-promotion-panel"
import { getAllBookingAddOns, getAllBookings, getAllPromoCodes, getSitePromotion, getVehicleFleet } from "@/lib/actions"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [bookings, vehicles, addOns, promoCodes, promotion] = await Promise.all([getAllBookings(), getVehicleFleet(), getAllBookingAddOns(), getAllPromoCodes(), getSitePromotion()])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:py-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Operations dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Manage incoming transfers, update trip status, and keep an eye on the
              day&apos;s pickups.
            </p>
          </div>
          <LogoutButton />
        </div>
        <div className="space-y-8">
          <PricingPanel vehicles={vehicles} />
          <SitePromotionPanel promotion={promotion} />
          <AddOnsPanel addOns={addOns} />
          <PromoCodesPanel promoCodes={promoCodes} />
          <AdminDashboard bookings={bookings} />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
