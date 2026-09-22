import { expect, test } from "@playwright/test"

const pilot = [
  ["westminster", "Westminster"],
  ["city-of-london", "City of London"],
  ["camden", "Camden"],
  ["kensington-and-chelsea", "Kensington and Chelsea"],
  ["hammersmith-and-fulham", "Hammersmith and Fulham"],
  ["ealing", "Ealing"],
  ["hillingdon", "Hillingdon"],
  ["tower-hamlets", "Tower Hamlets"],
  ["greenwich", "Greenwich"],
  ["croydon", "Croydon"],
] as const

test.describe("Published Place pilot", () => {
  test.skip(process.env.RUN_PLACE_PILOT_E2E !== "1", "Set RUN_PLACE_PILOT_E2E=1 after importing and publishing the ten pilot pages.")

  for (const [slug, name] of pilot) {
    test(`${name} has one public canonical page and approved structured data`, async ({ page }) => {
      const response = await page.goto(`/destinations/${slug}`)
      expect(response?.ok()).toBeTruthy()
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/destinations/${slug}$`))
      const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent ?? "null")))
      const graph = schemas.flatMap((schema) => schema?.["@graph"] ?? [schema])
      expect(graph.some((item) => item?.["@type"] === "Service")).toBeTruthy()
      expect(graph.some((item) => item?.["@type"] === "BreadcrumbList")).toBeTruthy()
      expect(JSON.stringify(schemas)).not.toMatch(/"@type"\s*:\s*"LocalBusiness"/)
    })
  }

  test("the directory finds an alias and a Covered Locality without creating another URL", async ({ page }) => {
    await page.goto("/destinations")
    const search = page.getByLabel("Search destinations")
    await search.fill("Camden Town")
    await expect(page.getByRole("link", { name: /View Camden transfers/ })).toHaveAttribute("href", "/destinations/camden")
    await search.fill("Kentish Town")
    await expect(page.getByRole("link", { name: /View Camden transfers/ })).toHaveAttribute("href", "/destinations/camden")
  })

  test("the sitemap contains only the pilot canonical Place URLs", async ({ request }) => {
    const response = await request.get("/sitemap.xml")
    const sitemap = await response.text()
    expect(response.ok()).toBeTruthy()
    for (const [slug] of pilot) expect(sitemap).toContain(`/destinations/${slug}`)
    expect(sitemap).not.toContain("/destinations/camden-town")
    expect(sitemap).not.toContain("/admin/")
  })
})
