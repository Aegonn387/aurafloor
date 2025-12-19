import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { rateLimit } from "./lib/redis"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const userId = request.headers.get("x-user-id") || request.ip || "anonymous"

    // Different limits for different endpoints
    let limit = 100 // requests per minute
    let window = 60 // seconds

    if (pathname.startsWith("/api/upload")) {
      limit = 10 // 10 uploads per hour
      window = 3600
    } else if (pathname.startsWith("/api/stream")) {
      limit = 1000 // 1000 streams per day
      window = 86400
    }

    const allowed = await rateLimit(userId, pathname, limit, window)

    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
