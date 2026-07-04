/**
 * Edge-safe primitives for the admin session cookie.
 *
 * This file intentionally avoids importing `next/headers` so it can be
 * used from `middleware.ts` (which runs in the Edge runtime) as well as
 * from Server Actions / Server Components.
 */

export const ADMIN_SESSION_COOKIE = "admin_session"

const SESSION_TTL_SECONDS = 60 * 60 * 8 // 8 hours
export const SESSION_MAX_AGE = SESSION_TTL_SECONDS

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** Constant-time string comparison to avoid timing attacks on the signature check. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

function getAuthSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET
  if (!secret) {
    throw new Error(
      "ADMIN_AUTH_SECRET is not set. Add it to your environment variables (see .env.example).",
    )
  }
  return secret
}

async function sign(payload: string): Promise<string> {
  const secret = getAuthSecret()
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  )
  return bufferToHex(signature)
}

/** Creates a signed session token (`expiry.signature`) valid for SESSION_TTL_SECONDS. */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000
  const payload = String(expiresAt)
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

/** Verifies a session token's signature and expiry. Never throws on malformed input. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false

  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false

  let expected: string
  try {
    expected = await sign(payload)
  } catch {
    return false
  }
  if (!timingSafeEqual(signature, expected)) return false

  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false

  return true
}
