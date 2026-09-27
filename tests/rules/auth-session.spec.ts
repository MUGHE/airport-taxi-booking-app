import { expect, test } from "@playwright/test"
import { createSessionToken, renewSessionToken, verifySessionToken } from "@/lib/auth"
import { hashPassword, verifyCredentials, verifyPassword } from "@/lib/password"
import { canAccess } from "@/lib/admin-roles"
import { passwordProblem } from "@/lib/password-policy"

process.env.ADMIN_AUTH_SECRET ||= "test-secret"

test("session tokens carry the user and can't cross between admin and customer", async () => {
  const admin = await createSessionToken("admin", "user-1")
  const customer = await createSessionToken("customer", "cust-1")
  expect(await verifySessionToken(admin, "admin")).toBe("user-1")
  expect(await verifySessionToken(customer, "customer")).toBe("cust-1")
  expect(await verifySessionToken(customer, "admin")).toBeNull()
  expect(await renewSessionToken(customer)).toBeNull()
  expect(await verifySessionToken(await renewSessionToken(admin), "admin")).toBe("user-1")
})

test("tampered or legacy tokens are rejected", async () => {
  const token = await createSessionToken("customer", "cust-1")
  expect(await verifySessionToken(token.replace("customer:", "admin:"), "admin")).toBeNull()
  expect(await verifySessionToken("1700000000000:1700000000000.abc", "admin")).toBeNull()
})

test("passwords hash with a salt and only verify with the right password", async () => {
  const hash = await hashPassword("Correct-Horse-9")
  expect(hash).not.toBe(await hashPassword("Correct-Horse-9"))
  expect(await verifyPassword("Correct-Horse-9", hash)).toBe(true)
  expect(await verifyPassword("wrong", hash)).toBe(false)
  expect(await verifyCredentials("Correct-Horse-9", undefined)).toBe(false)
  // Google-only customers are stored with an empty hash: no password can ever match it.
  expect(await verifyCredentials("Correct-Horse-9", "")).toBe(false)
  expect(await verifyCredentials("", "")).toBe(false)
})

test("password policy rejects weak passwords and accepts strong ones", () => {
  expect(passwordProblem("short1!A")).toMatch(/10 characters/)
  expect(passwordProblem("alllowercase1!")).toMatch(/uppercase/)
  expect(passwordProblem("NoNumbersHere!")).toMatch(/number/)
  expect(passwordProblem("NoSymbols1234")).toMatch(/symbol/)
  expect(passwordProblem("Password123!")).toMatch(/too easy/)
  expect(passwordProblem("Mughees#2026x", "mughees@example.com")).toMatch(/email/)
  expect(passwordProblem("Blue-Taxi-42-Gate")).toBeNull()
})

test("roles only reach their sections", () => {
  expect(canAccess("super_admin", "users")).toBe(true)
  expect(canAccess("admin", "users")).toBe(false)
  expect(canAccess("dispatcher", "pricing")).toBe(false)
  expect(canAccess("editor", "content")).toBe(true)
})
