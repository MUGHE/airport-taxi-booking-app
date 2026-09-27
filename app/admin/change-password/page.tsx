import Image from "next/image"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChangePasswordForm } from "@/components/change-password-form"
import { LogoutButton } from "@/components/admin/logout-button"
import { changeOwnAdminPasswordAction } from "@/lib/actions"
import { getAdminUser } from "@/lib/session"

export const metadata: Metadata = {
  title: "Change Password",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}
export const dynamic = "force-dynamic"

// Lives outside the (dashboard) group: that layout sends anyone on a temporary password
// here, so rendering this page inside it would loop.
export default async function ChangePasswordPage() {
  const user = await getAdminUser()
  if (!user) redirect("/admin/login?from=/admin/change-password")

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/brand/logo-mark.png" alt="ONE Airport Taxi" width={48} height={48} className="size-12" />
          <h1 className="mt-3 text-xl font-semibold tracking-tight">{user.mustChangePassword ? "Set your own password" : "Change password"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.mustChangePassword
              ? "You signed in with a temporary password. Choose a new one to continue to the dashboard."
              : `Signed in as ${user.email}.`}
          </p>
        </div>
        <ChangePasswordForm email={user.email} action={changeOwnAdminPasswordAction} successHref="/admin">
          <div className="flex items-center justify-between gap-3 text-sm">
            {user.mustChangePassword ? <span /> : <Link href="/admin" className="text-muted-foreground underline-offset-4 hover:underline">Back to dashboard</Link>}
            <LogoutButton />
          </div>
        </ChangePasswordForm>
      </div>
    </div>
  )
}
