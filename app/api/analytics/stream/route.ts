export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackId, userId, quality, timestamp, owned, duration } = body

    console.log('[Analytics] Stream event:', {
      trackId,
      userId,
      quality,
      timestamp,
      owned,
      duration
    })

    // TODO: Store analytics in your database
    // For now, we'll just log it

    return NextResponse.json({
      success: true,
      message: 'Analytics recorded'
    })
  } catch (error) {
    console.error('[Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record analytics' },
      { status: 500 }
    )
  }
}
