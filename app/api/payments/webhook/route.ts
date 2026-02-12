import { NextRequest, NextResponse } from 'next/server'
import { promotionService } from '@/lib/services/promotion-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, status, metadata } = body

    if (status === 'completed' && metadata?.type === 'promotion') {
      await promotionService.activatePromotion(paymentId)
      console.log(`Promotion activated for payment: ${paymentId}`)
      
      return NextResponse.json({
        success: true,
        message: 'Promotion activated'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed, no action needed'
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed, will retry' },
      { status: 200 }
    )
  }
}
