import { type NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { getCached } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const wallet = await getCached(
      `wallet:${user.id}`,
      async () => {
        return await queryOne(
          `SELECT available_balance, pending_balance, lifetime_earnings, lifetime_spent
           FROM user_wallets WHERE user_id = $1`,
          [user.id],
        )
      },
      60, // 1 minute cache
    )

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    return NextResponse.json(wallet)
  } catch (error) {
    console.error("[v0] Failed to fetch wallet balance:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
