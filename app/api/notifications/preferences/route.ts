export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  return 'current_user_id'
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prefs = await sql`
      SELECT * FROM notification_preferences
      WHERE user_id = ${userId}::uuid
    `

    return NextResponse.json(prefs[0] || {
      email_notifications: true,
      push_notifications: true,
      message_notifications: true,
      purchase_notifications: true,
      tip_notifications: true,
      follow_notifications: true,
      like_notifications: true,
      comment_notifications: true
    })

  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const result = await sql`
      INSERT INTO notification_preferences (user_id, ${Object.keys(body).join(', ')})
      VALUES (${userId}::uuid, ${Object.values(body)})
      ON CONFLICT (user_id) DO UPDATE SET
      ${Object.keys(body).map(key => `${key} = EXCLUDED.${key}`).join(', ')}
      RETURNING *
    `

    return NextResponse.json(result[0])

  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
