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

    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN unread = true THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN type = 'purchase' THEN 1 ELSE 0 END) as purchase,
        SUM(CASE WHEN type = 'tip' THEN 1 ELSE 0 END) as tip,
        SUM(CASE WHEN type = 'follow' THEN 1 ELSE 0 END) as follow,
        SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) as like,
        SUM(CASE WHEN type = 'comment' THEN 1 ELSE 0 END) as comment,
        SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system
      FROM notifications
      WHERE user_id = ${userId}
    `

    return NextResponse.json({
      total: Number(stats[0].total),
      unread: Number(stats[0].unread),
      byType: {
        purchase: Number(stats[0].purchase),
        tip: Number(stats[0].tip),
        follow: Number(stats[0].follow),
        like: Number(stats[0].like),
        comment: Number(stats[0].comment),
        system: Number(stats[0].system)
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
