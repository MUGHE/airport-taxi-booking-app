import { defineConfig } from "@playwright/test"

export const basePlaywrightConfig = {
  testDir: "./tests",
  projects: [
    { name: "admin", testMatch: /admin\/.*\.spec\.ts/ },
    { name: "rules", testMatch: /rules\/.*\.spec\.ts/ },
  ],
}

export default defineConfig(basePlaywrightConfig)
