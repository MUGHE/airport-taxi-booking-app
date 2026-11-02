"use server"

import { revalidatePath, updateTag } from "next/cache"
import { BLOG_TAG, createBlogVideoUpload, createCategory, deletePost, getPostById, savePost, setPostStatus, uploadBlogImage } from "@/lib/blog"
import { blogCategoryInputSchema, blogPostInputSchema, publishProblems, sanitizeBlogDocument, type BlogCategory, type BlogPost } from "@/lib/blog-schema"
import { getAdminUser, isAdminAuthenticated } from "@/lib/session"

// Every action re-checks the signed-in admin on the server; the editor UI is never trusted.

const NOT_AUTHORIZED = { ok: false as const, error: "Not authorized." }

/** The change is already saved at this point, so a failed cache refresh is logged rather than reported as a failed save. */
function refreshBlog(slug?: string) {
  try {
    updateTag(BLOG_TAG)
    revalidatePath("/blog")
    if (slug) revalidatePath(`/blog/${slug}`)
    revalidatePath("/sitemap.xml")
    revalidatePath("/admin/blog")
  } catch (error) {
    console.error("Blog cache refresh failed", error)
  }
}

/** An uncaught error here crashes the admin page with no message, so it becomes a normal failed result and goes to the server log. */
async function guarded<T>(name: string, message: string, run: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await run()
  } catch (error) {
    console.error(`Blog action failed: ${name}`, error)
    return { ok: false, error: message }
  }
}

export async function saveBlogPostAction(input: unknown): Promise<{ ok: true; post: BlogPost } | { ok: false; error: string; fieldErrors?: Record<string, string> }> {
  return guarded("save", "The post could not be saved. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    const user = await getAdminUser()
    if (!user) return NOT_AUTHORIZED
    const id = typeof (input as { id?: unknown })?.id === "string" ? (input as { id: string }).id : undefined
    const parsed = blogPostInputSchema.safeParse(input)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message
      return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors }
    }
    const before = id ? await getPostById(id) : null
    // A live post must stay publishable, so edits can't strip it below the publishing bar.
    if (before?.status === "published") {
      const problems = publishProblems({ ...parsed.data, content: sanitizeBlogDocument(parsed.data.content), featuredImageUrl: parsed.data.featuredImageUrl || null })
      if (problems.length) return { ok: false as const, error: problems.join(" ") }
    }
    const result = await savePost({ ...parsed.data, id }, { id: user.id, name: user.name || user.email })
    if (result.ok) {
      refreshBlog(result.post.slug)
      if (before && before.slug !== result.post.slug) refreshBlog(before.slug)
    }
    return result
  })
}

export async function publishBlogPostAction(id: string) {
  return guarded("publish", "The post could not be published. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    const post = await getPostById(id)
    if (!post) return { ok: false as const, error: "This post no longer exists." }
    const problems = publishProblems(post)
    if (problems.length) return { ok: false as const, error: `Save these fixes before publishing: ${problems.join(" ")}` }
    const result = await setPostStatus(id, "published")
    if (result.ok) refreshBlog(result.post.slug)
    return result
  })
}

export async function unpublishBlogPostAction(id: string) {
  return guarded("unpublish", "The post could not be unpublished. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    const result = await setPostStatus(id, "draft")
    if (result.ok) refreshBlog(result.post.slug)
    return result
  })
}

export async function deleteBlogPostAction(id: string) {
  return guarded("delete", "The post could not be deleted. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    const post = await getPostById(id)
    const result = await deletePost(id)
    if (result.ok) refreshBlog(post?.slug)
    return result
  })
}

export async function createBlogCategoryAction(name: string): Promise<{ ok: true; category: BlogCategory } | { ok: false; error: string }> {
  return guarded("create category", "The category could not be saved. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    const parsed = blogCategoryInputSchema.safeParse({ name })
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }
    const result = await createCategory(parsed.data.name)
    if (result.ok) refreshBlog()
    return result
  })
}

export async function uploadBlogImageAction(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  return guarded("upload image", "The image could not be uploaded. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "Choose an image to upload." }
    return uploadBlogImage(file)
  })
}

export async function createBlogVideoUploadAction(file: { name: string; type: string; size: number }): Promise<{ ok: true; uploadUrl: string; url: string } | { ok: false; error: string }> {
  return guarded("start video upload", "The video could not be uploaded. Please try again.", async () => {
    if (!(await isAdminAuthenticated("content"))) return NOT_AUTHORIZED
    return createBlogVideoUpload(file)
  })
}
