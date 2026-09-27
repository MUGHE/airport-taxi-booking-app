import { NextResponse, type NextRequest } from "next/server"
import { GOOGLE_OAUTH_COOKIE, GOOGLE_OAUTH_COOKIE_PATH, googleRedirectUri, isGoogleSignInConfigured } from "@/lib/google-oauth"
import { startCustomerSession } from "@/lib/session"
import { createGoogleCustomer, findCustomerCredentials, findCustomerCredentialsByGoogleSub, linkGoogleAccount } from "@/lib/store"

type GoogleProfile = { sub?: string; email?: string; email_verified?: boolean; name?: string }

/** Google redirects here after the customer picks an account. */
export async function GET(request: NextRequest) {
  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url))
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", { path: GOOGLE_OAUTH_COOKIE_PATH, maxAge: 0 })
    return response
  }
  const params = request.nextUrl.searchParams
  if (params.get("error")) return finish("/account?error=google-cancelled")

  const [state, verifier] = (request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value ?? "").split(".")
  const code = params.get("code")
  if (!isGoogleSignInConfigured() || !state || !verifier || !code || params.get("state") !== state) return finish("/account?error=google-failed")

  // The token comes straight from Google over TLS with our client secret, so it's trusted
  // as-is (OIDC Core 3.1.3.7); the profile is then read from Google's userinfo endpoint.
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(request),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  })
  const token = tokenResponse.ok ? ((await tokenResponse.json()) as { access_token?: string }) : null
  if (!token?.access_token) {
    console.error("Google token exchange failed:", tokenResponse.status, await tokenResponse.text().catch(() => ""))
    return finish("/account?error=google-failed")
  }
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } })
  const profile = profileResponse.ok ? ((await profileResponse.json()) as GoogleProfile) : null
  if (!profile?.sub || !profile.email) return finish("/account?error=google-failed")
  // Only an address Google has verified may claim (or be linked to) an account here.
  if (profile.email_verified !== true) return finish("/account?error=google-unverified")

  let customerId = (await findCustomerCredentialsByGoogleSub(profile.sub))?.id
  if (!customerId) {
    const existing = await findCustomerCredentials(profile.email)
    if (existing?.googleSub) return finish("/account?error=google-conflict") // linked to a different Google account
    if (existing) {
      await linkGoogleAccount(existing, profile.sub)
      customerId = existing.id
    } else {
      const created = await createGoogleCustomer({ email: profile.email, name: profile.name?.trim() || profile.email.split("@")[0], sub: profile.sub })
      if (!created) return finish("/account?error=google-failed")
      customerId = created.id
    }
  }

  await startCustomerSession(customerId)
  return finish("/account")
}
