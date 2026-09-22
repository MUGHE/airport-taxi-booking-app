import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { blockerTab } from "@/lib/destination-editor-navigation"

test("Place Page airport blockers open the Supported Airports workspace", () => {
  expect(blockerTab("missing-supported-airport")).toBe("related")
  expect(blockerTab("no-bookable-airport")).toBe("related")
})

test("save and publish show separate pending states", async () => {
  const editor = await readFile("components/admin/destination-page-editor.tsx", "utf8")

  expect(editor).toContain('pendingAction === "save" ? "Saving draft…" : "Save draft"')
  expect(editor).toContain('pendingAction === "publish" ? "Publishing…" : "Publish"')
  expect(editor).toContain("finally")
  expect(editor).toContain("useTransition")
  expect(editor).toContain("startTransition(async () =>")
})
