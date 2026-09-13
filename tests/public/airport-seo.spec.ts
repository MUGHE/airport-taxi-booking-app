import { expect, test } from "@playwright/test"

const canonicalPath = "/airport-transfers/heathrow-airport-taxi"

test("a Published Airport Page exposes approved search and social metadata", async ({ page }) => {
  await page.goto(canonicalPath)
  const canonicalUrl = await page.locator('link[rel="canonical"]').getAttribute("href")
  expect(canonicalUrl).not.toBeNull()
  const siteUrl = new URL(canonicalUrl!).origin

  await expect(page).toHaveTitle("Heathrow Airport Taxi & Transfers | ONE Airport Taxi")
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Fixed-price taxi transfers to and from Heathrow Airport/)
  await expect(page.getByRole("heading", { level: 1, name: "Heathrow Airport Taxi & Transfers" })).toBeVisible()
  expect(new URL(canonicalUrl!).pathname).toBe(canonicalPath)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${siteUrl}${canonicalPath}`)
  const heroImageUrl = await page.locator("main section img").first().getAttribute("src")
  expect(heroImageUrl).not.toBeNull()
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new URL(heroImageUrl!, siteUrl).toString())
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", new URL(heroImageUrl!, siteUrl).toString())
})

test("a Published Airport Page describes its breadcrumb, airport, service, and one organisation", async ({ page }) => {
  await page.goto(canonicalPath)
  const canonicalUrl = await page.locator('link[rel="canonical"]').getAttribute("href")
  const siteUrl = new URL(canonicalUrl!).origin

  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.map((script) => JSON.parse(script.textContent ?? "null")),
  )
  const graph = schemas.flatMap((schema) => schema["@graph"] ?? [schema])
  const organisationId = `${siteUrl}/#organization`

  expect(graph.find((item) => item["@type"] === "BreadcrumbList")?.itemListElement).toEqual([
    { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "Airport Transfers", item: `${siteUrl}/airport-transfers` },
    { "@type": "ListItem", position: 3, name: "Heathrow", item: `${siteUrl}${canonicalPath}` },
  ])
  expect(graph.find((item) => item["@type"] === "Organization")?.["@id"]).toBe(organisationId)
  const airport = graph.find((item) => item["@type"] === "Airport")
  expect(airport).toMatchObject({
    name: "London Heathrow Airport",
    iataCode: "LHR",
  })
  expect(airport.address).toMatch(/Heathrow Airport.*UK/)
  expect(graph.find((item) => item["@type"] === "TaxiService")?.provider).toEqual({ "@id": organisationId })
  expect(JSON.stringify(schemas)).not.toMatch(/aggregateRating|reviewRating|ratingValue|"@type":"Review"/i)
})

test("the sitemap includes current canonical Airport Pages and excludes non-public URLs", async ({ request }) => {
  const response = await request.get("/sitemap.xml")
  const sitemap = await response.text()

  expect(response.ok()).toBeTruthy()
  expect(sitemap).toMatch(new RegExp(`<loc>https?://[^<]+${canonicalPath}</loc>`))
  expect(sitemap).not.toMatch(/<loc>https?:\/\/[^<]+\/airport-transfers\/heathrow<\/loc>/)
  expect(sitemap).not.toContain("/admin/")
  expect(sitemap).not.toContain("/preview")
  expect(sitemap).not.toContain("draft")
  expect(sitemap).not.toContain("archived")
})

test("unknown and private responses explicitly prevent indexing", async ({ page }) => {
  await page.goto("/airport-transfers/not-a-published-airport")
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)

  await page.goto("/admin/destination-pages/not-a-real-page/preview")
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
})
