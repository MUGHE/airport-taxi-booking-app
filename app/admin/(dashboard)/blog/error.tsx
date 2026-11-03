"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

/** Keeps the admin dashboard on screen if a blog page fails. The reference matches the server log entry. */
export default function AdminBlogError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 p-6" role="alert">
      <p className="font-medium">This blog page could not load.</p>
      <p className="mt-1 text-sm text-muted-foreground">Try again. Anything already saved is safe.{error.digest ? ` Error reference: ${error.digest}` : ""}</p>
      <div className="mt-4 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/blog" />}>All posts</Button>
      </div>
    </div>
  )
}
