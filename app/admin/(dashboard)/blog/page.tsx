import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listAllPosts } from "@/lib/blog"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "Blog" }
export const dynamic = "force-dynamic"

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"
}

export default async function AdminBlogPage() {
  await requireAdminSection("content", "/admin/blog")
  const posts = await listAllPosts()

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Blog</h2>
          <p className="mt-1 text-sm text-muted-foreground">Write, preview and publish articles for /blog.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/blog/new" />}><Plus className="size-4" />New post</Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first article and save it as a draft.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Category</TableHead><TableHead>Published</TableHead><TableHead>Updated</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-md"><Link href={`/admin/blog/${post.id}`} className="font-medium hover:underline">{post.title}</Link><p className="truncate text-xs text-muted-foreground">/blog/{post.slug}</p></TableCell>
                  <TableCell><Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status === "published" ? "Published" : "Draft"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{post.category?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{post.status === "published" ? date(post.publishedAt) : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{date(post.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
