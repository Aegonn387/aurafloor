import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { getCached } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user || user.role !== "creator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const analytics = await getCached(
      `analytics:creator:${user.id}`,
      async () => {
        // Total earnings
        const [earnings] = await query<{ total: number }>(
          `SELECT COALESCE(SUM(amount - platform_fee), 0) as total
           FROM transactions
           WHERE to_user_id = $1 AND status = 'completed'`,
          [user.id],
        )

        // Total streams
        const [streams] = await query<{ total: number }>(
          `SELECT COUNT(*) as total
           FROM stream_logs s
           JOIN nfts n ON s.nft_id = n.id
           WHERE n.creator_id = $1`,
          [user.id],
        )

        // Total NFTs
        const [nfts] = await query<{ total: number }>(
          `SELECT COUNT(*) as total FROM nfts WHERE creator_id = $1 AND status = 'active'`,
          [user.id],
        )

        // Total followers (likes on their NFTs)
        const [followers] = await query<{ total: number }>(
          `SELECT COUNT(DISTINCT l.user_id) as total
           FROM likes l
           JOIN nfts n ON l.likeable_id = n.id
           WHERE l.likeable_type = 'nft' AND n.creator_id = $1`,
          [user.id],
        )

        // Recent sales (last 30 days)
        const [recentSales] = await query<{ total: number; amount: number }>(
          `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as amount
           FROM transactions
           WHERE to_user_id = $1 
             AND type IN ('purchase', 'resale')
             AND status = 'completed'
             AND created_at > NOW() - INTERVAL '30 days'`,
          [user.id],
        )

        // Top NFTs
        const topNfts = await query(
          `SELECT id, title, cover_image_url, play_count, like_count, sold_count, price
           FROM nfts
           WHERE creator_id = $1 AND status = 'active'
           ORDER BY play_count DESC
           LIMIT 5`,
          [user.id],
        )

        // Revenue by type (last 30 days)
        const revenueByType = await query(
          `SELECT type, COALESCE(SUM(amount - COALESCE(platform_fee, 0)), 0) as amount
           FROM transactions
           WHERE to_user_id = $1 
             AND status = 'completed'
             AND created_at > NOW() - INTERVAL '30 days'
           GROUP BY type`,
          [user.id],
        )

        return {
          totalEarnings: earnings.total,
          totalStreams: streams.total,
          totalNFTs: nfts.total,
          totalFollowers: followers.total,
          recentSales: {
            count: recentSales.total,
            amount: recentSales.amount,
          },
          topNfts,
          revenueByType,
        }
      },
      300, // 5 minutes cache
    )

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("[v0] Failed to fetch creator analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
