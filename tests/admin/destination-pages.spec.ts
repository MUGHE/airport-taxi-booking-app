import { expect, test } from "@playwright/test"

test("unauthenticated visitors cannot open Full Preview", async ({ page }) => {
  await page.goto("/admin/destination-pages/not-a-real-page/preview")
  await expect(page).toHaveURL(/\/admin\/login\?from=/)
  await expect(page.getByText("Full Preview")).not.toBeVisible()
})

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

  await expect(page.getByRole("tab", { name: /Basic info/ })).toHaveAttribute("aria-selected", "true")
  await expect(page.getByLabel("Official name")).toBeVisible()
  await expect(page.getByLabel("SEO title")).not.toBeVisible()
  await page.getByLabel("Page title").fill(displayName)
  await page.getByLabel("Official name").fill(`${displayName} Official`)
  await page.getByLabel("IATA code").fill("ZZZ")
  await page.getByLabel("Service area").fill("Browser Test Area")

  await page.getByRole("tab", { name: /^SEO/ }).click()
  await expect(page.getByLabel("Page title")).not.toBeVisible()
  await page.getByLabel("Airport Slug").fill(slug)
  await page.getByLabel("SEO title").fill(`${displayName} Taxi Transfers`)
  await page.getByLabel("Meta description").fill(`Book a fixed-price transfer for ${displayName}.`)
  await page.getByLabel("H1 page heading").fill(`${displayName} Airport Transfers`)
  const searchPreview = page.getByRole("heading", { name: "Search-result preview" }).locator("..")
  await expect(searchPreview).toContainText(`${displayName} Taxi Transfers`)
  await expect(searchPreview).toContainText(`Book a fixed-price transfer for ${displayName}.`)
  await expect(searchPreview).toContainText(`/airport-transfers/${slug}`)

  await page.getByRole("tab", { name: /Location/ }).click()
  await page.getByPlaceholder("Search for the airport in Google Places").fill("Heathrow Airport")
  await expect(page.getByRole("option").first()).toBeVisible({ timeout: 15_000 })
  await page.getByRole("option").first().click()

  await page.getByLabel("Name").fill("Main Terminal")
  await page.getByPlaceholder("Search terminal address").fill("Heathrow Airport")
  await expect(page.getByRole("option").last()).toBeVisible({ timeout: 15_000 })
  await page.getByRole("option").last().click()
  await page.getByRole("button", { name: "Save draft" }).click()
  await expect(page.getByRole("status")).toHaveText("Draft saved.")
  await expect(page.getByTitle(/Full Preview/)).toHaveCount(0)
  const previewPagePromise = page.waitForEvent("popup")
  await page.getByRole("link", { name: "Full preview" }).click()
  const previewPage = await previewPagePromise
  await expect(previewPage.getByRole("heading", { name: displayName }).first()).toBeVisible()
  await expect(previewPage.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i)
  await expect(previewPage.locator('link[rel="canonical"]')).toHaveCount(0)
  await expect(previewPage.getByText("Airport location")).toBeVisible()
  await expect(previewPage.getByText(/Heathrow Airport/).last()).toBeVisible()
  await previewPage.setViewportSize({ width: 390, height: 844 })
  await expect(previewPage.getByRole("heading", { name: displayName }).first()).toBeVisible()
  await previewPage.setViewportSize({ width: 768, height: 1024 })
  await expect(previewPage.getByRole("heading", { name: displayName }).first()).toBeVisible()
  await expect(previewPage.getByText("Airport location")).toBeVisible()
  await previewPage.getByRole("button", { name: "View interactive map" }).click()
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    await expect(previewPage.getByTitle(/Google map of/)).toHaveAttribute("src", /google\.com\/maps\/embed\/v1\/place/)
  } else {
    await expect(previewPage.getByText(/map preview could not load/i)).toBeVisible()
  }
  await previewPage.close()

  await page.getByRole("link", { name: "Destination Pages" }).click()
  await page.getByRole("link", { name: displayName }).click()
  await expect(page.getByLabel("Page title")).toHaveValue(displayName)
  await page.getByRole("tab", { name: /^SEO/ }).click()
  await expect(page.getByLabel("Airport Slug")).toHaveValue(slug)
  await expect(page.getByLabel("SEO title")).toHaveValue(`${displayName} Taxi Transfers`)
  await expect(page.getByLabel("Meta description")).toHaveValue(`Book a fixed-price transfer for ${displayName}.`)
  await expect(page.getByLabel("H1 page heading")).toHaveValue(`${displayName} Airport Transfers`)
  await page.getByRole("tab", { name: /Location/ }).click()
  await expect(page.getByLabel("Name")).toHaveValue("Main Terminal")
  await expect(page.getByPlaceholder("Search terminal address")).toHaveValue(/Heathrow Airport/i)
})

