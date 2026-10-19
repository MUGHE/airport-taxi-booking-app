import { expect, test } from "@playwright/test"
import { canAccess } from "@/lib/admin-roles"
import { blogPostInputSchema, isSafeBlogLink, publishProblems, readingMinutes, sanitizeBlogDocument, slugify } from "@/lib/blog-schema"
import type { TiptapDocument } from "@/lib/destination-content"

const words = (count: number) => Array.from({ length: count }, (_, index) => `word${index}`).join(" ")
const paragraph = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] })
const validInput = {
  title: "Where to meet your driver at Heathrow Terminal 5",
  slug: "where-to-meet-your-driver-at-heathrow-terminal-5",
  excerpt: "A short guide to the Terminal 5 meeting point.",
  content: { type: "doc", content: [paragraph(words(40))] },
  featuredImageUrl: "",
  featuredImageAlt: "",
  categoryId: null,
  seoTitle: "",
  seoDescription: "",
}

test("slugify makes clean, URL-safe slugs from titles", () => {
  expect(slugify("Heathrow T5: Where to meet your driver!")).toBe("heathrow-t5-where-to-meet-your-driver")
  expect(slugify("  Café & Croissants — Gatwick ")).toBe("cafe-and-croissants-gatwick")
  expect(slugify("!!!")).toBe("")
  expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(120)
})

test("post schema accepts a valid draft and points at the fields that need fixing", () => {
  expect(blogPostInputSchema.safeParse(validInput).success).toBe(true)

  const result = blogPostInputSchema.safeParse({ ...validInput, title: " ", slug: "Bad Slug!", seoTitle: "x".repeat(71), featuredImageUrl: "javascript:alert(1)" })
  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining(["title", "slug", "seoTitle", "featuredImageUrl"]))
})

test("publishing requires an excerpt, real content and alt text for the featured image", () => {
  const ready = { ...validInput, content: validInput.content as TiptapDocument, featuredImageUrl: null }
  expect(publishProblems(ready)).toEqual([])
  expect(publishProblems({ ...ready, excerpt: "" })).toContain("Add an excerpt for the blog listing.")
  expect(publishProblems({ ...ready, content: { type: "doc", content: [paragraph("Too short.")] } })).toContain("Write at least 30 words of content.")
  expect(publishProblems({ ...ready, featuredImageUrl: "https://example.supabase.co/storage/v1/object/public/blog-images/a.jpg", featuredImageAlt: "" })).toContain("Describe the featured image (alt text).")
})

test("sanitiser keeps supported formatting and drops unsafe links, images and unknown nodes", () => {
  const clean = sanitizeBlogDocument({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Title" }] },
      { type: "paragraph", content: [
        { type: "text", text: "safe", marks: [{ type: "link", attrs: { href: "/book", onclick: "x" } }] },
        { type: "text", text: "unsafe", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }, { type: "bold" }] },
      ] },
      { type: "image", attrs: { src: "data:image/png;base64,AAAA", alt: "x" } },
      { type: "image", attrs: { src: "https://cdn.example.com/a.jpg", alt: "Terminal 5" } },
      { type: "codeBlock", content: [{ type: "text", text: "<script>" }] },
    ],
  })

  expect(clean.content.map((node) => node.type)).toEqual(["heading", "paragraph", "image"])
  expect(clean.content[0].attrs).toEqual({ level: 2 })
  const [safe, unsafe] = clean.content[1].content!
  expect(safe.marks).toEqual([{ type: "link", attrs: { href: "/book" } }])
  expect(unsafe.marks).toEqual([{ type: "bold" }])
  expect(clean.content[2].attrs).toEqual({ src: "https://cdn.example.com/a.jpg", alt: "Terminal 5" })
  expect(sanitizeBlogDocument("not a document")).toEqual({ type: "doc", content: [] })
})

test("only internal paths, HTTPS, mailto and tel links are allowed", () => {
  for (const href of ["/airport-transfers/heathrow-airport-taxi", "https://heathrow.com", "mailto:hi@example.com", "tel:+441234"]) expect(isSafeBlogLink(href)).toBe(true)
  for (const href of ["javascript:alert(1)", "http://example.com", "//evil.example", "data:text/html,x"]) expect(isSafeBlogLink(href)).toBe(false)
})

test("reading time rounds to at least one minute", () => {
  expect(readingMinutes({ type: "doc", content: [paragraph("Short.")] })).toBe(1)
  expect(readingMinutes({ type: "doc", content: [paragraph(words(660))] })).toBe(3)
})

test("only roles with the content section can manage the blog", () => {
  expect(canAccess("super_admin", "content")).toBe(true)
  expect(canAccess("admin", "content")).toBe(true)
  expect(canAccess("editor", "content")).toBe(true)
  expect(canAccess("dispatcher", "content")).toBe(false)
})
