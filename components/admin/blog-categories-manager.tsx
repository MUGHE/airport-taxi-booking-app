"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createBlogCategoryAction, deleteBlogCategoryAction } from "@/lib/blog-actions"
import type { BlogCategory } from "@/lib/blog-schema"

const FAILED = "The server could not finish that. Please try again."

/** Add and delete blog categories. The public /blog page shows a filter button for each one. */
export function BlogCategoriesManager({ categories, postCounts }: { categories: BlogCategory[]; postCounts: Record<string, number> }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [busy, setBusy] = useState<string | null>(null)

  async function add(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setBusy("add")
    const result = await createBlogCategoryAction(name).catch(() => null)
    setBusy(null)
    if (!result) return void toast.error(FAILED)
    if (!result.ok) return void toast.error(result.error)
    toast.success(`Category "${result.category.name}" added.`)
    setName("")
    router.refresh()
  }

  async function remove(category: BlogCategory) {
    const count = postCounts[category.id] ?? 0
    const posts = count === 1 ? "1 post is" : `${count} posts are`
    const warning = count > 0 ? `\n\n${posts} in this category. They stay on the blog, with no category.` : ""
    if (!window.confirm(`Delete the category "${category.name}"?${warning}`)) return
    setBusy(category.id)
    const result = await deleteBlogCategoryAction(category.id).catch(() => null)
    setBusy(null)
    if (!result) return void toast.error(FAILED)
    if (!result.ok) return void toast.error(result.error)
    toast.success(`Category "${category.name}" deleted.`)
    router.refresh()
  }

  return (
    <section id="categories" className="mb-8 scroll-mt-24 rounded-xl border p-4 sm:p-5">
      <h3 className="font-semibold">Categories</h3>
      <p className="mt-1 text-sm text-muted-foreground">Each category is a filter button on the /blog page. With no categories, the buttons are hidden.</p>

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <ul className="mt-4 divide-y rounded-lg border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">/blog?category={category.slug} · {postCounts[category.id] ?? 0} {postCounts[category.id] === 1 ? "post" : "posts"}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busy !== null} onClick={() => remove(category)} aria-label={`Delete category ${category.name}`}>
                {busy === category.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form className="mt-4 flex flex-wrap gap-2" onSubmit={add}>
        <Input aria-label="New category name" className="max-w-xs" value={name} maxLength={60} placeholder="New category name" onChange={(event) => setName(event.target.value)} />
        <Button type="submit" variant="outline" disabled={busy !== null || !name.trim()}>
          {busy === "add" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Add category
        </Button>
      </form>
    </section>
  )
}
