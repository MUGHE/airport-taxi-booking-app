import { expect, test } from "@playwright/test"

test("renders the seeded Heathrow Published Snapshot", async ({ page }) => {
  test.skip(process.env.RUN_SUPABASE_E2E !== "1", "Set RUN_SUPABASE_E2E=1 after applying the destination-page migration.")

  await page.goto("/airport-transfers/heathrow-airport-taxi")

  await expect(page).toHaveTitle("Heathrow Airport Taxi & Transfers | ONE Airport Taxi")
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Fixed-price taxi transfers to and from Heathrow Airport (LHR), all terminals. Meet & greet, flight tracking, and a professional chauffeur — booked in minutes.",
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/airport-transfers\/heathrow-airport-taxi$/)
  await expect(page.getByRole("heading", { level: 1, name: "Heathrow Airport Taxi & Transfers" })).toBeVisible()
  await expect(page.getByText("DRAFT Heathrow Airport Taxi & Transfers")).toHaveCount(0)
  await expect(page.getByText("London Heathrow (LHR) - Terminal 2")).toBeVisible()
  await expect(page.locator('a[href*="dropoffAddress"]')).toHaveAttribute(
    "href",
    /dropoffAddress=London\+Heathrow\+%28LHR%29\+-\+Terminal\+2&dropoffLat=51\.4714&dropoffLng=-0\.4494/,
  )
  await expect(page.locator('a[href*="pickupAddress"]')).toHaveAttribute(
    "href",
    /pickupAddress=London\+Heathrow\+%28LHR%29\+-\+Terminal\+2&pickupLat=51\.4714&pickupLng=-0\.4494/,
  )
})
