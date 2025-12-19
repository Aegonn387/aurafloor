import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { invalidateCache } from "@/lib/redis"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already liked
    const existing = await queryOne(
      `SELECT id FROM likes 
       WHERE user_id = $1 AND likeable_type = 'nft' AND likeable_id = $2`,
      [user.id, params.id],
    )

    if (existing) {
      // Unlike
      await query(
        `DELETE FROM likes 
         WHERE user_id = $1 AND likeable_type = 'nft' AND likeable_id = $2`,
        [user.id, params.id],
      )

      await query(`UPDATE nfts SET like_count = like_count - 1 WHERE id = $1`, [params.id])

      await invalidateCache(`nft:${params.id}`)

      return NextResponse.json({ liked: false })
    } else {
      // Like
      await query(
        `INSERT INTO likes (user_id, likeable_type, likeable_id)
         VALUES ($1, 'nft', $2)`,
        [user.id, params.id],
      )

      await query(`UPDATE nfts SET like_count = like_count + 1 WHERE id = $1`, [params.id])

      await invalidateCache(`nft:${params.id}`)

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("[v0] Failed to toggle like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
