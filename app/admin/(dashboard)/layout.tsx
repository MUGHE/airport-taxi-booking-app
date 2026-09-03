import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LogoutButton } from "@/components/admin/logout-button"
import { AdminNav } from "@/components/admin/admin-nav"
import { IdleSessionGuard } from "@/components/admin/idle-session-guard"

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | ONE Airport Taxi Admin",
  },
  robots: { index: false, follow: false },
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <IdleSessionGuard />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:py-12">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Operations dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Manage incoming transfers, update trip status, and keep the fare
              calculation up to date.
            </p>
          </div>
          <LogoutButton />
        </div>
        <AdminNav />
        <div className="mt-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}
