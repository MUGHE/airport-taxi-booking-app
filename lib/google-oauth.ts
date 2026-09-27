import type { NextRequest } from "next/server"

/**
 * "Continue with Google" for customers: OAuth 2.0 authorization-code flow with PKCE,
 * against Google's OpenID Connect endpoints. /api/auth/google starts it and
 * /api/auth/google/callback finishes it.
 */

/** Holds `state.verifier` between the two routes; scoped to them and short-lived. */
export const GOOGLE_OAUTH_COOKIE = "google_oauth"
export const GOOGLE_OAUTH_COOKIE_PATH = "/api/auth/google"

export function isGoogleSignInConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

/** Must match an "Authorized redirect URI" in the Google Cloud OAuth client exactly. */
export function googleRedirectUri(request: NextRequest): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/google/callback`
}
