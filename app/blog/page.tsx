import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { BlogCard } from "@/components/blog/blog-card"
import { listCategories, listPublishedPosts } from "@/lib/blog"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{ page?: string; category?: string }>

function blogHref(page: number, category?: string) {
  const params = new URLSearchParams()
  if (category) params.set("category", category)
  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `/blog?${query}` : "/blog"
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { page, category } = await searchParams
  const pageNumber = Math.max(1, Number(page) || 1)
  const title = pageNumber > 1 ? `Airport Travel Blog – Page ${pageNumber}` : "Airport Travel Blog"
  const description = "Practical guides for London airport transfers: terminals, pickup points, journey times and tips for a smoother trip."
  return {
    title,
    description,
    alternates: { canonical: blogHref(pageNumber, category) },
    openGraph: { type: "website", title: `${title} | ONE Airport Taxi`, description, url: blogHref(pageNumber, category) },
  }
}

export default async function BlogIndexPage({ searchParams }: { searchParams: SearchParams }) {
  const { page, category } = await searchParams
  const [{ posts, pageCount, page: currentPage }, categories] = await Promise.all([
    listPublishedPosts({ page: Number(page) || 1, categorySlug: category }),
    listCategories(),
  ])
  const activeCategory = categories.find((item) => item.slug === category)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="blog-page flex-1">
        <header className="blog-index-header">
          <div className="blog-container-wide">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
            <p className="blog-eyebrow">ONE Airport Taxi blog</p>
            <h1>{activeCategory ? activeCategory.name : "Airport travel guides and tips"}</h1>
            <p className="blog-index-lead">Practical advice for getting to and from London&apos;s airports: terminals, pickup points, journey times and what to expect.</p>
            {categories.length > 0 && (
              <nav className="blog-categories" aria-label="Blog categories">
                <Link href="/blog" className={cn(!activeCategory && "is-active")} aria-current={!activeCategory ? "page" : undefined}>All posts</Link>
                {categories.map((item) => (
                  <Link key={item.id} href={blogHref(1, item.slug)} className={cn(activeCategory?.id === item.id && "is-active")} aria-current={activeCategory?.id === item.id ? "page" : undefined}>{item.name}</Link>
                ))}
              </nav>
            )}
          </div>
        </header>

        <section className="blog-container-wide blog-listing" aria-label="Blog posts">
          {posts.length === 0 ? (
            <div className="blog-empty">
              <p className="font-semibold">No articles here yet.</p>
              <p>Check back soon, or <Link href="/book">get a fixed price for your transfer</Link>.</p>
            </div>
          ) : (
            <div className="blog-grid">{posts.map((post, index) => <BlogCard key={post.id} post={post} priority={index < 3} />)}</div>
          )}

          {pageCount > 1 && (
            <nav className="blog-pagination" aria-label="Blog pages">
              {currentPage > 1 ? <Link href={blogHref(currentPage - 1, category)} rel="prev"><ArrowLeft aria-hidden="true" /> Newer</Link> : <span />}
              <span>Page {currentPage} of {pageCount}</span>
              {currentPage < pageCount ? <Link href={blogHref(currentPage + 1, category)} rel="next">Older <ArrowRight aria-hidden="true" /></Link> : <span />}
            </nav>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
