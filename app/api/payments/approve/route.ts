export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getBackendConfig, validatePiConfig } from '@/lib/pi-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId } = body

    console.log('[Payment] Approving payment:', paymentId)

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    const configCheck = validatePiConfig()
    if (!configCheck.valid) {
      console.error('[Payment] Config errors:', configCheck.errors)
      return NextResponse.json(
        { error: 'Server configuration error', details: configCheck.errors },
        { status: 500 }
      )
    }

    const backend = getBackendConfig()

    const piResponse = await fetch(`${backend.baseUrl}/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: backend.headers,
    })

    console.log('[Payment] Pi API status:', piResponse.status)

    if (!piResponse.ok) {
      const errorText = await piResponse.text()
      console.error('[Payment] Pi API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to approve payment', details: errorText },
        { status: piResponse.status }
      )
    }

    const approvalData = await piResponse.json()
    console.log('[Payment] Payment approved successfully')

    return NextResponse.json({
      success: true,
      paymentId,
      ...approvalData,
    })
  } catch (error) {
    console.error('[Payment] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
