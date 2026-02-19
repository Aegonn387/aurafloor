import { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  console.log('[Pi Verification] Function called')

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { accessToken, sandbox } = body

    console.log('[Pi Verification] Access token received:', accessToken ? 'Present' : 'Missing')
    console.log('[Pi Verification] Sandbox mode:', sandbox)

    if (!accessToken) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Access token is required' })
      }
    }

    // If sandbox mode is true, return mock user data without calling Pi API
    if (sandbox) {
      console.log('[Pi Verification] Returning mock user for sandbox')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          user: {
            uid: 'sandbox-uid-12345',
            username: 'sandbox_user',
            verified: true
          }
        })
      }
    }

    // Production: call Pi API
    const piApiBase = process.env.PI_API_BASE || 'https://api.testnet.minepi.com'
    const piApiUrl = `${piApiBase}/v2/me`

    console.log('[Pi Verification] Calling Pi API:', piApiUrl)

    const piResponse = await fetch(piApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('[Pi Verification] Pi API status:', piResponse.status)

    if (!piResponse.ok) {
      const errorText = await piResponse.text()
      console.error('[Pi Verification] Pi API error:', errorText)
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Invalid Pi access token',
          details: `Pi API returned ${piResponse.status}: ${errorText}`
        })
      }
    }

    const piUserData = await piResponse.json()
    console.log('[Pi Verification] Pi user data received:', piUserData)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        user: {
          uid: piUserData.uid,
          username: piUserData.username || `PiUser${Math.floor(Math.random() * 10000)}`,
          verified: true
        }
      })
    }

  } catch (error) {
    console.error('[Pi Verification] Error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
