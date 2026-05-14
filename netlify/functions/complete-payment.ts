import { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
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
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { payment } = JSON.parse(event.body || '{}')
    const paymentId = payment?.identifier || payment?.paymentId

    if (!paymentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payment identifier is required' }),
      }
    }

    const API_KEY = process.env.PI_NETWORK_API_KEY
    if (!API_KEY) {
      console.error('PI_NETWORK_API_KEY environment variable is not set')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error: API key missing' }),
      }
    }

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid: payment?.transaction?.txid || '' }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pi payment completion error:', errorText)
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Pi payment completion failed', details: errorText }),
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true }),
    }
  } catch (error: any) {
    console.error(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    }
  }
}
