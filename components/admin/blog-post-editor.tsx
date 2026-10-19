"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ExternalLink, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { BlogRichTextEditor } from "@/components/admin/blog-rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBlogCategoryAction, deleteBlogPostAction, publishBlogPostAction, saveBlogPostAction, unpublishBlogPostAction, uploadBlogImageAction } from "@/lib/blog-actions"
import { EMPTY_BLOG_DOCUMENT, slugify, type BlogCategory, type BlogPost } from "@/lib/blog-schema"

type Form = {
  title: string; slug: string; excerpt: string; content: BlogPost["content"]
  featuredImageUrl: string; featuredImageAlt: string; categoryId: string; seoTitle: string; seoDescription: string
}

function toForm(post?: BlogPost): Form {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? EMPTY_BLOG_DOCUMENT,
    featuredImageUrl: post?.featuredImageUrl ?? "",
    featuredImageAlt: post?.featuredImageAlt ?? "",
    categoryId: post?.categoryId ?? "",
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-medium text-destructive" role="alert">{message}</p> : null
}

function CharCount({ value, max }: { value: string; max: number }) {
  return <span className={value.length > max ? "text-destructive" : "text-muted-foreground"}>{value.length}/{max}</span>
}

export function BlogPostEditor({ post: initialPost, categories: initialCategories }: { post?: BlogPost; categories: BlogCategory[] }) {
  const router = useRouter()
  const [post, setPost] = useState(initialPost)
  const [form, setForm] = useState<Form>(() => toForm(initialPost))
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost))
  const [categories, setCategories] = useState(initialCategories)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ tone: "error" | "success"; text: string } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const imageInput = useRef<HTMLInputElement>(null)

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value, ...(key === "title" && !slugTouched ? { slug: slugify(String(value)) } : {}) }))
    setErrors((current) => ({ ...current, [key]: "" }))
    setDirty(true)
  }

  function save(then?: (saved: BlogPost) => void) {
    setStatus(null)
    startTransition(async () => {
      const result = await saveBlogPostAction({ ...form, id: post?.id, categoryId: form.categoryId || null })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setStatus({ tone: "error", text: result.error })
        toast.error(result.error)
        return
      }
      setPost(result.post)
      setDirty(false)
      setErrors({})
      if (!post) {
        // First save of a new post: move to its edit URL so refreshes and previews work.
        router.replace(`/admin/blog/${result.post.id}`)
      }
      if (then) return then(result.post)
      setStatus({ tone: "success", text: "Saved." })
      toast.success("Post saved.")
    })
  }

  function changeStatus(next: "published" | "draft") {
    const run = (saved: BlogPost) => startTransition(async () => {
      const result = next === "published" ? await publishBlogPostAction(saved.id) : await unpublishBlogPostAction(saved.id)
      if (!result.ok) {
        setStatus({ tone: "error", text: result.error })
        return void toast.error(result.error)
      }
      setPost(result.post)
      const text = next === "published" ? "Published. The post is live on /blog." : "Unpublished. The post is now a draft."
      setStatus({ tone: "success", text })
      toast.success(text)
    })
    // Always publish the latest edits, never a stale copy.
    if (dirty || !post) save(run)
    else run(post)
  }

  function remove() {
    if (!post || !window.confirm(`Delete “${post.title}”? This can't be undone.`)) return
    startTransition(async () => {
      const result = await deleteBlogPostAction(post.id)
      if (!result.ok) return void toast.error(result.error)
      toast.success("Post deleted.")
      router.push("/admin/blog")
      router.refresh()
    })
  }

  async function uploadFeatured(file: File) {
    setUploading(true)
    const data = new FormData()
    data.set("file", file)
    const result = await uploadBlogImageAction(data)
    setUploading(false)
    if (!result.ok) return void toast.error(result.error)
    update("featuredImageUrl", result.url)
  }

  async function addCategory() {
    const name = window.prompt("New category name")
    if (!name?.trim()) return
    const result = await createBlogCategoryAction(name)
    if (!result.ok) return void toast.error(result.error)
    setCategories((current) => [...current, result.category].sort((a, b) => a.name.localeCompare(b.name)))
    update("categoryId", result.category.id)
  }

  const published = post?.status === "published"

  return (
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" onSubmit={(event) => { event.preventDefault(); save() }} noValidate>
      <div className="min-w-0 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="blog-title">Title</Label>
          <Input id="blog-title" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Where to meet your driver at Heathrow Terminal 5" aria-invalid={Boolean(errors.title)} className="h-11 text-base" />
          <FieldError message={errors.title} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blog-slug">URL slug</Label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted-foreground">/blog/</span>
            <Input id="blog-slug" value={form.slug} onChange={(event) => { setSlugTouched(true); update("slug", slugify(event.target.value)) }} aria-invalid={Boolean(errors.slug)} />
          </div>
          <p className="text-xs text-muted-foreground">Created from the title. Changing it on a published post breaks existing links to it.</p>
          <FieldError message={errors.slug} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm"><Label htmlFor="blog-excerpt">Excerpt</Label><CharCount value={form.excerpt} max={320} /></div>
          <Textarea id="blog-excerpt" value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} rows={3} placeholder="One or two sentences shown on the blog listing and under the title." aria-invalid={Boolean(errors.excerpt)} />
          <FieldError message={errors.excerpt} />
        </div>

        <div className="space-y-1.5">
          <Label>Content</Label>
          <BlogRichTextEditor value={form.content} onChange={(content) => update("content", content)} />
          <FieldError message={errors.content} />
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Publishing</CardTitle>
            <Badge variant={published ? "default" : "secondary"}>{published ? "Published" : "Draft"}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {post?.publishedAt && <p className="text-xs text-muted-foreground">First published {new Date(post.publishedAt).toLocaleString("en-GB")}</p>}
            {status && <p className={status.tone === "error" ? "text-sm font-medium text-destructive" : "text-sm font-medium text-emerald-700"} role="status">{status.text}</p>}
            {dirty && !status && <p className="text-xs text-muted-foreground">You have unsaved changes.</p>}
            <Button type="submit" variant="outline" className="w-full" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : null}Save draft</Button>
            {published
              ? <Button type="button" variant="secondary" className="w-full" disabled={pending} onClick={() => changeStatus("draft")}>Unpublish</Button>
              : <Button type="button" className="w-full" disabled={pending} onClick={() => changeStatus("published")}>Publish</Button>}
            {post && <Button type="button" variant="ghost" className="w-full" nativeButton={false} render={<Link href={`/admin/blog/${post.id}/preview`} target="_blank" />}><ExternalLink className="size-4" />Preview{dirty ? " (save first)" : ""}</Button>}
            {published && post && <Link href={`/blog/${post.slug}`} target="_blank" className="block text-center text-xs font-medium text-primary underline">View live post</Link>}
            {post && <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive" disabled={pending} onClick={remove}><Trash2 className="size-4" />Delete post</Button>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Featured image</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {form.featuredImageUrl
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded image
              ? <img src={form.featuredImageUrl} alt="" className="aspect-[16/9] w-full rounded-md object-cover" />
              : <div className="grid aspect-[16/9] place-items-center rounded-md border border-dashed text-xs text-muted-foreground">No image yet</div>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => imageInput.current?.click()}>{uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{form.featuredImageUrl ? "Replace" : "Upload"}</Button>
              {form.featuredImageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => update("featuredImageUrl", "")}>Remove</Button>}
            </div>
            <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadFeatured(file) }} />
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP or AVIF, up to 5 MB. 1600×900 works best.</p>
            <FieldError message={errors.featuredImageUrl} />
            <div className="space-y-1.5">
              <Label htmlFor="blog-image-alt">Image description (alt text)</Label>
              <Input id="blog-image-alt" value={form.featuredImageAlt} onChange={(event) => update("featuredImageAlt", event.target.value)} placeholder="e.g. Driver waiting in Terminal 5 arrivals" />
              <FieldError message={errors.featuredImageAlt} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Category</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <select aria-label="Category" value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">No category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <Button type="button" variant="ghost" size="sm" onClick={addCategory}>+ New category</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Search engines</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm"><Label htmlFor="blog-seo-title">SEO title</Label><CharCount value={form.seoTitle} max={70} /></div>
              <Input id="blog-seo-title" value={form.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} placeholder={form.title || "Uses the post title"} />
              <FieldError message={errors.seoTitle} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm"><Label htmlFor="blog-seo-description">Meta description</Label><CharCount value={form.seoDescription} max={170} /></div>
              <Textarea id="blog-seo-description" rows={3} value={form.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} placeholder={form.excerpt || "Uses the excerpt"} />
              <FieldError message={errors.seoDescription} />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
