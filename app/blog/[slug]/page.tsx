import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogArticle } from "@/components/blog/blog-article"
import { getPublishedPostBySlug, listRelatedPosts } from "@/lib/blog"
import { serializeJsonLd } from "@/lib/json-ld"
import { ORGANIZATION_ID, SITE_URL } from "@/lib/site"

// Cached and rebuilt in the background at most every 5 minutes; publishing in the CMS refreshes it straight away.
export const revalidate = 300

// Nothing is pre-built at deploy time: each page is built on its first visit, then served from cache.
export async function generateStaticParams() {
  return []
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) return { robots: { index: false, follow: false } }
  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt
  const url = `/blog/${post.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: post.authorName ? [post.authorName] : undefined,
      section: post.category?.name,
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl, alt: post.featuredImageAlt }] : undefined,
    },
    twitter: { card: post.featuredImageUrl ? "summary_large_image" : "summary", title, description, images: post.featuredImageUrl ? [post.featuredImageUrl] : undefined },
  }
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) notFound()
  const related = await listRelatedPosts(post)

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.featuredImageUrl ? [post.featuredImageUrl] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    articleSection: post.category?.name,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <SiteHeader />
      <main className="blog-page flex-1">
        <BlogArticle post={post} related={related} />
      </main>
      <SiteFooter />
    </div>
  )
}
