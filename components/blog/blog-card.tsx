import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { BlogPost } from "@/lib/blog-schema"

export function formatBlogDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }) : ""
}

export function BlogCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  return (
    <article className="blog-card">
      <Link href={`/blog/${post.slug}`} className="blog-card-image" tabIndex={-1} aria-hidden="true">
        {post.featuredImageUrl
          ? <Image src={post.featuredImageUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" priority={priority} />
          : <span className="blog-card-placeholder" />}
      </Link>
      <div className="blog-card-copy">
        <p className="blog-card-meta">
          {post.category && <span>{post.category.name}</span>}
          <time dateTime={post.publishedAt ?? undefined}>{formatBlogDate(post.publishedAt)}</time>
        </p>
        <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
        {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
        <Link href={`/blog/${post.slug}`} className="blog-card-link" aria-label={`Read ${post.title}`}>Read article <ArrowRight aria-hidden="true" /></Link>
      </div>
    </article>
  )
}
