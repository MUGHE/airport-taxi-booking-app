import { expect, test } from "@playwright/test"

test("shows one collapsed help button before contact actions are opened", async ({ page }) => {
  await page.goto("/book")

  await expect(page.getByRole("heading", { name: "Book your transfer" })).toBeVisible()
  const whatsapp = page.getByRole("link", { name: "WhatsApp us" })
  const call = page.getByRole("link", { name: "Call us" })
  const contactMenu = whatsapp.locator("xpath=..")
  const helpButton = page.getByRole("button", { name: "Get help" })
  await expect(helpButton).toBeVisible()
  await expect(helpButton).toHaveAttribute("aria-expanded", "false")
  await expect(contactMenu).toHaveCSS("opacity", "0")
})
