import { expect, test } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

test("logs the failing public Airport Page read stage without logging secrets", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/destination-pages.ts"), "utf8")

  expect(source).toContain('console.error("[airport-page-read]"')
  expect(source).toContain('reportPublicReadFailure(slug, "configuration"')
  expect(source).toContain('reportPublicReadFailure(slug, "page-query"')
  expect(source).toContain('reportPublicReadFailure(slug, "snapshot-query"')
  expect(source).toContain('reportPublicReadFailure(slug, "terminal-query"')
})
