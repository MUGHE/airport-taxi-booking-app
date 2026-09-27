/**
 * Password rules for customers and staff. Client-safe: the forms show these as a live
 * checklist, and every server action that sets a password re-checks them with
 * `passwordProblem`. scripts/create-super-admin.mjs mirrors them.
 */

export const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: "At least 10 characters", test: (p) => p.length >= 10 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
  { label: "A symbol, e.g. ! @ # ?", test: (p) => /[^A-Za-z0-9]/.test(p) },
]

// ponytail: tiny blocklist of the bases people pad to pass composition rules
// ("Password1!"); swap for a breached-password check (e.g. HIBP range API) if needed.
const COMMON = /password|passw0rd|qwerty|123456|letmein|welcome|admin|iloveyou|abc123/i

/** The first reason this password isn't acceptable, or `null` when it's fine. */
export function passwordProblem(password: string, email = ""): string | null {
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password ?? ""))
  if (failed) return `Password needs: ${failed.label.charAt(0).toLowerCase()}${failed.label.slice(1)}.`
  if (password.length > 128) return "Password can't be longer than 128 characters."
  if (COMMON.test(password)) return "Password is too easy to guess. Avoid common words like \"password\" or \"123456\"."
  const emailName = email.split("@")[0].toLowerCase()
  if (emailName.length >= 3 && password.toLowerCase().includes(emailName)) return "Password can't contain your email address."
  return null
}
