import { type NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id")

    if (sessionId) {
      await redis.del(`session:${sessionId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Logout failed:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
