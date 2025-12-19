import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.messaging_enabled) {
      return NextResponse.json({ error: "Messaging is disabled" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get("withUserId")

    if (withUserId) {
      // Get conversation with specific user
      const messages = await query(
        `SELECT m.*, 
                u_from.display_name as from_name,
                u_from.avatar_url as from_avatar
         FROM messages m
         JOIN users u_from ON m.from_user_id = u_from.id
         WHERE (m.from_user_id = $1 AND m.to_user_id = $2)
            OR (m.from_user_id = $2 AND m.to_user_id = $1)
         ORDER BY m.created_at ASC`,
        [user.id, withUserId],
      )

      return NextResponse.json(messages)
    } else {
      // Get all conversations
      const conversations = await query(
        `SELECT DISTINCT ON (other_user_id)
                other_user_id,
                other_user_name,
                other_user_avatar,
                last_message,
                last_message_time,
                unread_count
         FROM (
           SELECT 
             CASE 
               WHEN m.from_user_id = $1 THEN m.to_user_id 
               ELSE m.from_user_id 
             END as other_user_id,
             CASE 
               WHEN m.from_user_id = $1 THEN u_to.display_name 
               ELSE u_from.display_name 
             END as other_user_name,
             CASE 
               WHEN m.from_user_id = $1 THEN u_to.avatar_url 
               ELSE u_from.avatar_url 
             END as other_user_avatar,
             m.content as last_message,
             m.created_at as last_message_time,
             (SELECT COUNT(*) FROM messages WHERE to_user_id = $1 AND from_user_id = 
               CASE WHEN m.from_user_id = $1 THEN m.to_user_id ELSE m.from_user_id END 
               AND read = false) as unread_count
           FROM messages m
           LEFT JOIN users u_from ON m.from_user_id = u_from.id
           LEFT JOIN users u_to ON m.to_user_id = u_to.id
           WHERE m.from_user_id = $1 OR m.to_user_id = $1
           ORDER BY m.created_at DESC
         ) conversations
         ORDER BY other_user_id, last_message_time DESC`,
        [user.id],
      )

      return NextResponse.json(conversations)
    }
  } catch (error) {
    console.error("[v0] Failed to fetch messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { toUserId, content } = await request.json()

    if (!toUserId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if recipient has messaging enabled
    const [recipient] = await query<{ messaging_enabled: boolean }>(
      `SELECT messaging_enabled FROM users WHERE id = $1`,
      [toUserId],
    )

    if (!recipient || !recipient.messaging_enabled) {
      return NextResponse.json({ error: "Recipient has messaging disabled" }, { status: 403 })
    }

    const [message] = await query(
      `INSERT INTO messages (from_user_id, to_user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [user.id, toUserId, content],
    )

    // Create notification for recipient
    await query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, 'message', 'New Message', $2, $3)`,
      [
        toUserId,
        `${user.display_name || user.pi_username} sent you a message`,
        JSON.stringify({ messageId: message.id }),
      ],
    )

    return NextResponse.json({ success: true, messageId: message.id })
  } catch (error) {
    console.error("[v0] Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
