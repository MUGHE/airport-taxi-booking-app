import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

test("every main Airport Page editor box uses the shared collapse control", async () => {
  const editor = await readFile("components/admin/destination-page-editor.tsx", "utf8")
  const titles = [
    "Related destinations",
    "Related destination images",
    "Page identity",
    "SEO",
    "Google airport location",
    "Structured page content",
    "Reusable facts, FAQs and reviews",
    "Airport Terminals",
  ]

  expect(editor).toContain('aria-expanded={open}')
  for (const title of titles) expect(editor).toContain(`<EditorSection title="${title}"`)
})
