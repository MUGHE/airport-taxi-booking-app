import { expect, test } from "@playwright/test"

test("hides the floating contact actions on the mobile booking form", async ({ page }) => {
  await page.goto("/book")

  await expect(page.getByRole("heading", { name: "Book your transfer" })).toBeVisible()
  const whatsapp = page.getByRole("link", { name: "WhatsApp us" })
  const call = page.getByRole("link", { name: "Call us" })
  if ((page.viewportSize()?.width ?? 0) < 640) {
    await expect(whatsapp).toBeHidden()
    await expect(call).toBeHidden()
  } else {
    await expect(whatsapp).toBeVisible()
    await expect(call).toBeVisible()
  }
})
