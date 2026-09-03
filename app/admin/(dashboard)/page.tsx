import type { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { getAllBookingAddOns, getAllBookings, getVehicleFleet } from "@/lib/actions"

export const metadata: Metadata = { title: "Bookings" }
export const dynamic = "force-dynamic"

export default async function AdminBookingsPage() {
  const [bookings, vehicles, addOns] = await Promise.all([
    getAllBookings(),
    getVehicleFleet(),
    getAllBookingAddOns(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Bookings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every incoming transfer — search, filter, update status, or edit a booking's details.
        </p>
      </div>
      <AdminDashboard bookings={bookings} vehicles={vehicles} addOns={addOns} />
    </div>
  )
}
