"use server"

import { revalidatePath } from "next/cache"
import { createCategory, deletePost, getPostById, savePost, setPostStatus, uploadBlogImage } from "@/lib/blog"
import { blogCategoryInputSchema, blogPostInputSchema, publishProblems, sanitizeBlogDocument, type BlogCategory, type BlogPost } from "@/lib/blog-schema"
import { getAdminUser, isAdminAuthenticated } from "@/lib/session"

// Every action re-checks the signed-in admin on the server; the editor UI is never trusted.

const NOT_AUTHORIZED = { ok: false as const, error: "Not authorized." }

function refreshBlog(slug?: string) {
  revalidatePath("/blog")
  if (slug) revalidatePath(`/blog/${slug}`)
  revalidatePath("/sitemap.xml")
  revalidatePath("/admin/blog")
}

export async function saveBlogPostAction(input: unknown): Promise<{ ok: true; post: BlogPost } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
  const user = await getAdminUser()
  if (!user) return NOT_AUTHORIZED
  const id = typeof (input as { id?: unknown })?.id === "string" ? (input as { id: string }).id : undefined
  const parsed = blogPostInputSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors }
  }
  const before = id ? await getPostById(id) : null
  // A live post must stay publishable, so edits can't strip it below the publishing bar.
  if (before?.status === "published") {
    const problems = publishProblems({ ...parsed.data, content: sanitizeBlogDocument(parsed.data.content), featuredImageUrl: parsed.data.featuredImageUrl || null })
    if (problems.length) return { ok: false, error: problems.join(" ") }
  }
  const result = await savePost({ ...parsed.data, id }, { id: user.id, name: user.name || user.email })
  if (result.ok) {
    refreshBlog(result.post.slug)
    if (before && before.slug !== result.post.slug) refreshBlog(before.slug)
  }
  return result
}

export async function publishBlogPostAction(id: string) {
  if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
  const post = await getPostById(id)
  if (!post) return { ok: false as const, error: "This post no longer exists." }
  const problems = publishProblems(post)
  if (problems.length) return { ok: false as const, error: `Save these fixes before publishing: ${problems.join(" ")}` }
  const result = await setPostStatus(id, "published")
  if (result.ok) refreshBlog(result.post.slug)
  return result
}

export async function unpublishBlogPostAction(id: string) {
  if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
  const result = await setPostStatus(id, "draft")
  if (result.ok) refreshBlog(result.post.slug)
  return result
}

export async function deleteBlogPostAction(id: string) {
  if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
  const post = await getPostById(id)
  const result = await deletePost(id)
  if (result.ok) refreshBlog(post?.slug)
  return result
}

export async function createBlogCategoryAction(name: string): Promise<{ ok: true; category: BlogCategory } | { ok: false; error: string }> {
  if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
  const parsed = blogCategoryInputSchema.safeParse({ name })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const result = await createCategory(parsed.data.name)
  if (result.ok) refreshBlog()
  return result
}

export async function uploadBlogImageAction(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." }
  return uploadBlogImage(file)
}
