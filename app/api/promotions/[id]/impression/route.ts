import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  return 'current_user_id'
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const userId = await getUserFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Record the impression
    const result = await sql`
      UPDATE promotions
      SET impressions = impressions + 1
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    // Record user-specific impression data
    await sql`
      INSERT INTO promotion_engagements (promotion_id, user_id, action)
      VALUES (${id}, ${userId}, 'impression')
    `

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('[Promotions] Error recording impression:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
