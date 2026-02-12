import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const users = await sql`SELECT id FROM u LIMIT 1`
    return users[0]?.id || null
  } catch {
    return "1"
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const userId = await getUserId(request)
    const postIdNum = parseInt(postId)
    
    if (isNaN(postIdNum)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const [postData, userLike] = await Promise.all([
      sql`SELECT like_count FROM community_posts WHERE id = ${postIdNum}`,
      userId ? sql`SELECT 1 FROM post_likes WHERE post_id = ${postIdNum} AND user_id = ${userId}` : []
    ])

    return NextResponse.json({
      success: true,
      postId: postIdNum,
      likeCount: postData[0]?.like_count || 0,
      likedByUser: userLike.length > 0
    })
  } catch (error) {
    console.error("[Likes API] GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const userId = await getUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postIdNum = parseInt(postId)
    if (isNaN(postIdNum)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const existingLike = await sql`
      SELECT id FROM post_likes 
      WHERE post_id = ${postIdNum} AND user_id = ${userId}
    `

    if (existingLike.length > 0) {
      await Promise.all([
        sql`DELETE FROM post_likes WHERE id = ${existingLike[0].id}`,
        sql`UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ${postIdNum}`
      ])
    } else {
      await Promise.all([
        sql`INSERT INTO post_likes (post_id, user_id, created_at) VALUES (${postIdNum}, ${userId}, NOW())`,
        sql`UPDATE community_posts SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ${postIdNum}`
      ])
    }

    const newCount = await sql`SELECT like_count FROM community_posts WHERE id = ${postIdNum}`
    
    return NextResponse.json({
      success: true,
      liked: existingLike.length === 0,
      likeCount: newCount[0]?.like_count || 0,
      message: existingLike.length > 0 ? "Post unliked" : "Post liked"
    }, { status: existingLike.length === 0 ? 201 : 200 })
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already liked" }, { status: 400 })
    }
    
    console.error("[Likes API] POST Error:", error)
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  return NextResponse.json(
    { error: "Use POST to toggle like status" }, 
    { status: 405 }
  )
}

