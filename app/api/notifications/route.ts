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
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let whereClause = "WHERE user_id = $1"
    if (unreadOnly) {
      whereClause += " AND read = false"
    }

    const notifications = await query(
      `SELECT id, type, title, message, read, metadata, created_at
       FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.id, limit],
    )

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("[v0] Failed to fetch notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId, markAllRead } = await request.json()

    if (markAllRead) {
      await query(`UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`, [user.id])
    } else if (notificationId) {
      await query(`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, [notificationId, user.id])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
