import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "./auth"

/** Checks the admin session cookie. Only usable in Server Components / Server Actions. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value)
}
