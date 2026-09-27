import { createHash, randomBytes } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { GOOGLE_OAUTH_COOKIE, GOOGLE_OAUTH_COOKIE_PATH, googleRedirectUri, isGoogleSignInConfigured } from "@/lib/google-oauth"

/** Sends the customer to Google's account chooser. */
export async function GET(request: NextRequest) {
  if (!isGoogleSignInConfigured()) return NextResponse.redirect(new URL("/account?error=google-unavailable", request.url))

  // `state` ties the callback to this browser (CSRF); the PKCE verifier ties the code to it.
  const state = randomBytes(16).toString("base64url")
  const verifier = randomBytes(32).toString("base64url")
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString()

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(GOOGLE_OAUTH_COOKIE, `${state}.${verifier}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax still sends it on Google's top-level redirect back to the callback.
    sameSite: "lax",
    path: GOOGLE_OAUTH_COOKIE_PATH,
    maxAge: 10 * 60,
  })
  return response
}
