export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { promotionService } from '@/lib/services/promotion-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.uid || !body.nid || !body.budget) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, nid, budget' },
        { status: 400 }
      )
    }

    const promotionData = {
      nftId: body.nid,
      type: body.type || 'promotion',
      title: body.title,
      description: body.description,
      budget: body.budget,
      cpc: body.cpc || 0.1,
      startDate: body.startDate || new Date(),
      endDate: body.endDate,
      creatorId: body.uid,
      paymentId: body.pid
    }

    const campaign = await promotionService.createPromotion(promotionData)

    return NextResponse.json({
      success: true,
      campaign
    })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
