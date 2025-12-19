import { type NextRequest, NextResponse } from "next/server"
import { createOrUpdateUser } from "@/lib/auth"
import { redis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { piUsername, piAddress, role } = await request.json()

    if (!piUsername || !piAddress || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create or update user
    const user = await createOrUpdateUser({
      username: piUsername,
      address: piAddress,
      role: role as "creator" | "collector",
    })

    // Create session
    const sessionId = crypto.randomUUID()
    await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(user)) // 24h

    return NextResponse.json({
      success: true,
      user,
      sessionId,
    })
  } catch (error) {
    console.error("[v0] Login failed:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
