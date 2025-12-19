import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    // In production, check if user is admin
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days

    // Platform revenue
    const [platformRevenue] = await query<{ total: number }>(
      `SELECT COALESCE(SUM(platform_fee), 0) as total
       FROM transactions
       WHERE status = 'completed'
         AND created_at > NOW() - INTERVAL '${period} days'`,
    )

    // Total transactions
    const [transactions] = await query<{ total: number }>(
      `SELECT COUNT(*) as total
       FROM transactions
       WHERE status = 'completed'
         AND created_at > NOW() - INTERVAL '${period} days'`,
    )

    // Revenue by type
    const revenueByType = await query(
      `SELECT type, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount, COALESCE(SUM(platform_fee), 0) as platform_fee
       FROM transactions
       WHERE status = 'completed'
         AND created_at > NOW() - INTERVAL '${period} days'
       GROUP BY type`,
    )

    // Top creators by earnings
    const topCreators = await query(
      `SELECT u.id, u.display_name, u.pi_username, COALESCE(SUM(t.amount - t.platform_fee), 0) as earnings
       FROM transactions t
       JOIN users u ON t.to_user_id = u.id
       WHERE t.status = 'completed'
         AND t.created_at > NOW() - INTERVAL '${period} days'
       GROUP BY u.id, u.display_name, u.pi_username
       ORDER BY earnings DESC
       LIMIT 10`,
    )

    // Daily revenue trend
    const dailyRevenue = await query(
      `SELECT DATE(created_at) as date, 
              COALESCE(SUM(platform_fee), 0) as revenue,
              COUNT(*) as transaction_count
       FROM transactions
       WHERE status = 'completed'
         AND created_at > NOW() - INTERVAL '${period} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
    )

    return NextResponse.json({
      totalPlatformRevenue: platformRevenue.total,
      totalTransactions: transactions.total,
      revenueByType,
      topCreators,
      dailyRevenue,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch revenue data:", error)
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 })
  }
}
