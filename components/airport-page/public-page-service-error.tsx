import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PublicPageServiceError({ retryHref }: { retryHref: string }) {
  return <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
    <h1 className="text-3xl font-semibold">This airport page is temporarily unavailable</h1>
    <p className="mt-4 text-muted-foreground">We could not safely load its published content. Please try again shortly.</p>
    <Button className="mt-6" nativeButton={false} render={<Link href={retryHref} />}>Retry</Button>
  </main>
}

