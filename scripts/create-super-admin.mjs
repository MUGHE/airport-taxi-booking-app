// Creates (or recovers) a super admin account for the admin panel:
//   node --env-file=.env.local scripts/create-super-admin.mjs you@example.com "Your Name"
// Prompts for the password. Re-running for an existing email resets its password and
// restores it to an active super admin — the recovery path if everyone gets locked out.
import { randomBytes, scrypt } from "node:crypto"
import { createInterface } from "node:readline/promises"
import { promisify } from "node:util"
import { createClient } from "@supabase/supabase-js"

const [email, name] = process.argv.slice(2)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!email || !url || !key) {
  console.error("Usage: node --env-file=.env.local scripts/create-super-admin.mjs <email> [name]")
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
  process.exit(1)
}

const prompt = createInterface({ input: process.stdin, output: process.stdout })
const password = await prompt.question("Password (10+ chars, upper, lower, number, symbol): ")
prompt.close()
// Mirrors lib/password-policy.ts.
const weak =
  password.length < 10 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)
    ? "Password needs 10+ characters with an uppercase letter, a lowercase letter, a number and a symbol."
    : /password|passw0rd|qwerty|123456|letmein|welcome|admin|iloveyou|abc123/i.test(password)
      ? "Password is too easy to guess."
      : null
if (weak) {
  console.error(weak)
  process.exit(1)
}

// Same format as lib/password.ts hashPassword.
const salt = randomBytes(16)
const hash = await promisify(scrypt)(password, salt, 64)
const passwordHash = `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const { error } = await supabase.from("admin_users").upsert(
  { email: email.trim().toLowerCase(), ...(name && { name }), role: "super_admin", active: true, password_hash: passwordHash },
  { onConflict: "email" },
)
if (error) {
  console.error(`Failed: ${error.message}`)
  process.exit(1)
}
console.log(`${email} is a super admin. Sign in at /admin/login.`)
