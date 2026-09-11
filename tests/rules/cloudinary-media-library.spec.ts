import { expect, test } from "@playwright/test"
import { deleteCloudinaryAsset, findCloudinaryAssetUsage, type MediaSnapshot } from "@/lib/cloudinary-assets"
import { destroyCloudinaryImage } from "@/lib/cloudinary"

const snapshot = (snapshotKind: MediaSnapshot["snapshotKind"], pageId: string, assetId: string): MediaSnapshot => ({
  snapshotKind,
  pageId,
  content: { hero: { image: { assetId } }, sections: [] },
})

test("media usage includes Drafts, Published Snapshots, and recovery snapshots", () => {
  expect(findCloudinaryAssetUsage([
    snapshot("draft", "draft-page", "asset-1"),
    snapshot("published", "published-page", "asset-1"),
    snapshot("recovery", "recovery-page", "asset-1"),
  ], "asset-1")).toEqual({
    draftPageIds: ["draft-page"],
    publishedPageIds: ["published-page"],
    recoveryPageIds: ["recovery-page"],
  })
})

test("a reused asset is reported once per page and remains protected", () => {
  const usage = findCloudinaryAssetUsage([
    snapshot("draft", "page-1", "asset-1"),
    { ...snapshot("published", "page-1", "asset-1"), content: { sections: [{ image: { assetId: "asset-1" } }] } },
  ], "asset-1")
  expect(usage.draftPageIds).toEqual(["page-1"])
  expect(usage.publishedPageIds).toEqual(["page-1"])
})

test("an asset not found in any snapshot is unused", () => {
  expect(findCloudinaryAssetUsage([snapshot("draft", "page-1", "other")], "asset-1")).toEqual({
    draftPageIds: [], publishedPageIds: [], recoveryPageIds: [],
  })
})

test("cancellation is explicit and an external deletion failure is not successful", async () => {
  expect(await deleteCloudinaryAsset("asset-1", false)).toEqual({ ok: false, error: "Confirm permanent deletion to continue." })
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => new Response(JSON.stringify({ result: "error", error: { message: "service unavailable" } }), { status: 503 })) as typeof fetch
  try {
    expect(await destroyCloudinaryImage("airport-pages/unused", { cloudName: "demo", apiKey: "key", apiSecret: "secret", uploadFolder: "airport-pages" })).toEqual({ ok: false, error: "service unavailable" })
  } finally {
    globalThis.fetch = originalFetch
  }
})
