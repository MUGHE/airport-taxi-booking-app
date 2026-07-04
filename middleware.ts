import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let the login page itself through, otherwise we'd redirect-loop.
  if (pathname === "/admin/login") {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const authenticated = await verifySessionToken(token)

  if (!authenticated) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
