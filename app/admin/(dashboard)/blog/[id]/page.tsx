import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BlogPostEditor } from "@/components/admin/blog-post-editor"
import { getPostById, listCategories } from "@/lib/blog"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "Edit blog post" }
export const dynamic = "force-dynamic"

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdminSection("content", `/admin/blog/${id}`)
  const [post, categories] = await Promise.all([getPostById(id), listCategories()])
  if (!post) notFound()
  return (
    <div>
      <Link href="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground">← All posts</Link>
      <h2 className="mb-6 mt-2 text-xl font-semibold tracking-tight">Edit post</h2>
      <BlogPostEditor key={post.id} post={post} categories={categories} />
    </div>
  )
}
