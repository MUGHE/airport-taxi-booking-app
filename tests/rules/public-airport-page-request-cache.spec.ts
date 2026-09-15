import { expect, test } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

test("shares the Published Snapshot read between metadata and page rendering", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/destination-pages.ts"), "utf8")

  expect(source).toContain('import { cache } from "react"')
  expect(source).toContain("export const readPublicAirportPage = cache(readPublicAirportPageUncached)")
})
