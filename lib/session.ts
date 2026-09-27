import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ADMIN_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE, createSessionToken, readSessionToken, readSignedValue, signValue, verifySessionToken } from "./auth"
import { CUSTOMER_HINT_COOKIE } from "./session-config"
import { ADMIN_TABS, canAccess, type AdminSection } from "./admin-roles"
import { findAdminUser, findCustomer, findCustomerCredentials, findCustomerCredentialsById, updateCustomerVerification } from "./store"
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
  const session = await readSessionToken(store.get(CUSTOMER_SESSION_COOKIE)?.value, "customer")
  const customer = session ? await findCustomerCredentialsById(session.userId) : null
  if (!session || !customer?.emailVerified) return null
  // A password reset or change signs out every session that began before it.
  if (customer.passwordChangedAt && session.issuedAt < Date.parse(customer.passwordChangedAt)) return null
  return { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone, referralCode: customer.referralCode }
})

// --- Forgot-password flow state ---------------------------------------------------
// Which step of /account/forgot-password this browser has reached lives only in this
// signed, httpOnly cookie, scoped to that one page. Nothing about the flow is in the URL,
// so a step can't be reached by typing an address, and the account can't be swapped
// between steps (the email is fixed here at step 1). `tabId` ties the flow to the browser
// tab that started it: that tab keeps it in sessionStorage, which dies with the tab.

const PASSWORD_RESET_COOKIE = "password_reset"
const PASSWORD_RESET_PATH = "/account/forgot-password"
/** Minimum gap between reset codes; the page counts it down before enabling "Resend code". */
export const RESET_RESEND_MS = 60 * 1000

export type PasswordResetState =
  | { stage: "code"; email: string; exp: number; /** When the latest code was requested (resend cooldown). */ sentAt: number; tabId: string }
  | { stage: "verified"; customerId: string; nonce: string; exp: number; tabId: string }

export async function writePasswordResetState(state: PasswordResetState): Promise<void> {
  const store = await cookies()
  store.set(PASSWORD_RESET_COOKIE, await signValue(Buffer.from(JSON.stringify(state)).toString("base64url")), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: PASSWORD_RESET_PATH,
    maxAge: Math.max(0, Math.ceil((state.exp - Date.now()) / 1000)),
  })
}

/** The flow's current step, or `null` if there isn't one (none started, expired, or tampered with). */
export async function readPasswordResetState(): Promise<PasswordResetState | null> {
  const store = await cookies()
  const value = await readSignedValue(store.get(PASSWORD_RESET_COOKIE)?.value)
  if (!value) return null
  try {
    const state = JSON.parse(Buffer.from(value, "base64url").toString()) as PasswordResetState
    return typeof state.exp === "number" && Date.now() < state.exp ? state : null
  } catch {
    return null
  }
}

export async function clearPasswordResetState(): Promise<void> {
  const store = await cookies()
  store.set(PASSWORD_RESET_COOKIE, "", { path: PASSWORD_RESET_PATH, maxAge: 0 })
}

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
  // Readable by the (statically rendered) site header, purely to show the signed-in avatar
  // (name, for its initial) instead of "Sign in". It grants nothing — the httpOnly session
  // cookie above is what's actually checked.
  const customer = await findCustomer(customerId)
  const store = await cookies()
  store.set(CUSTOMER_HINT_COOKIE, encodeURIComponent(customer?.name?.trim() || "?"), {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE,
  })
}

/**
 * Ends the flow for good: spends its emailed code or its set-a-password permission in the
 * database, then drops the cookie. Because the database side is gone too, a browser that
 * restores the old tab (cookie, sessionStorage and all) finds nothing left to continue.
 */
export async function endPasswordResetFlow(): Promise<void> {
  const state = await readPasswordResetState()
  const customer = state?.stage === "code"
    ? await findCustomerCredentials(state.email)
    : state?.stage === "verified" ? await findCustomerCredentialsById(state.customerId) : null
  const flowPurpose = state?.stage === "code" ? "password_reset" : "password_reset_verified"
  if (customer?.otpPurpose === flowPurpose) {
    await updateCustomerVerification(customer.id, { otp_hash: null, otp_expires_at: null, otp_attempts: 0, otp_purpose: null })
  }
  await clearPasswordResetState()
}