test("admin can compose controlled sections and explicitly save them as a draft", async ({ page }) => {
  test.skip(
    process.env.RUN_ADMIN_E2E !== "1" || !process.env.ADMIN_E2E_PASSWORD,
    "Set RUN_ADMIN_E2E=1 and ADMIN_E2E_PASSWORD for the database-backed admin journey.",
  )

  await page.goto("/admin/login")
  await page.getByLabel("Password").fill(process.env.ADMIN_E2E_PASSWORD!)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.goto("/admin/destination-pages/new")

  await page.getByRole("tab", { name: /Content/ }).click()
  await expect(page.getByText("Hero and quote form")).toBeVisible()
  await expect(page.getByText("Final booking CTA")).toBeVisible()
  await expect(page.getByRole("button", { name: "Hide" }).first()).toBeDisabled()

  await page.getByLabel("New section type").selectOption("reviews")
  await page.getByRole("button", { name: "Add Content Section" }).click()
  const pageStructure = page.getByLabel("Page structure")
  const reviewsRow = pageStructure.getByRole("button", { name: /Verified reviews/ }).locator("..")
  await reviewsRow.getByRole("button", { name: "Hide" }).click()
  const reviewsEditor = page.getByTestId("rich-text-editor")
  await expect(reviewsEditor).toHaveCount(1)
  await reviewsEditor.locator("[contenteditable=true]").fill("Verified Heathrow passenger feedback")
  await reviewsEditor.getByRole("button", { name: "Bold" }).click()
  await page.getByRole("tab", { name: /Hero/ }).click()
  await page.getByLabel("Hero heading").fill("A saved Heathrow airport transfer draft")
  await page.getByRole("button", { name: "Save draft" }).click()
  await expect(page.getByRole("status")).toHaveText("Draft saved.")

  await page.reload()
  await page.getByRole("tab", { name: /Hero/ }).click()
  await expect(page.getByLabel("Hero heading")).toHaveValue("A saved Heathrow airport transfer draft")
  await page.getByRole("tab", { name: /Content/ }).click()
  const savedReviews = page.getByLabel("Page structure").getByRole("button", { name: /Verified reviews/ })
  await expect(savedReviews).toContainText("Hidden")
  await savedReviews.click()
  await expect(page.getByText("Verified Heathrow passenger feedback")).toBeVisible()
})

test("admin sees reusable content selectors and local FAQ minimum feedback", async ({ page }) => {
  test.skip(
    process.env.RUN_ADMIN_E2E !== "1" || !process.env.ADMIN_E2E_PASSWORD,
    "Set RUN_ADMIN_E2E=1 and ADMIN_E2E_PASSWORD for the database-backed admin journey.",
  )

  await page.goto("/admin/login")
  await page.getByLabel("Password").fill(process.env.ADMIN_E2E_PASSWORD!)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.goto("/admin/destination-pages/new")

  await page.getByRole("tab", { name: /FAQ & trust/ }).click()
  await expect(page.getByRole("heading", { name: "FAQs and trust content" })).toBeVisible()
  await expect(page.getByText("Flight tracking")).toBeVisible()
  await expect(page.getByText("Global FAQs")).toBeVisible()
  await expect(page.getByText("0/3 minimum")).toBeVisible()
  const flightTrackingFact = page.locator("label").filter({ hasText: "Flight tracking" }).first().getByRole("checkbox")
  await flightTrackingFact.check()
  await expect(flightTrackingFact).toBeChecked()
})
