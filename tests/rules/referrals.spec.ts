import { expect, test } from "@playwright/test"
import { referralCommission } from "@/lib/fleet"
import { canAccess } from "@/lib/admin-roles"
import { isAllowedReceipt } from "@/lib/store"

test("commission is the set share of the final fare, to the penny", () => {
  expect(referralCommission(50, 5)).toBe(2.5)
  expect(referralCommission(47, 7.5)).toBe(3.53)
  expect(referralCommission(0, 10)).toBe(0)
})

test("only super admins and admins manage referral payouts", () => {
  expect(canAccess("super_admin", "referrals")).toBe(true)
  expect(canAccess("admin", "referrals")).toBe(true)
  expect(canAccess("dispatcher", "referrals")).toBe(false)
  expect(canAccess("editor", "referrals")).toBe(false)
})

test("payout receipts must be real JPEGs of 200 KB or less", async () => {
  const jpeg = (bytes: number) => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), new Uint8Array(bytes - 4)], "receipt.jpg", { type: "image/jpeg" })
  expect(await isAllowedReceipt(jpeg(150 * 1024))).toBe(true)
  expect(await isAllowedReceipt(jpeg(200 * 1024))).toBe(true)
  expect(await isAllowedReceipt(jpeg(200 * 1024 + 1))).toBe(false)
  // A PNG renamed to .jpg is still a PNG.
  const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47]), new Uint8Array(100)], "receipt.jpg", { type: "image/jpeg" })
  expect(await isAllowedReceipt(png)).toBe(false)
  expect(await isAllowedReceipt(new File([new Uint8Array([0xff, 0xd8, 0xff])], "receipt.pdf", { type: "application/pdf" }))).toBe(false)
})
