import { type NextRequest, NextResponse } from "next/server"
import { queryOne, query } from "@/lib/db"
import { getCached, invalidateCache } from "@/lib/redis"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const nft = await getCached(
      `nft:${params.id}`,
      async () => {
        return await queryOne(
          `SELECT n.*, 
                  u.id as creator_id, u.display_name as creator_name, 
                  u.avatar_url as creator_avatar, u.pi_username as creator_pi_username
           FROM nfts n
           JOIN users u ON n.creator_id = u.id
           WHERE n.id = $1`,
          [params.id],
        )
      },
      600, // 10 minutes cache
    )

    if (!nft) {
      return NextResponse.json({ error: "NFT not found" }, { status: 404 })
    }

    return NextResponse.json(nft)
  } catch (error) {
    console.error("[v0] Failed to fetch NFT:", error)
    return NextResponse.json({ error: "Failed to fetch NFT" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()

    // Only allow certain fields to be updated
    const allowedFields = ["title", "description", "price"]
    const setClause = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key, i) => `${key} = $${i + 2}`)
      .join(", ")

    if (!setClause) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const values = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .map((key) => updates[key])

    await query(`UPDATE nfts SET ${setClause}, updated_at = NOW() WHERE id = $1`, [params.id, ...values])

    // Invalidate cache
    await invalidateCache(`nft:${params.id}`)
    await invalidateCache(`nfts:*`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update NFT:", error)
    return NextResponse.json({ error: "Failed to update NFT" }, { status: 500 })
  }
}
