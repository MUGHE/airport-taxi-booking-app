import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

/** `scrypt$<salt hex>$<hash hex>` — scripts/create-super-admin.mjs writes the same format. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$")
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)
  return timingSafeEqual(actual, expected)
}

// Checked when an email has no account, so a miss takes as long as a wrong password and
// sign-in timing doesn't reveal which emails are registered.
const dummyHash = hashPassword("not-a-real-password")

/**
 * Verifies against the account's hash, or a dummy one when there's no account or the account
 * has no password (Google sign-in only, stored as "") — same timing either way.
 */
export async function verifyCredentials(password: string, stored: string | undefined): Promise<boolean> {
  const ok = await verifyPassword(password, stored || (await dummyHash))
  return ok && !!stored
}
