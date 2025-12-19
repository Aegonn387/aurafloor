import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const transactions = await query(
      `SELECT t.id, t.type, t.amount, t.status, t.created_at, t.completed_at,
              u_from.display_name as from_name,
              u_to.display_name as to_name,
              n.title as nft_title
       FROM transactions t
       LEFT JOIN users u_from ON t.from_user_id = u_from.id
       LEFT JOIN users u_to ON t.to_user_id = u_to.id
       LEFT JOIN nfts n ON t.nft_id = n.id
       WHERE t.from_user_id = $1 OR t.to_user_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset],
    )

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("[v0] Failed to fetch transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
