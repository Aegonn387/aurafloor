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
      DELETE FROM notifications
      WHERE user_id = ${userId}
      RETURNING id
    `

    return NextResponse.json({ 
      success: true, 
      count: result.length,
      message: `${result.length} notifications cleared`
    })
  } catch (error) {
    console.error('Error clearing notifications:', error)
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
  }
}
