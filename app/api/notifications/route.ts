export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  // TODO: IMPLEMENT PI NETWORK AUTH
  // Get from header: request.headers.get('x-pi-username')
  // Then query: SELECT id FROM u WHERE piuser = 'username'
  return 'current_user_id' // REPLACE WITH ACTUAL AUTH LOGIC
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return new Date(date).toLocaleDateString()
}

// GET /api/notifications - Fetch notifications for the panel
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // UPDATED QUERY: Uses your actual 'notif' and 'u' table columns
    const notifications = await sql`
      SELECT 
        n.id,
        n.type,
        n.title as message,
        n.unread,
        n.amt as amount,
        n.currency,
        n.meta as metadata,
        n.ca as created_at,
        n.sender_id,
        u.piuser as sender_username,
        u.avatar as sender_avatar
      FROM notif n
      LEFT JOIN u ON n.sender_id = u.id::text
      WHERE n.uid = ${userId}
      ORDER BY n.ca DESC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `

    const formatted = notifications.map(n => ({
      id: n.id,
      type: n.type,
      user: n.sender_username || 'System',
      userAvatar: n.sender_avatar,
      message: n.message,
      time: formatTime(n.created_at),
      unread: n.unread,
      amount: n.amount,
      currency: n.currency,
      metadata: n.metadata,
      createdAt: n.created_at
    }))

    return NextResponse.json(formatted)

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, type, title, message, amount, currency, metadata } = body

    const result = await sql`
      INSERT INTO notif (
        uid, sender_id, type, title, msg, amt, currency, meta, unread
      ) VALUES (
        ${recipientId},
        ${userId},
        ${type},
        ${title},
        ${message},
        ${amount || null},
        ${currency || 'p'},
        ${metadata ? JSON.stringify(metadata) : null},
        true
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
