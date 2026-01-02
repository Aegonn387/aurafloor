import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { rateLimit } from "./lib/redis"

// Helper to get IP from request headers
function getIp(request: NextRequest) {
  // Try common proxy headers for IP address
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    return xff.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  // Fallback to 'unknown' if no IP header found
  return 'unknown'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const userId = request.headers.get("x-user-id") || getIp(request) || "anonymous"

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

    const { success, remaining, reset } = await rateLimit(userId, limit, window)

    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      })
    }

    // Continue with the request
    return NextResponse.next()
  }
}
