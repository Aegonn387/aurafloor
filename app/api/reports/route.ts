import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentType, contentId, reason, details } = await request.json()

    if (!contentType || !contentId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await query(
      `INSERT INTO reports (reporter_user_id, reported_content_type, reported_content_id, reason, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, contentType, contentId, reason, details || null],
    )

    // Create notification for admin/moderation team
    await query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       SELECT id, 'report', 'New Report', $1, $2
       FROM users WHERE role = 'admin'`,
      [`New ${contentType} report: ${reason}`, JSON.stringify({ contentType, contentId, reason })],
    )

    return NextResponse.json({ success: true, message: "Report submitted successfully" })
  } catch (error) {
    console.error("[v0] Failed to submit report:", error)
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint would be for admin/moderators only
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    const reports = await query(
      `SELECT r.*, 
              u.display_name as reporter_name,
              u.pi_username as reporter_username
       FROM reports r
       LEFT JOIN users u ON r.reporter_user_id = u.id
       WHERE r.status = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [status],
    )

    return NextResponse.json(reports)
  } catch (error) {
    console.error("[v0] Failed to fetch reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
