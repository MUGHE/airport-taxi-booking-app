import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

test("Airport Page editor uses the agreed focused workspace", async () => {
  const editor = await readFile("components/admin/destination-page-editor.tsx", "utf8")
  const preview = await readFile("components/admin/full-preview-button.tsx", "utf8")

  const orderedTabs = [
    'value: "basic-info", label: "Basic info"',
    'value: "seo", label: "SEO"',
    'value: "location", label: "Location"',
    'value: "hero", label: "Hero"',
    'value: "content", label: "Content"',
    'value: "faq-trust", label: "FAQ & trust"',
    'value: "related", label: "Related"',
    'value: "publish", label: "Publish"',
  ]

  let lastTabPosition = -1
  for (const tab of orderedTabs) {
    const position = editor.indexOf(tab)
    expect(position).toBeGreaterThan(lastTabPosition)
    lastTabPosition = position
  }

  expect(editor).toContain("<Tabs")
  expect(editor).toContain("Page structure")
  expect(editor).toContain("selectedContentSection")
  expect(editor).not.toContain('aria-expanded={open}')
  expect(editor).toContain("disabled={selectedContentSection.required}")
  expect(editor).toContain("isRequiredDestinationSectionType(type)")
  expect(editor).not.toContain("setTimeout(() => saveDraft(form, false), 1200)")
  expect(editor).toContain("Saving Draft…")
  expect(editor).not.toContain('document.addEventListener("visibilitychange"')
  expect(editor).toContain("saveDraft({ ...form, ...values, content })")
  expect(preview).toContain("Full preview")
  expect(preview).not.toContain("Side-by-side")
  expect(preview).not.toContain("<section")
})
