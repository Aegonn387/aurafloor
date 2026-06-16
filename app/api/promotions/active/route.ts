export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { promotionService } from '@/lib/services/promotion-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const options = {
      limit: parseInt(searchParams.get('limit') || '10'),
      aud: searchParams.get('audience') || undefined,
      excludeUid: searchParams.get('excludeUid') || undefined,
      location: searchParams.get('location') || 'homepage'
    }

    const campaigns = await promotionService.getActiveCampaigns(options)

    return NextResponse.json({
      success: true,
      campaigns,
      count: campaigns.length
    })
  } catch (error) {
    console.error('Error fetching active campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active campaigns' },
      { status: 500 }
    )
  }
}
