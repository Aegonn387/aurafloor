import { type NextRequest, NextResponse } from "next/server"
import { queryOne, query } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await queryOne(
      `SELECT u.id, u.pi_username, u.display_name, u.bio, u.avatar_url, u.role,
              u.subscription_tier, u.created_at,
              w.available_balance, w.lifetime_earnings
       FROM users u
       LEFT JOIN user_wallets w ON u.id = w.user_id
       WHERE u.id = $1`,
      [params.id],
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[v0] Failed to fetch user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getUserFromRequest(request)

    if (!currentUser || currentUser.id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    const allowedFields = ["display_name", "bio", "avatar_url", "messaging_enabled"]

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

    await query(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1`, [params.id, ...values])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
