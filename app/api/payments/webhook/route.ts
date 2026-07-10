export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { promotionService } from '@/lib/services/promotion-service'
import { getBackendConfig, validatePiConfig } from '@/lib/pi-config'

function verifyPiSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const crypto = require('crypto')
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-pi-signature')
    const secret = process.env.PI_WEBHOOK_SECRET || ''

    if (!verifyPiSignature(body, signature, secret)) {
      console.error('[Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)
    const { paymentId, status, metadata } = payload

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Missing paymentId or status' },
        { status: 400 }
      )
    }

    const configCheck = validatePiConfig()
    if (!configCheck.valid) {
      console.error('[Webhook] Config errors:', configCheck.errors)
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const backend = getBackendConfig()

    const piResponse = await fetch(`${backend.baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: backend.headers,
    })

    if (!piResponse.ok) {
      const errorText = await piResponse.text()
      console.error('[Webhook] Pi API verification failed:', errorText)
      return NextResponse.json(
        { error: 'Payment verification failed', details: errorText },
        { status: 502 }
      )
    }

    const paymentData = await piResponse.json()

    if (status === 'completed' && metadata?.type === 'promotion') {
      if (paymentData.status?.transaction_verified !== true) {
        console.error('[Webhook] Payment not verified on blockchain')
        return NextResponse.json(
          { error: 'Payment not verified' },
          { status: 502 }
        )
      }

      await promotionService.activatePromotion(paymentId)
      console.log(`[Webhook] Promotion activated for payment: ${paymentId}`)

      return NextResponse.json({
        success: true,
        message: 'Promotion activated',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed, no action needed',
    })
  } catch (error: any) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    )
  }
}
