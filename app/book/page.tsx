import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookingFlow } from "@/components/booking/booking-flow"
import { getBookingAddOns, getSitePromotion, getVehicleFleet } from "@/lib/actions"
export default async function BookPage() {
  const [vehicles, addOns, promotion] = await Promise.all([getVehicleFleet(), getBookingAddOns(), getSitePromotion()])
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 lg:py-14">
        <div className="mb-8 max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight">Book your transfer</h1>
          <p className="mt-2 text-muted-foreground">
            Get a fixed, all-inclusive fare and a professional chauffeur in four
            quick steps.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          }
        >
          <BookingFlow vehicles={vehicles} addOns={addOns} promotion={promotion} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
