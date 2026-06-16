export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  return 'current_user_id'
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sql`
      UPDATE notifications
      SET unread = false
      WHERE user_id = ${userId} AND unread = true
      RETURNING id
    `

    return NextResponse.json({ 
      success: true, 
      count: result.length,
      message: `${result.length} notifications marked as read`
    })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 })
  }
}
