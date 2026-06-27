import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { getAllBookings } from "@/lib/actions"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const bookings = await getAllBookings()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Operations dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage incoming transfers, update trip status, and keep an eye on the
            day&apos;s pickups.
          </p>
        </div>
        <AdminDashboard bookings={bookings} />
      </main>
      <SiteFooter />
    </div>
  )
}
