import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, renewSessionToken } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: ["/admin", "/admin/:path*"],
}
