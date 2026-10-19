import { createClient } from "@supabase/supabase-js"
import { BLOG_IMAGE_MAX_BYTES, BLOG_IMAGE_TYPES, BLOG_POSTS_PER_PAGE, EMPTY_BLOG_DOCUMENT, sanitizeBlogDocument, slugify, type BlogCategory, type BlogPost, type BlogPostInput, type BlogStatus } from "@/lib/blog-schema"

// Blog storage. Like the rest of the site this talks to Supabase with the service role key,
// so callers are responsible for authorisation (see lib/blog-actions.ts).

const BUCKET = "blog-images"

type Result<T> = ({ ok: true } & T) | { ok: false; error: string }

type CategoryRow = { id: string; name: string; slug: string }
type PostRow = {
  id: string; title: string; slug: string; excerpt: string; content: unknown
  featured_image_url: string | null; featured_image_alt: string; category_id: string | null
  author_name: string; seo_title: string; seo_description: string; status: BlogStatus
  published_at: string | null; created_at: string; updated_at: string
  blog_categories: CategoryRow | CategoryRow[] | null
}

const POST_COLUMNS = "id, title, slug, excerpt, content, featured_image_url, featured_image_alt, category_id, author_name, seo_title, seo_description, status, published_at, created_at, updated_at, blog_categories(id, name, slug)"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const NOT_CONNECTED = "The blog is not connected to the database."

function toPost(row: PostRow): BlogPost {
  const category = Array.isArray(row.blog_categories) ? row.blog_categories[0] ?? null : row.blog_categories
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content ? sanitizeBlogDocument(row.content) : EMPTY_BLOG_DOCUMENT,
    featuredImageUrl: row.featured_image_url,
    featuredImageAlt: row.featured_image_alt,
    categoryId: row.category_id,
    category,
    authorName: row.author_name,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Postgres unique violation on the slug column. */
function isSlugConflict(error: { code?: string; message?: string }) {
  return error.code === "23505" && /slug/i.test(error.message ?? "")
}

// ---- Public reads (published only) ----

export async function listPublishedPosts({ page = 1, categorySlug }: { page?: number; categorySlug?: string } = {}): Promise<{ posts: BlogPost[]; total: number; pageCount: number; page: number }> {
  const supabase = getSupabase()
  const empty = { posts: [], total: 0, pageCount: 0, page: 1 }
  if (!supabase) return empty
  const currentPage = Math.max(1, Math.floor(page) || 1)
  const from = (currentPage - 1) * BLOG_POSTS_PER_PAGE
  let query = supabase.from("blog_posts").select(POST_COLUMNS, { count: "exact" }).eq("status", "published").lte("published_at", new Date().toISOString())
  if (categorySlug) {
    const { data: category } = await supabase.from("blog_categories").select("id").eq("slug", categorySlug).maybeSingle()
    if (!category) return empty
    query = query.eq("category_id", category.id)
  }
  const { data, error, count } = await query.order("published_at", { ascending: false }).range(from, from + BLOG_POSTS_PER_PAGE - 1)
  if (error) {
    console.error("Blog listing failed", error.message)
    return empty
  }
  const total = count ?? 0
  return { posts: (data as PostRow[]).map(toPost), total, pageCount: Math.ceil(total / BLOG_POSTS_PER_PAGE), page: currentPage }
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = getSupabase()
  if (!supabase || !slug) return null
  const { data, error } = await supabase.from("blog_posts").select(POST_COLUMNS).eq("slug", slug).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle()
  if (error) console.error("Blog post read failed", error.message)
  return data ? toPost(data as PostRow) : null
}

export async function listPublishedPostSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data } = await supabase.from("blog_posts").select("slug, updated_at").eq("status", "published").lte("published_at", new Date().toISOString())
  return (data ?? []).map((row) => ({ slug: row.slug as string, updatedAt: row.updated_at as string }))
}

export async function listRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  let query = supabase.from("blog_posts").select(POST_COLUMNS).eq("status", "published").lte("published_at", new Date().toISOString()).neq("id", post.id)
  if (post.categoryId) query = query.eq("category_id", post.categoryId)
  const { data } = await query.order("published_at", { ascending: false }).limit(limit)
  return ((data ?? []) as PostRow[]).map(toPost)
}

