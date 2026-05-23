import { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
const AURA_TOKEN_CONTRACT = process.env.AURA_TOKEN_CONTRACT || ''

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const body = JSON.parse(event.body || '{}')
    const { nftId, creatorWallet, amount, duration, goal, audience, message } = body
    if (!nftId || !creatorWallet || !amount) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }
    // TODO: call AURA token contract burn function
    // const server = new StellarSdk.SorobanRpc.Server(PI_RPC_URL)
    // const burnerKeypair = StellarSdk.Keypair.fromSecret(BURNER_SECRET_KEY)
    // ... call contract.burn('promotion', amount)
    console.log(`[Promote] Burn ${amount} AURA for NFT ${nftId} by ${creatorWallet}`)

    // Record promotion in database
    await sql`
      INSERT INTO pc (uid, nid, dbudget, tbudget, dur, goal, aud, msg)
      VALUES (${creatorWallet}, ${nftId}, ${amount}, ${amount}, ${duration || 7}, ${goal || 'awareness'}, ${audience || 'all'}, ${message || ''})
    `
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: 'Promotion launched. AURA will be burned.' })
    }
  } catch (error: any) {
    console.error('[Promote Content] Error:', error)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: error.message }) }
  }
}
