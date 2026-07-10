import { Handler } from '@netlify/functions'
import { getBackendConfig, validatePiConfig } from '../../lib/pi-config'

export const handler: Handler = async (event) => {
  // CORS preflight
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
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  // Validate Pi config before making any calls
  const configCheck = validatePiConfig()
  if (!configCheck.valid) {
    console.error('[Pi Verification] Config errors:', configCheck.errors)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Server configuration error',
        details: configCheck.errors,
      }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { accessToken } = body

    if (!accessToken) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Access token is required' }),
      }
    }

    const backend = getBackendConfig()

    // 2026: Use Key auth (not Bearer) and explicit network base URL
    const piResponse = await fetch(`${backend.baseUrl}/me`, {
      method: 'GET',
      headers: {
        'Authorization': backend.headers.Authorization,
        'Content-Type': 'application/json',
      },
    })

    if (!piResponse.ok) {
      const errorText = await piResponse.text()
      console.error('[Pi Verification] Pi API error:', {
        status: piResponse.status,
        statusText: piResponse.statusText,
        body: errorText,
        endpoint: backend.baseUrl,
      })
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid Pi access token',
          details: `Pi API returned ${piResponse.status}: ${errorText}`,
        }),
      }
    }

    const piUser = await piResponse.json()

    // 2026: Return wallet_address too — required for NFT minting
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        user: {
          uid: piUser.uid,
          username: piUser.username || `PiUser_${piUser.uid?.slice(-4) || 'xxxx'}`,
          wallet_address: piUser.wallet_address || null,
        },
      }),
    }
  } catch (error: any) {
    console.error('[Pi Verification] Error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    }
  }
}
