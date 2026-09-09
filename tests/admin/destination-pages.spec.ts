import { expect, test } from "@playwright/test"

test("admin can create an Airport Page draft and reload its identity and terminals", async ({ page }) => {
  test.skip(
    process.env.RUN_ADMIN_E2E !== "1" || !process.env.ADMIN_E2E_PASSWORD,
    "Set RUN_ADMIN_E2E=1 and ADMIN_E2E_PASSWORD for the database-backed admin journey.",
  )

  const suffix = Date.now().toString()
  const displayName = `Browser Airport ${suffix}`
  const slug = `browser-airport-${suffix}-airport-taxi`

  await page.goto("/admin/login")
  await page.getByLabel("Password").fill(process.env.ADMIN_E2E_PASSWORD!)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.goto("/admin/destination-pages/new")

  await page.getByLabel("Official name").fill(`${displayName} Official`)
  await page.getByLabel("Display name").fill(displayName)
  await page.getByLabel("IATA code").fill("ZZZ")
  await page.getByLabel("Service area").fill("Browser Test Area")
  await page.getByLabel("Airport Slug").fill(slug)
  await page.getByPlaceholder("Search for the airport in Google Places").fill("Heathrow Airport")
  await expect(page.getByRole("option").first()).toBeVisible({ timeout: 15_000 })
  await page.getByRole("option").first().click()

  await page.getByLabel("Name").fill("Main Terminal")
  await page.getByLabel("Address").fill("Browser Test Terminal, UK")
  await page.getByLabel("Latitude").fill("51.47")
  await page.getByLabel("Longitude").fill("-0.45")
  await page.getByRole("button", { name: "Save Draft" }).click()
  await expect(page.getByRole("status")).toHaveText("Draft saved.")

  await page.getByRole("link", { name: "Destination Pages" }).click()
  await page.getByRole("link", { name: displayName }).click()
  await expect(page.getByLabel("Display name")).toHaveValue(displayName)
  await expect(page.getByLabel("Airport Slug")).toHaveValue(slug)
  await expect(page.getByLabel("Name")).toHaveValue("Main Terminal")
  await expect(page.getByLabel("Address")).toHaveValue("Browser Test Terminal, UK")
})
