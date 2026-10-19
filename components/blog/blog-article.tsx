import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock3 } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { BlogCard, formatBlogDate } from "@/components/blog/blog-card"
import { BlogContent } from "@/components/blog/blog-content"
import { Button } from "@/components/ui/button"
import { readingMinutes, type BlogPost } from "@/lib/blog-schema"

/** Full article layout, shared by the public post page and the admin preview. */
export function BlogArticle({ post, related = [] }: { post: BlogPost; related?: BlogPost[] }) {
  return (
    <>
      <article className="blog-article">
        <header className="blog-article-header">
          <div className="blog-container">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />
            {post.category && <Link href={`/blog?category=${post.category.slug}`} className="blog-article-category">{post.category.name}</Link>}
            <h1>{post.title}</h1>
            {post.excerpt && <p className="blog-article-lead">{post.excerpt}</p>}
            <p className="blog-article-meta">
              {post.authorName && <span>By {post.authorName}</span>}
              {post.publishedAt && <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>}
              <span><Clock3 aria-hidden="true" />{readingMinutes(post.content)} min read</span>
            </p>
          </div>
        </header>

        {post.featuredImageUrl && (
          <div className="blog-container">
            <div className="blog-article-image">
              <Image src={post.featuredImageUrl} alt={post.featuredImageAlt} fill priority sizes="(max-width: 900px) 100vw, 56rem" className="object-cover" />
            </div>
          </div>
        )}

        <div className="blog-container blog-article-body">
          <BlogContent document={post.content} />

          <aside className="blog-article-cta">
            <div>
              <p className="blog-article-cta-title">Need an airport transfer?</p>
              <p>Get a fixed price in 30 seconds, with flight tracking and 60 minutes&apos; free waiting.</p>
            </div>
            <Button size="lg" nativeButton={false} render={<Link href="/book" />}>Get My Fixed Price <ArrowRight aria-hidden="true" /></Button>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="blog-related" aria-labelledby="blog-related-title">
          <div className="blog-container-wide">
            <h2 id="blog-related-title">More from the blog</h2>
            <div className="blog-grid">{related.map((item) => <BlogCard key={item.id} post={item} />)}</div>
          </div>
        </section>
      )}
    </>
  )
}
