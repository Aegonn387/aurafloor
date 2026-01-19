import { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  console.log('[Payment Approval] Function called')
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { paymentId } = body

    console.log('[Payment Approval] Payment ID:', paymentId)

    if (!paymentId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Payment ID is required' })
      }
    }

    // Get Pi API key from environment
    const piApiKey = process.env.PI_API_KEY
    if (!piApiKey) {
      console.error('[Payment Approval] PI_API_KEY not configured')
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Server configuration error' })
      }
    }

    // Approve the payment with Pi Network API
    const piApiUrl = `https://api.minepi.com/v2/payments/netlify/functions/approve-payment.ts{paymentId}/approve`
    console.log('[Payment Approval] Calling Pi API:', piApiUrl)

    const piResponse = await fetch(piApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key netlify/functions/approve-payment.ts{piApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('[Payment Approval] Pi API status:', piResponse.status)

    if (!piResponse.ok) {
      const errorText = await piResponse.text()
      console.error('[Payment Approval] Pi API error:', errorText)
      return {
        statusCode: piResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to approve payment',
          details: errorText
        })
      }
    }

    const approvalData = await piResponse.json()
    console.log('[Payment Approval] Payment approved successfully')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        paymentId,
        ...approvalData
      })
    }
  } catch (error) {
    console.error('[Payment Approval] Error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
