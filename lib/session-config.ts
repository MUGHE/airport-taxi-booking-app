/**
 * Shared admin session-timeout config.
 *
 * Read by both the edge-safe token logic (`lib/auth.ts`, server/middleware
 * only) and the client-side idle-session UI (`components/admin/idle-session-
 * guard.tsx`) — kept in one place so the two stay in sync. This file must
 * stay free of server secrets/`next/headers` since it's imported client-side.
 */

/** Admin is signed out after this many minutes of no activity. */
export const ADMIN_IDLE_TIMEOUT_MINUTES = 30

/** How long before the idle timeout to warn the admin, with a chance to stay signed in. */
export const ADMIN_IDLE_WARNING_MINUTES = 1

/**
 * Non-secret, readable cookie set alongside the customer session so the statically
 * rendered site header can show "My account" instead of "Sign in". Grants nothing.
 */
export const CUSTOMER_HINT_COOKIE = "signed_in"

/** Referral code from a `?ref=` link, kept for 30 days so a later booking still credits the referrer. */
export const REFERRAL_COOKIE = "referral_code"
export const REFERRAL_COOKIE_DAYS = 30
