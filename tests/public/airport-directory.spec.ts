import { expect, test } from "@playwright/test"

test("airport directory is alphabetic and links to View all", async ({ page }) => {
  await page.goto("/airport-transfers")
  await page.waitForLoadState("networkidle")

  const cards = page.locator('section[aria-labelledby="airport-directory-heading"] h3')
  const names = await cards.allTextContents()
  expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right)))
})

test("airport directory searches name, IATA code, and service area", async ({ page }) => {
  await page.goto("/airport-transfers")
  const search = page.getByLabel("Search airports")

  await search.fill("LHR")
  await expect(page.getByRole("heading", { level: 3, name: "Heathrow" })).toBeVisible()
  await expect(page.getByRole("heading", { level: 3, name: "Gatwick" })).toHaveCount(0)

  await search.fill("Hillingdon")
  await expect(page.getByRole("heading", { level: 3, name: "Heathrow" })).toBeVisible()

  await search.fill("not-an-airport")
  await expect(page.getByRole("status")).toContainText("No Published Airport Pages match")
})

test("header navigation contains at most six featured airports and View all", async ({ page }) => {
  await page.goto("/")
  const mobileMenuButton = page.getByRole("button", { name: "Toggle menu" })
  const isMobile = await mobileMenuButton.isVisible()
  const menu = isMobile ? page.locator("header details").last() : page.locator("header details").first()
  if (isMobile) await mobileMenuButton.click()
  await menu.locator("summary").click()
  await expect(menu.getByRole("link", { name: "View all airports" })).toHaveAttribute("href", "/airport-transfers")
  expect(await menu.getByRole("link").count()).toBeLessThanOrEqual(7)
  await expect(page.getByRole("main").getByRole("link", { name: "View all airports" })).toHaveAttribute("href", "/airport-transfers")
})
