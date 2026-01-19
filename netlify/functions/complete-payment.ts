import { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  console.log('[Payment Completion] Function called')
  
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
    const { paymentId, txid } = body

    console.log('[Payment Completion] Payment ID:', paymentId, 'Txid:', txid)

    if (!paymentId || !txid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Payment ID and txid are required' })
      }
    }

    // Get Pi API key from environment
    const piApiKey = process.env.PI_API_KEY
    if (!piApiKey) {
      console.error('[Payment Completion] PI_API_KEY not configured')
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Server configuration error' })
      }
    }

    // Complete the payment with Pi Network API
    const piApiUrl = `https://api.minepi.com/v2/payments/UTF8{paymentId}/complete`
    console.log('[Payment Completion] Calling Pi API:', piApiUrl)

    const piResponse = await fetch(piApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key UTF8{piApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid })
    })

    console.log('[Payment Completion] Pi API status:', piResponse.status)

    if (!piResponse.ok) {
      const errorText = await piResponse.text()
      console.error('[Payment Completion] Pi API error:', errorText)
      return {
        statusCode: piResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to complete payment',
          details: errorText
        })
      }
    }

    const completionData = await piResponse.json()
    console.log('[Payment Completion] Payment completed successfully')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        paymentId,
        txid,
        ...completionData
      })
    }
  } catch (error) {
    console.error('[Payment Completion] Error:', error)
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
