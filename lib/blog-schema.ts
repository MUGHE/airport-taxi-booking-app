import { z } from "zod"
import type { TiptapDocument, TiptapNode } from "@/lib/destination-content"

// Client-safe blog rules shared by the admin editor and the server actions.

export type BlogStatus = "draft" | "published"

export type BlogCategory = { id: string; name: string; slug: string }

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: TiptapDocument
  featuredImageUrl: string | null
  featuredImageAlt: string
  categoryId: string | null
  category: BlogCategory | null
  authorName: string
  seoTitle: string
  seoDescription: string
  status: BlogStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export const EMPTY_BLOG_DOCUMENT: TiptapDocument = { type: "doc", content: [] }
export const BLOG_POSTS_PER_PAGE = 9
export const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const BLOG_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const
export const BLOG_VIDEO_MAX_BYTES = 50 * 1024 * 1024
export const BLOG_VIDEO_TYPES = ["video/mp4", "video/webm"] as const

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** "Heathrow T5: Where to meet your driver!" -> "heathrow-t5-where-to-meet-your-driver" */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "")
}

/** Internal paths, HTTPS links and mailto/tel only — no javascript: or plain http. */
export function isSafeBlogLink(value: unknown): value is string {
  return typeof value === "string" && (/^\/(?!\/)/.test(value) || value.startsWith("https://") || value.startsWith("mailto:") || value.startsWith("tel:"))
}

/** Inline images must be HTTPS or site-relative, so pasted data: URIs never reach the page. */
export function isSafeBlogImageSrc(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("https://") || /^\/(?!\/)/.test(value))
}

export type BlogVideoSource = { kind: "embed"; url: string } | { kind: "file"; url: string }

/** YouTube and Vimeo links become player URLs; other HTTPS links must point at an MP4 or WebM file. */
export function parseBlogVideo(value: unknown): BlogVideoSource | null {
  if (typeof value !== "string") return null
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  if (url.protocol !== "https:") return null
  const host = url.hostname.replace(/^(www|m)\./, "")
  if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]
    return id && /^[\w-]{6,20}$/.test(id) ? { kind: "embed", url: `https://www.youtube-nocookie.com/embed/${id}` } : null
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/^\/(?:video\/)?(\d+)/)?.[1]
    return id ? { kind: "embed", url: `https://player.vimeo.com/video/${id}` } : null
  }
  return /\.(mp4|webm)$/i.test(url.pathname) ? { kind: "file", url: url.href } : null
}

const ALLOWED_NODES = new Set(["doc", "paragraph", "heading", "text", "bulletList", "orderedList", "listItem", "image", "blogVideo", "hardBreak", "blockquote", "horizontalRule"])
const ALLOWED_MARKS = new Set(["bold", "italic", "link"])

/** Drops anything the public renderer does not support, plus unsafe links and image sources. */
export function sanitizeBlogDocument(document: unknown): TiptapDocument {
  function clean(node: TiptapNode): TiptapNode | null {
    if (!node || typeof node !== "object" || !ALLOWED_NODES.has(node.type)) return null
    if (node.type === "image" && !isSafeBlogImageSrc(node.attrs?.src)) return null
    if (node.type === "blogVideo" && !parseBlogVideo(node.attrs?.src)) return null
    const next: TiptapNode = { type: node.type }
    if (node.type === "text") next.text = typeof node.text === "string" ? node.text : ""
    if (node.type === "heading") next.attrs = { level: node.attrs?.level === 3 || node.attrs?.level === 4 ? node.attrs.level : 2 }
    if (node.type === "blogVideo") next.attrs = { src: node.attrs!.src, title: typeof node.attrs?.title === "string" ? node.attrs.title : "" }
    if (node.type === "orderedList" && typeof node.attrs?.start === "number") next.attrs = { start: node.attrs.start }
    if (node.type === "image") next.attrs = { src: node.attrs!.src, alt: typeof node.attrs?.alt === "string" ? node.attrs.alt : "" }
    if (node.marks) {
      const marks = node.marks.filter((mark) => ALLOWED_MARKS.has(mark.type) && (mark.type !== "link" || isSafeBlogLink(mark.attrs?.href)))
        .map((mark) => (mark.type === "link" ? { type: "link", attrs: { href: mark.attrs!.href } } : { type: mark.type }))
      if (marks.length) next.marks = marks
    }
    if (Array.isArray(node.content)) next.content = node.content.map(clean).filter((child): child is TiptapNode => child !== null)
    return next
  }
  if (!document || typeof document !== "object" || (document as TiptapNode).type !== "doc") return EMPTY_BLOG_DOCUMENT
  return { type: "doc", content: (clean(document as TiptapNode)?.content ?? []) }
}

/** Plain text of a document, for word counts, excerpts and reading time. */
export function blogDocumentText(document: TiptapDocument): string {
  const parts: string[] = []
  const walk = (node: TiptapNode) => { if (node.text) parts.push(node.text); node.content?.forEach(walk) }
  document.content.forEach((node) => { walk(node); parts.push(" ") })
  return parts.join("").replace(/\s+/g, " ").trim()
}

export function readingMinutes(document: TiptapDocument): number {
  const words = blogDocumentText(document).split(" ").filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export const blogPostInputSchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(160, "Keep the title under 160 characters."),
  slug: z.string().trim().min(1, "Add a URL slug.").max(120, "Keep the slug under 120 characters.").regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens only."),
  excerpt: z.string().trim().max(320, "Keep the excerpt under 320 characters."),
  content: z.unknown(),
  featuredImageUrl: z.string().trim().refine((value) => value === "" || isSafeBlogImageSrc(value), "Featured image must be an uploaded image or an HTTPS link.").optional(),
  featuredImageAlt: z.string().trim().max(200, "Keep the image description under 200 characters."),
  categoryId: z.string().uuid().nullable().optional(),
  seoTitle: z.string().trim().max(70, "Keep the SEO title under 70 characters."),
  seoDescription: z.string().trim().max(170, "Keep the meta description under 170 characters."),
})

export type BlogPostInput = z.infer<typeof blogPostInputSchema>

/** Publishing needs more than a draft: real content, an excerpt for listings, and alt text for the featured image. */
export function publishProblems(post: Pick<BlogPost, "title" | "excerpt" | "content" | "featuredImageUrl" | "featuredImageAlt">): string[] {
  const problems: string[] = []
  if (!post.title.trim()) problems.push("Add a title.")
  if (!post.excerpt.trim()) problems.push("Add an excerpt for the blog listing.")
  if (blogDocumentText(post.content).split(" ").filter(Boolean).length < 30) problems.push("Write at least 30 words of content.")
  if (post.featuredImageUrl && !post.featuredImageAlt.trim()) problems.push("Describe the featured image (alt text).")
  return problems
}

export const blogCategoryInputSchema = z.object({
  name: z.string().trim().min(1, "Add a category name.").max(60, "Keep the name under 60 characters."),
})
