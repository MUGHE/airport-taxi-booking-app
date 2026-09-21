import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/rules",
  projects: [{ name: "rules", testMatch: /.*\.spec\.ts/ }],
})
