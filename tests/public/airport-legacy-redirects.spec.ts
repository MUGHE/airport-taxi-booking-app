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

test("a near-match slug is not treated as an airport redirect", async ({ request }) => {
  const response = await request.get("/airport-transfers/heathrow-airport", { maxRedirects: 0 })

  expect(response.status()).toBe(404)
})
