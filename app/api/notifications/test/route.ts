export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Simple test query
    const notifications = await sql`
      SELECT 
        n.id,
        n.type,
        n.title,
        n.msg as message,
        n.read,
        n.ca as created_at
      FROM notif n
      WHERE n.uid = ${userId}
      ORDER BY n.ca DESC
      LIMIT 5
    `

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications
    })

  } catch (error) {
    console.error('[Notifications Test] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
