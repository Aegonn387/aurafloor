import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCached } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "all"
    const sort = searchParams.get("sort") || "recent"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const cacheKey = `nfts:${category}:${sort}:${limit}:${offset}`

    const nfts = await getCached(
      cacheKey,
      async () => {
        let whereClause = "WHERE n.status = 'active'"
        let orderClause = "ORDER BY n.created_at DESC"

        if (category !== "all") {
          whereClause += ` AND n.genre = '${category}'`
        }

        if (sort === "trending") {
          orderClause = "ORDER BY n.play_count DESC, n.created_at DESC"
        } else if (sort === "popular") {
          orderClause = "ORDER BY n.like_count DESC, n.created_at DESC"
        }

        return await query(
          `SELECT n.id, n.title, n.description, n.genre, n.price, n.cover_image_url,
                  n.edition_type, n.total_editions, n.sold_count, n.play_count, n.like_count,
                  n.created_at,
                  u.display_name as creator_name, u.avatar_url as creator_avatar
           FROM nfts n
           JOIN users u ON n.creator_id = u.id
           ${whereClause}
           ${orderClause}
           LIMIT $1 OFFSET $2`,
          [limit, offset],
        )
      },
      300, // 5 minutes cache
    )

    return NextResponse.json(nfts)
  } catch (error) {
    console.error("[v0] Failed to fetch NFTs:", error)
    return NextResponse.json({ error: "Failed to fetch NFTs" }, { status: 500 })
  }
}
