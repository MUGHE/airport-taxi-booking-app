import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ADMIN_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE, createSessionToken, verifySessionToken } from "./auth"
import { CUSTOMER_HINT_COOKIE } from "./session-config"
import { ADMIN_TABS, canAccess, type AdminSection } from "./admin-roles"
import { findAdminUser, findCustomer } from "./store"
import type { AdminUser, Customer } from "./types"

// Only usable in Server Components / Server Actions. The user is re-read from the
// database on every request (deduped per request by `cache`), so a role change or
// deactivation takes effect immediately rather than when the cookie expires.

/** The signed-in, active admin user, or `null`. */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies()
  const id = await verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value, "admin")
  const user = id ? await findAdminUser(id) : null
  return user?.active ? user : null
})

/**
 * Whether the signed-in admin's role may use this dashboard section. Nobody gets any
 * section while still on a temporary password.
 */
export async function isAdminAuthenticated(section: AdminSection): Promise<boolean> {
  const user = await getAdminUser()
  return !!user && !user.mustChangePassword && canAccess(user.role, section)
}

/**
 * Page guard: sends signed-out admins to the login page, admins on a temporary password
 * to set their own, and admins without access to this section to the first section their
 * role can open.
 */
export async function requireAdminSection(section: AdminSection, from: string): Promise<AdminUser> {
  const user = await getAdminUser()
  if (!user) redirect(`/admin/login?from=${encodeURIComponent(from)}`)
  if (user.mustChangePassword) redirect("/admin/change-password")
  if (!canAccess(user.role, section)) {
    redirect(ADMIN_TABS.find((tab) => canAccess(user.role, tab.section))!.href)
  }
  return user
}

/** The signed-in customer, or `null`. */
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const store = await cookies()
  const id = await verifySessionToken(store.get(CUSTOMER_SESSION_COOKIE)?.value, "customer")
  return id ? findCustomer(id) : null
})

export async function setSessionCookie(name: string, token: string, maxAge: number) {
  const store = await cookies()
  store.set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  })
}

/** Signs a customer in (password, email code, or Google). */
export async function startCustomerSession(customerId: string) {
  await setSessionCookie(CUSTOMER_SESSION_COOKIE, await createSessionToken("customer", customerId), CUSTOMER_SESSION_MAX_AGE)
  // Readable by the (statically rendered) site header, purely to show "My account" vs
  // "Sign in". It grants nothing — the httpOnly session cookie is what's checked.
  const store = await cookies()
  store.set(CUSTOMER_HINT_COOKIE, "1", { secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: CUSTOMER_SESSION_MAX_AGE })
}
