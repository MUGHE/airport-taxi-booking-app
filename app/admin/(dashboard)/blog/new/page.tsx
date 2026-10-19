import type { Metadata } from "next"
import Link from "next/link"
import { BlogPostEditor } from "@/components/admin/blog-post-editor"
import { listCategories } from "@/lib/blog"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "New blog post" }
export const dynamic = "force-dynamic"

export default async function NewBlogPostPage() {
  await requireAdminSection("content", "/admin/blog/new")
  return (
    <div>
      <Link href="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground">← All posts</Link>
      <h2 className="mb-6 mt-2 text-xl font-semibold tracking-tight">New blog post</h2>
      <BlogPostEditor categories={await listCategories()} />
    </div>
  )
}
