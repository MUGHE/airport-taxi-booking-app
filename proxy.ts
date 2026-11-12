import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, renewSessionToken } from "@/lib/auth"

// Route page URLs, e.g. /heathrow-to-birmingham-taxi (see lib/route-pages.ts). Keep in step with next.config.mjs.
const ROUTE_PAGE_PATH = /^\/([a-z0-9-]+-to-[a-z0-9-]+-taxi)$/

/** The published route whose reverse URL this is, e.g. heathrow-to-birmingham-taxi for /birmingham-to-heathrow-taxi. */
async function canonicalRouteSlug(slug: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    const query = new URLSearchParams({ select: "slug", reverse_slug: `eq.${slug}`, status: "eq.published", limit: "1" })
    const response = await fetch(`${url}/rest/v1/route_pages?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(2000) })
    if (!response.ok) return null
    const rows = (await response.json()) as { slug: string }[]
    return rows[0]?.slug ?? null
  } catch {
    // The page itself still redirects (with a client-side refresh) if this lookup fails.
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // A route page's reverse URL gets a real 308 here. The page can't send one itself, because the
  // site-wide loading screen has already started the response by the time it knows.
  const routeMatch = ROUTE_PAGE_PATH.exec(pathname)
  if (routeMatch) {
    const canonical = await canonicalRouteSlug(routeMatch[1])
    return canonical ? NextResponse.redirect(new URL(`/${canonical}`, request.url), 308) : NextResponse.next()
  }

  // Let the login page itself through, otherwise we'd redirect-loop.
  if (pathname === "/admin/login") {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const renewed = await renewSessionToken(token)

  if (!renewed) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    // Only surface the "you were signed out" message when there was actually a
    // session to expire — not for a first-time visitor with no cookie at all.
    if (token) {
      loginUrl.searchParams.set("reason", "idle")
    }
    return NextResponse.redirect(loginUrl)
  }

  // Sliding expiry: every authenticated request pushes the idle timeout
  // forward, so an admin who's actively using the dashboard is never signed
  // out mid-task — only a tab left idle for 30 minutes expires.
  const response = NextResponse.next()
  if (pathname.startsWith("/admin/destination-pages/") && pathname.endsWith("/preview")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
  }
  response.cookies.set(ADMIN_SESSION_COOKIE, renewed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return response
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/:slug([a-z0-9-]+-to-[a-z0-9-]+-taxi)"],
}
