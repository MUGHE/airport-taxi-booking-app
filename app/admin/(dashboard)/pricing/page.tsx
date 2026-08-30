import { PricingPanel } from "@/components/admin/pricing-panel"
import { AddOnsPanel } from "@/components/admin/add-ons-panel"
import { PromoCodesPanel } from "@/components/admin/promo-codes-panel"
import { SitePromotionPanel } from "@/components/admin/site-promotion-panel"
import { ReturnTripPanel } from "@/components/admin/return-trip-panel"
import { StopPricingPanel } from "@/components/admin/stop-pricing-panel"
import {
  getAllBookingAddOns,
  getAllPromoCodes,
  getReturnTripDiscount,
  getSitePromotion,
  getStopPricing,
  getVehicleFleet,
} from "@/lib/actions"

export const dynamic = "force-dynamic"

// Every input that feeds into how a trip's fare is calculated lives here — the base
// per-vehicle rate card, the two admin-managed discounts, the per-stop fee, and the
// add-ons/promo codes that add to or discount the subtotal.
export default async function AdminPricingPage() {
  const [vehicles, addOns, promoCodes, promotion, returnTripDiscount, stopPricing] = await Promise.all([
    getVehicleFleet(),
    getAllBookingAddOns(),
    getAllPromoCodes(),
    getSitePromotion(),
    getReturnTripDiscount(),
    getStopPricing(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Pricing engine</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything below feeds directly into how a customer&apos;s fare is calculated.
        </p>
      </div>
      <div className="space-y-8">
        <PricingPanel vehicles={vehicles} />
        <SitePromotionPanel promotion={promotion} />
        <ReturnTripPanel discount={returnTripDiscount} />
        <StopPricingPanel pricing={stopPricing} />
        <AddOnsPanel addOns={addOns} />
        <PromoCodesPanel promoCodes={promoCodes} />
      </div>
    </div>
  )
}