export async function listCategories(): Promise<BlogCategory[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data } = await supabase.from("blog_categories").select("id, name, slug").order("name")
  return (data ?? []) as BlogCategory[]
}

// ---- Admin reads and writes ----

export async function listAllPosts(): Promise<BlogPost[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase.from("blog_posts").select(POST_COLUMNS).order("updated_at", { ascending: false })
  if (error) console.error("Blog admin listing failed", error.message)
  return ((data ?? []) as PostRow[]).map(toPost)
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = getSupabase()
  if (!supabase || !id) return null
  const { data } = await supabase.from("blog_posts").select(POST_COLUMNS).eq("id", id).maybeSingle()
  return data ? toPost(data as PostRow) : null
}

export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  let query = supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("slug", slug)
  if (exceptId) query = query.neq("id", exceptId)
  const { count } = await query
  return (count ?? 0) > 0
}

export async function savePost(input: BlogPostInput & { id?: string }, author: { id: string; name: string }): Promise<Result<{ post: BlogPost }>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONNECTED }
  if (await isSlugTaken(input.slug, input.id)) return { ok: false, error: "Another post already uses this URL slug." }
  const row = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: sanitizeBlogDocument(input.content),
    featured_image_url: input.featuredImageUrl || null,
    featured_image_alt: input.featuredImageAlt,
    category_id: input.categoryId || null,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
  }
  const request = input.id
    ? supabase.from("blog_posts").update(row).eq("id", input.id).select(POST_COLUMNS).maybeSingle()
    : supabase.from("blog_posts").insert({ ...row, author_id: author.id, author_name: author.name, status: "draft" }).select(POST_COLUMNS).single()
  const { data, error } = await request
  if (error) return { ok: false, error: isSlugConflict(error) ? "Another post already uses this URL slug." : "The post could not be saved. Please try again." }
  if (!data) return { ok: false, error: "This post no longer exists." }
  return { ok: true, post: toPost(data as PostRow) }
}

export async function setPostStatus(id: string, status: BlogStatus): Promise<Result<{ post: BlogPost }>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONNECTED }
  const current = await getPostById(id)
  if (!current) return { ok: false, error: "This post no longer exists." }
  // Keep the first publication date when a post is republished, so links and sitemaps stay stable.
  const publishedAt = status === "published" ? current.publishedAt ?? new Date().toISOString() : current.publishedAt
  const { data, error } = await supabase.from("blog_posts").update({ status, published_at: publishedAt }).eq("id", id).select(POST_COLUMNS).maybeSingle()
  if (error || !data) return { ok: false, error: "The post status could not be changed. Please try again." }
  return { ok: true, post: toPost(data as PostRow) }
}

export async function deletePost(id: string): Promise<Result<object>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONNECTED }
  const { error } = await supabase.from("blog_posts").delete().eq("id", id)
  return error ? { ok: false, error: "The post could not be deleted. Please try again." } : { ok: true }
}

export async function createCategory(name: string): Promise<Result<{ category: BlogCategory }>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONNECTED }
  const slug = slugify(name)
  if (!slug) return { ok: false, error: "Use letters or numbers in the category name." }
  const { data, error } = await supabase.from("blog_categories").insert({ name, slug }).select("id, name, slug").single()
  if (error) return { ok: false, error: error.code === "23505" ? "That category already exists." : "The category could not be saved." }
  return { ok: true, category: data as BlogCategory }
}

/** Stores an uploaded image in the public blog bucket and returns its public URL. */
export async function uploadBlogImage(file: File): Promise<Result<{ url: string }>> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: NOT_CONNECTED }
  if (!(BLOG_IMAGE_TYPES as readonly string[]).includes(file.type)) return { ok: false, error: "Upload a JPG, PNG, WebP or AVIF image." }
  if (file.size > BLOG_IMAGE_MAX_BYTES) return { ok: false, error: "Images must be 5 MB or smaller." }
  const extension = file.type.split("/")[1].replace("jpeg", "jpg")
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image"
  const path = `${new Date().toISOString().slice(0, 7)}/${base}-${crypto.randomUUID().slice(0, 8)}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false })
  if (error) {
    console.error("Blog image upload failed", error.message)
    return { ok: false, error: "The image could not be uploaded. Please try again." }
  }
  return { ok: true, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
}
