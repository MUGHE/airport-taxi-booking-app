import { expect, test, type Page } from "@playwright/test"

// Uses a made-up address: every step behaves the same for unknown emails, so nothing is
// written to the database and no email is sent.
const TAB_KEY = "password-reset-tab"

async function startReset(page: Page) {
  await page.goto("/account/forgot-password")
  // The dev server hydrates late; typing before React takes over the input is lost.
  await page.waitForLoadState("networkidle")
  await page.getByLabel("Email").fill(`reset-flow-${Date.now()}@example.com`)
  await page.getByRole("button", { name: "Send code" }).click()
  await expect(page.getByLabel("Code")).toBeVisible()
  // No step lives in the URL.
  await expect(page).toHaveURL(/\/account\/forgot-password$/)
}

const resetCookie = async (page: Page) => (await page.context().cookies()).find((cookie) => cookie.name === "password_reset")

test("closing the tab ends the reset, even when the tab is restored (Ctrl+Shift+T)", async ({ context }) => {
  const page = await context.newPage()
  await startReset(page)
  const tabId = await page.evaluate((key) => sessionStorage.getItem(key), TAB_KEY)
  expect(tabId).toBeTruthy()
  expect(await resetCookie(page)).toBeTruthy()

  await page.close({ runBeforeUnload: true })
  // The closing page's beacon ends the flow on the server, which drops the step cookie.
  await expect.poll(async () => (await context.cookies()).some((cookie) => cookie.name === "password_reset"), { timeout: 10_000 }).toBe(false)

  // What a tab restore does: a new tab carrying the closed tab's sessionStorage.
  const restored = await context.newPage()
  await restored.addInitScript(([key, id]) => sessionStorage.setItem(key, id), [TAB_KEY, tabId!] as const)
  await restored.goto("/account/forgot-password")
  await expect(restored.getByLabel("Email")).toBeVisible()
  await expect(restored.getByLabel("Code")).toHaveCount(0)
  expect(await resetCookie(restored)).toBeUndefined()
})

test("reloading the tab ends the reset", async ({ page }) => {
  await startReset(page)
  await page.reload()
  await expect(page.getByLabel("Email")).toBeVisible()
  await expect(page.getByLabel("Code")).toHaveCount(0)
})

test("another tab can't pick up a reset started elsewhere", async ({ context }) => {
  const first = await context.newPage()
  await startReset(first)

  // Same browser, new tab straight to the page: it isn't handed the other tab's step.
  const second = await context.newPage()
  await second.goto("/account/forgot-password")
  await expect(second.getByLabel("Email")).toBeVisible()
  await expect(second.getByLabel("Code")).toHaveCount(0)

  // …and that ended the flow, so the first tab can't carry on either.
  await first.getByLabel("Code").fill("123456")
  await first.getByRole("button", { name: "Continue" }).click()
  await expect(first.getByText("Your reset session has ended")).toBeVisible()
  await expect(first.getByLabel("Email")).toBeVisible()
})

test("resend unlocks only after the 60-second countdown", async ({ page }) => {
  await startReset(page)
  const resend = page.getByRole("button", { name: /Resend code/ })
  await expect(resend).toBeDisabled()
  await expect(resend).toHaveText(/Resend code in 0:(59|60|5\d)/)
})
