import { expect, test } from "@playwright/test"

const redirects = [
  ["heathrow", "heathrow-airport-taxi"],
  ["gatwick", "gatwick-airport-taxi"],
  ["stansted", "stansted-airport-taxi"],
  ["luton", "luton-airport-taxi"],
  ["london-city", "london-city-airport-taxi"],
  ["southend", "southend-airport-taxi"],
] as const

for (const [source, target] of redirects) {
  test(`${source} redirects directly to its canonical Airport Page`, async ({ request }) => {
    const response = await request.get(`/airport-transfers/${source}`, { maxRedirects: 0 })

    expect(response.status()).toBe(308)
    expect(response.headers().location).toBe(`/airport-transfers/${target}`)
  })
}

test("a near-match slug is not treated as an airport redirect", async ({ page }) => {
  await page.goto("/airport-transfers/heathrow-airport")

  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible()
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
})
