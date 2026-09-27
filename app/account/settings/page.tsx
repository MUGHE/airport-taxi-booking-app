import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { EmailChangeForm, ProfileForm } from "@/components/account-forms"
import { ChangePasswordForm } from "@/components/change-password-form"
import { changeCustomerPasswordAction } from "@/lib/actions"
import { getCustomer } from "@/lib/session"
import { findCustomerCredentialsById } from "@/lib/store"

export const metadata: Metadata = { title: "Settings" }
export const dynamic = "force-dynamic"

export default async function AccountSettingsPage() {
  const customer = await getCustomer()
  if (!customer) redirect("/account")
  // Google-only accounts have no password until they set one here.
  const hasPassword = Boolean((await findCustomerCredentialsById(customer.id))?.passwordHash)

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Your details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Used for new bookings. Bookings you&apos;ve already made keep the details they were booked with.</p>
        <div className="mt-4"><ProfileForm name={customer.name} phone={customer.phone} /></div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Email address</h2>
        <p className="mt-1 text-sm text-muted-foreground">You sign in with <span className="font-medium text-foreground">{customer.email}</span>. We&apos;ll send a code to confirm a new address before switching.</p>
        <div className="mt-4">{hasPassword ? <EmailChangeForm /> : <p className="text-sm text-muted-foreground">You sign in with Google. Set a password below to change your email address.</p>}</div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{hasPassword ? "Password" : "Set a password"}</h2>
        {!hasPassword && <p className="mt-1 text-sm text-muted-foreground">Optional: lets you sign in with your email and password as well as Google.</p>}
        <div className="mt-4"><ChangePasswordForm email={customer.email} action={changeCustomerPasswordAction} requireCurrent={hasPassword} /></div>
      </section>
    </div>
  )
}
