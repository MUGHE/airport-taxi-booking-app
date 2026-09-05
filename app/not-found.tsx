import Link from "next/link"
import type { Metadata } from "next"
import { CarFront, Headset, Home, LifeBuoy, MapPinOff, Search } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page Not Found",
  // A 404 has nothing worth indexing, but "follow" still lets crawlers use its
  // links to discover the real pages below.
  robots: { index: false, follow: true },
}

const HELPFUL_LINKS = [
  { href: "/book", label: "Book an airport transfer", icon: CarFront },
  { href: "/track", label: "Track an existing booking", icon: Search },
  { href: "/help", label: "Visit the Help Center", icon: LifeBuoy },
  { href: "/contact", label: "Contact our team", icon: Headset },
]

// Rendering this file for an unmatched route (or a `notFound()` call) makes Next.js
// respond with a genuine HTTP 404 — this isn't a normal page reached via routing.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <MapPinOff className="size-7" />
          </span>
          <p className="mt-6 text-sm font-semibold tracking-wide text-primary uppercase">
            404 error
          </p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            The page you&apos;re looking for may have been moved, renamed, or no
            longer exists. Double-check the address, or use one of the links below
            to get back on track.
          </p>

          <div className="mt-8 flex justify-center">
            <Button nativeButton={false} render={<Link href="/" />}>
              <Home className="size-4" />
              Back to homepage
            </Button>
          </div>

          <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
            {HELPFUL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-medium transition-colors hover:border-primary/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <link.icon className="size-4" />
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
