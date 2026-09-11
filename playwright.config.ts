import { defineConfig } from "@playwright/test"

export const basePlaywrightConfig = {
  use: { baseURL: "http://127.0.0.1:3000" },
  testDir: "./tests",
  projects: [
    { name: "admin", testMatch: /admin\/.*\.spec\.ts/ },
    { name: "rules", testMatch: /rules\/.*\.spec\.ts/ },
  ],
}

export default defineConfig({
  ...basePlaywrightConfig,
  webServer: {
    command: "npx --no-install next dev --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
})
