import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ChangePasswordDialog, ProfileForm } from "@/components/account-forms"
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
      <div>
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Profile</p>
        <ProfileForm name={customer.name} phone={customer.phone} email={customer.email} hasPassword={hasPassword} />
      </div>

      <div>
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Password</p>
        <ChangePasswordDialog email={customer.email} hasPassword={hasPassword} />
      </div>
    </div>
  )
}
