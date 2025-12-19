import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, username, role, content, linkedNFTId } = await request.json()

    const post = {
      id: crypto.randomUUID(),
      author: username,
      authorId: userId,
      role,
      content,
      timestamp: "Just now",
      likes: 0,
      comments: [],
      linkedNFT: linkedNFTId ? { id: linkedNFTId } : undefined,
      liked: false,
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Post created:", post)

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("[v0] Post creation failed:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
