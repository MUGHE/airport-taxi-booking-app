import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { AccountNav, CustomerLogoutButton } from "@/components/account-forms"
import { getCustomer } from "@/lib/session"

export const metadata: Metadata = {
  title: { default: "Your Account", template: "%s | Your Account" },
  robots: { index: false, follow: false },
}

// Header and tabs only. Each page checks the session itself, since a layout isn't
// re-run on every navigation and can't guard its pages' data.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomer()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 lg:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account" }]} />
        {customer && (
          <>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Hi, {customer.name}</h1>
                <p className="mt-2 text-muted-foreground">{customer.email}</p>
              </div>
              <CustomerLogoutButton />
            </div>
            <AccountNav />
          </>
        )}
        <div className={customer ? "mt-8" : undefined}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}
