import { defineConfig, devices } from "@playwright/test"
import { basePlaywrightConfig } from "./playwright.config"

export default defineConfig({
  ...basePlaywrightConfig,
  use: { baseURL: "http://127.0.0.1:3000" },
  projects: [
    { name: "public-desktop", testMatch: /public\/.*\.spec\.ts/, use: devices["Desktop Chrome"] },
    { name: "public-tablet", testMatch: /public\/.*\.spec\.ts/, use: { ...devices["iPad (gen 7)"], browserName: "chromium" } },
    { name: "public-mobile", testMatch: /public\/.*\.spec\.ts/, use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: {
    command: "npx --no-install next dev --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
})
