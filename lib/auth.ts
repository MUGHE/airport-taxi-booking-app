/**
 * Edge-safe primitives for the admin session cookie.
 *
 * This file intentionally avoids importing `next/headers` so it can be
 * used from `middleware.ts` (which runs in the Edge runtime) as well as
 * from Server Actions / Server Components.
 */

import { ADMIN_IDLE_TIMEOUT_MINUTES } from "./session-config"

export const ADMIN_SESSION_COOKIE = "admin_session"

// Sliding idle timeout: the admin is signed out after this many minutes of
// no activity. Every authenticated request that reaches `middleware.ts`
// re-issues the cookie with a fresh expiry, so an active admin never hits
// this — only a genuinely idle tab does.
const IDLE_TIMEOUT_SECONDS = ADMIN_IDLE_TIMEOUT_MINUTES * 60

// Hard cap on how long a single sign-in can last, even with continuous
// activity. This bounds the "keep sliding forever" case (e.g. a stray
// background tab polling the dashboard) and is standard defense-in-depth
// alongside the idle timeout.
const ABSOLUTE_SESSION_SECONDS = 60 * 60 * 8 // 8 hours

// Cookie `maxAge` mirrors the idle timeout: if the browser never gets a
// renewed Set-Cookie (no requests at all), it drops the cookie itself once
// the idle window elapses.
export const SESSION_MAX_AGE = IDLE_TIMEOUT_SECONDS

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

interface SessionPayload {
  /** When the admin originally signed in — never changes across renewals. */
  issuedAt: number
  /** Sliding idle-expiry — pushed forward on every renewal. */
  expiresAt: number
}

function encodePayload({ issuedAt, expiresAt }: SessionPayload): string {
  return `${issuedAt}:${expiresAt}`
}

function decodePayload(payload: string): SessionPayload | null {
  const [issuedAtRaw, expiresAtRaw] = payload.split(":")
  const issuedAt = Number(issuedAtRaw)
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return null
  return { issuedAt, expiresAt }
}

async function signToken(session: SessionPayload): Promise<string> {
  const payload = encodePayload(session)
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

/** Verifies a token's signature and returns its payload, or `null` if invalid/tampered. */
async function readToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null

  const dotIndex = token.lastIndexOf(".")
  if (dotIndex === -1) return null
  const payload = token.slice(0, dotIndex)
  const signature = token.slice(dotIndex + 1)
  if (!payload || !signature) return null

  let expected: string
  try {
    expected = await sign(payload)
  } catch {
    return null
  }
  if (!timingSafeEqual(signature, expected)) return null

  return decodePayload(payload)
}

/** Creates a signed session token for a brand-new sign-in. */
export async function createSessionToken(): Promise<string> {
  const now = Date.now()
  return signToken({
    issuedAt: now,
    expiresAt: now + IDLE_TIMEOUT_SECONDS * 1000,
  })
}

/**
 * Verifies a session token's signature, idle expiry, and absolute-session cap.
 * Never throws on malformed input.
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  const session = await readToken(token)
  if (!session) return false

  const now = Date.now()
  if (now > session.expiresAt) return false // idle timeout elapsed
  if (now > session.issuedAt + ABSOLUTE_SESSION_SECONDS * 1000) return false // absolute cap

  return true
}

/**
 * Re-signs a still-valid token with a pushed-forward idle expiry, capped at the
 * absolute session lifetime. Called on every authenticated request so an active
 * admin's session keeps sliding, while a genuinely idle one still expires on time.
 * Returns `null` if the token is invalid, already idle-expired, or past the
 * absolute cap.
 */
export async function renewSessionToken(
  token: string | undefined | null,
): Promise<string | null> {
  const session = await readToken(token)
  if (!session) return null

  const now = Date.now()
  if (now > session.expiresAt) return null
  const absoluteDeadline = session.issuedAt + ABSOLUTE_SESSION_SECONDS * 1000
  if (now > absoluteDeadline) return null

  const nextExpiresAt = Math.min(now + IDLE_TIMEOUT_SECONDS * 1000, absoluteDeadline)
  return signToken({ issuedAt: session.issuedAt, expiresAt: nextExpiresAt })
}
