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
    const { paymentId } = JSON.parse(event.body || '{}')
    if (!paymentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'paymentId is required' }),
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

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pi payment approval error:', errorText)
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Pi payment approval failed', details: errorText }),
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
