import { NextRequest, NextResponse } from 'next/server'

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

    // Get Pi API key from environment
    const piApiKey = process.env.PI_API_KEY
    if (!piApiKey) {
      console.error('[Payment] PI_API_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Approve the payment with Pi Network API
    const piApiUrl = `https://api.minepi.com/v2/payments/${paymentId}/approve`
    console.log('[Payment] Calling Pi API:', piApiUrl)

    const piResponse = await fetch(piApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('[Payment] Pi API status:', piResponse.status)

    if (!piResponse.ok) {
      const errorText = await piResponse.text()
      console.error('[Payment] Pi API error:', errorText)
      return NextResponse.json(
        {
          error: 'Failed to approve payment',
          details: errorText
        },
        { status: piResponse.status }
      )
    }

    const approvalData = await piResponse.json()
    console.log('[Payment] Payment approved successfully')

    return NextResponse.json({
      success: true,
      paymentId,
      ...approvalData
    })
  } catch (error) {
    console.error('[Payment] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
