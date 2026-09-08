import { expect, test } from "@playwright/test"

const airports = [
  ["heathrow-airport-taxi", "Heathrow Airport Taxi & Transfers", "Heathrow", "London Heathrow (LHR) - Terminal 2"],
  ["gatwick-airport-taxi", "Gatwick Airport Taxi & Transfers", "Gatwick", "London Gatwick (LGW) - North Terminal"],
  ["stansted-airport-taxi", "Stansted Airport Taxi & Transfers", "Stansted", "London Stansted (STN)"],
  ["luton-airport-taxi", "Luton Airport Taxi & Transfers", "Luton", "London Luton (LTN)"],
  ["london-city-airport-taxi", "London City Airport Taxi & Transfers", "London City", "London City (LCY)"],
  ["southend-airport-taxi", "Southend Airport Taxi & Transfers", "Southend", "London Southend (SEN)"],
] as const

for (const [slug, heading, shortName, primaryTerminal] of airports) {
test(`renders the seeded ${shortName} Published Snapshot`, async ({ page }) => {
  test.skip(process.env.RUN_SUPABASE_E2E !== "1", "Set RUN_SUPABASE_E2E=1 after applying the destination-page migration.")

  await page.goto(`/airport-transfers/${slug}`)

  await expect(page).toHaveTitle(`${heading} | ONE Airport Taxi`)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Fixed-price taxi transfers to and from .* Airport/,
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/airport-transfers/${slug}$`))
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible()
  await expect(page.getByText("DRAFT Heathrow Airport Taxi & Transfers")).toHaveCount(0)
  await expect(page.getByText(primaryTerminal)).toBeVisible()
  await expect(page.locator('a[href*="dropoffAddress"]')).toHaveAttribute(
    "href",
    /dropoffAddress=/,
  )
  await expect(page.locator('a[href*="pickupAddress"]')).toHaveAttribute(
    "href",
    /pickupAddress=/,
  )
})
}
