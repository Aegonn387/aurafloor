import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { postId, userId, username, content } = await request.json()

    const comment = {
      id: crypto.randomUUID(),
      author: username,
      authorId: userId,
      content,
      timestamp: "Just now",
      likes: 0,
      liked: false,
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Comment created:", comment)

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error("[v0] Comment creation failed:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
