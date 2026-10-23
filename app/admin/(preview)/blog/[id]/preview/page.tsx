import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogArticle } from "@/components/blog/blog-article"
import { getPostById } from "@/lib/blog"
import { requireAdminSection } from "@/lib/session"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Blog preview",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
}

/** Shows any post, draft or published, exactly as the public article page will. */
export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdminSection("content", `/admin/blog/${id}/preview`)
  const post = await getPostById(id)
  if (!post) notFound()
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
        Preview{post.status === "draft" ? " of a draft — not visible to the public" : ""}. Save in the editor to see your latest changes.
      </div>
      <SiteHeader />
      <main className="blog-page flex-1">
        <BlogArticle post={{ ...post, publishedAt: post.publishedAt ?? new Date().toISOString() }} />
      </main>
      <SiteFooter />
    </div>
  )
}
