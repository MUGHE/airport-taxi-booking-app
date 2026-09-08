import { expect, test } from "@playwright/test"

const airportPages = [
  ["heathrow-airport-taxi", "Heathrow Airport Taxi & Transfers", "Heathrow"],
  ["gatwick-airport-taxi", "Gatwick Airport Taxi & Transfers", "Gatwick"],
  ["stansted-airport-taxi", "Stansted Airport Taxi & Transfers", "Stansted"],
  ["luton-airport-taxi", "Luton Airport Taxi & Transfers", "Luton"],
  ["london-city-airport-taxi", "London City Airport Taxi & Transfers", "London City"],
  ["southend-airport-taxi", "Southend Airport Taxi & Transfers", "Southend"],
] as const

for (const [slug, heading, shortName] of airportPages) {
  test(`${shortName} customers can see the complete airport page`, async ({ page }) => {
    await page.goto(`/airport-transfers/${slug}`)

    await expect(page).toHaveTitle(`${heading} | ONE Airport Taxi`)
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Terminals we cover" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Why book with us" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Choose your vehicle" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Frequently asked questions" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Ready when your flight lands" })).toBeVisible()
    await expect(page.getByText(`Get a fixed price to ${shortName}`)).toBeVisible()
    await expect(page.getByText(`${shortName} to your destination`)).toBeVisible()
    await expect(page.locator('a[href*="dropoffAddress"]')).toHaveAttribute("href", /\/book\?dropoffAddress=/)
    await expect(page.locator('a[href*="pickupAddress"]')).toHaveAttribute("href", /\/book\?pickupAddress=/)
  })
}
