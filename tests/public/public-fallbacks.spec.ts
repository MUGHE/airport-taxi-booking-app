import { expect, test } from "@playwright/test"

test.describe("Published Airport Page fallbacks", () => {
  test.skip(process.env.RUN_SUPABASE_E2E !== "1", "Set RUN_SUPABASE_E2E=1 after applying the destination-page migrations.")

  test("serves the last safe Published Snapshot when Supabase becomes unavailable", async ({ page }) => {
    await page.goto("/airport-transfers/heathrow-airport-taxi")
    const heading = await page.getByRole("heading", { level: 1 }).textContent()

    await page.route("**/*.supabase.co/**", (route) => route.abort())
    await page.reload()

    await expect(page.getByRole("heading", { level: 1, name: heading! })).toBeVisible()
    await expect(page.getByText(/DRAFT/i)).toHaveCount(0)
  })

  test("keeps useful page content and a contact route when the quote service is unavailable", async ({ page }) => {
    await page.goto("/airport-transfers/heathrow-airport-taxi")
    await expect(page.getByRole("link", { name: /Get a fixed price to Heathrow/i })).toHaveAttribute("href", /\/book\?/)
    await expect(page.getByRole("link", { name: /Contact us/i })).toHaveAttribute("href", "/contact")
  })

  test("shows a branded image placeholder with the original alternative text", async ({ page }) => {
    await page.route("**/airport-transfers/*.webp", (route) => route.abort())
    await page.route("**/res.cloudinary.com/**", (route) => route.abort())
    await page.goto("/airport-transfers/heathrow-airport-taxi")

    await expect(page.getByRole("img", { name: /Heathrow.*transfer service/i })).toBeVisible()
    await expect(page.getByText("ONE Airport Taxi").first()).toBeVisible()
  })

  test("keeps the saved address and Google Maps link when the interactive map fails", async ({ page }) => {
    await page.goto("/airport-transfers/heathrow-airport-taxi")
    await page.route("**/maps.googleapis.com/**", (route) => route.abort())
    await page.getByRole("button", { name: "View interactive map" }).click()

    await expect(page.getByText(/The map preview could not load/i)).toBeVisible()
    await expect(page.getByRole("link", { name: /Open in Google Maps/i })).toBeVisible()
  })
})
