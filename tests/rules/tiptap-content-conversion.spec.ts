import { expect, test } from "@playwright/test"
import { blocksToTiptapDocument, isRequiredDestinationSectionType, isSafeDestinationContentLink, normalizeDestinationContent, tiptapDocumentToBlocks } from "@/lib/destination-content"

test("Tiptap conversion preserves the supported destination formatting", () => {
  const blocks = [
    { type: "heading" as const, text: "Introduction" },
    { type: "paragraph" as const, text: "A useful paragraph." },
    { type: "bold" as const, text: "Important information." },
    { type: "list" as const, text: "First item", listStyle: "bullet" as const },
    { type: "list" as const, text: "Second item", listStyle: "ordered" as const },
    { type: "link" as const, text: "Book now", href: "/book", label: "Book now" },
  ]

  expect(tiptapDocumentToBlocks(blocksToTiptapDocument(blocks))).toEqual(blocks)
})

test("Tiptap conversion ignores empty paragraphs", () => {
  expect(tiptapDocumentToBlocks({ type: "doc", content: [{ type: "paragraph" }] })).toEqual([])
})

test("saved Tiptap documents preserve mixed inline formatting", () => {
  const content = normalizeDestinationContent({
    sections: [{ type: "benefits", body: [{ type: "paragraph", text: "legacy fallback" }], bodyDocument: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Book " }, { type: "text", text: "now", marks: [{ type: "bold" }] }] }],
    } }],
  }, "Example Airport Taxi")

  expect(content.sections.find((section) => section.type === "benefits")?.bodyDocument?.content[0].content?.[1].marks).toEqual([{ type: "bold" }])
})

test("Hero and final CTA keep their saved rich-text documents", () => {
  const document = blocksToTiptapDocument([{ type: "paragraph", text: "Book now" }])
  const content = normalizeDestinationContent({ hero: { heading: "Example", body: [], bodyDocument: document }, finalCta: { heading: "Ready", body: [], bodyDocument: document } }, "Example Airport Taxi")
  expect(content.hero.bodyDocument).toEqual(document)
  expect(content.finalCta.bodyDocument).toEqual(document)
})

test("required Content Section and safe-link rules have one shared owner", () => {
  expect(isRequiredDestinationSectionType("introduction")).toBe(true)
  expect(isRequiredDestinationSectionType("reviews")).toBe(false)
  expect(isSafeDestinationContentLink("/book")).toBe(true)
  expect(isSafeDestinationContentLink("https://example.com/help")).toBe(true)
  expect(isSafeDestinationContentLink("http://example.com/help")).toBe(false)
})
