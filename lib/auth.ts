/**
 * Edge-safe primitives for the admin and customer session cookies.
 *
 * This file intentionally avoids importing `next/headers` so it can be
 * used from `proxy.ts` (which runs in the Edge runtime) as well as
 * from Server Actions / Server Components.
 */

import { ADMIN_IDLE_TIMEOUT_MINUTES } from "./session-config"

export const ADMIN_SESSION_COOKIE = "admin_session"
export const CUSTOMER_SESSION_COOKIE = "customer_session"

/** Who a session belongs to. Bound into the signed payload so a customer token can never pass as an admin one. */
export type SessionKind = "admin" | "customer"

const SESSION_SECONDS: Record<SessionKind, { idle: number; absolute: number }> = {
  // Sliding idle timeout: the admin is signed out after this many minutes of
  // no activity. Every authenticated request that reaches `proxy.ts`
  // re-issues the cookie with a fresh expiry, so an active admin never hits
  // this — only a genuinely idle tab does. The absolute cap (8 hours) bounds
  // how long a single sign-in can last even with continuous activity (e.g. a
  // stray background tab polling the dashboard).
  admin: { idle: ADMIN_IDLE_TIMEOUT_MINUTES * 60, absolute: 60 * 60 * 8 },
  // Customers stay signed in for 30 days; their sessions are never renewed.
  customer: { idle: 60 * 60 * 24 * 30, absolute: 60 * 60 * 24 * 30 },
}

// Cookie `maxAge` mirrors the idle timeout: if the browser never gets a
// renewed Set-Cookie (no requests at all), it drops the cookie itself once
// the idle window elapses.
export const SESSION_MAX_AGE = SESSION_SECONDS.admin.idle
export const CUSTOMER_SESSION_MAX_AGE = SESSION_SECONDS.customer.idle

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
  kind: SessionKind
  userId: string
  /** When the user originally signed in — never changes across renewals. */
  issuedAt: number
  /** Sliding idle-expiry — pushed forward on every renewal. */
  expiresAt: number
}

function encodePayload({ kind, userId, issuedAt, expiresAt }: SessionPayload): string {
  return `${kind}:${userId}:${issuedAt}:${expiresAt}`
}

function decodePayload(payload: string): SessionPayload | null {
  const [kind, userId, issuedAtRaw, expiresAtRaw] = payload.split(":")
  const issuedAt = Number(issuedAtRaw)
  const expiresAt = Number(expiresAtRaw)
  if ((kind !== "admin" && kind !== "customer") || !userId) return null
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return null
  return { kind, userId, issuedAt, expiresAt }
}

async function signToken(session: SessionPayload): Promise<string> {
  const payload = encodePayload(session)
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

/**
 * Verifies a token's signature, kind, idle expiry, and absolute-session cap and returns
 * its payload, or `null` if invalid/tampered/expired. Never throws on malformed input.
 */
async function readToken(
  token: string | undefined | null,
  kind: SessionKind,
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

  const session = decodePayload(payload)
  if (!session || session.kind !== kind) return null
  const now = Date.now()
  if (now > session.expiresAt) return null // idle timeout elapsed
  if (now > session.issuedAt + SESSION_SECONDS[kind].absolute * 1000) return null // absolute cap
  return session
}

/** Creates a signed session token for a brand-new sign-in. */
export async function createSessionToken(kind: SessionKind, userId: string): Promise<string> {
  const now = Date.now()
  return signToken({
    kind,
    userId,
    issuedAt: now,
    expiresAt: now + SESSION_SECONDS[kind].idle * 1000,
  })
}

/** Returns the signed-in user's id, or `null` if the token is invalid or expired. */
export async function verifySessionToken(
  token: string | undefined | null,
  kind: SessionKind,
): Promise<string | null> {
  return (await readToken(token, kind))?.userId ?? null
}

/**
 * Re-signs a still-valid admin token with a pushed-forward idle expiry, capped at the
 * absolute session lifetime. Called on every authenticated request so an active
 * admin's session keeps sliding, while a genuinely idle one still expires on time.
 * Returns `null` if the token is invalid, already idle-expired, or past the
 * absolute cap.
 */
export async function renewSessionToken(
  token: string | undefined | null,
): Promise<string | null> {
  const session = await readToken(token, "admin")
  if (!session) return null

  const { idle, absolute } = SESSION_SECONDS.admin
  const absoluteDeadline = session.issuedAt + absolute * 1000
  const nextExpiresAt = Math.min(Date.now() + idle * 1000, absoluteDeadline)
  return signToken({ ...session, expiresAt: nextExpiresAt })
}
