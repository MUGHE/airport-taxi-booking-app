import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { LogoutButton } from "@/components/admin/logout-button"
import { AdminNav } from "@/components/admin/admin-nav"
import { IdleSessionGuard } from "@/components/admin/idle-session-guard"
import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/session"
import { ADMIN_ROLES } from "@/lib/admin-roles"
import Link from "next/link"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | ONE Airport Taxi Admin",
  },
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()
  if (!user) redirect("/admin/login")
  if (user.mustChangePassword) redirect("/admin/change-password")

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
          <div className="flex items-center gap-3">
            <p className="text-right text-sm leading-tight">
              <span className="block font-medium">{user.name || user.email}</span>
              <span className="text-muted-foreground">{ADMIN_ROLES[user.role].label}</span>
            </p>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/change-password" />}><KeyRound className="size-4" />Change password</Button>
            <LogoutButton />
          </div>
        </div>
        <AdminNav sections={ADMIN_ROLES[user.role].sections} />
        <div className="mt-8">{children}</div>
      </main>
    </div>
  )
}
