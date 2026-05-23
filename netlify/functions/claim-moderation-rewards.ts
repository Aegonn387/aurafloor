import { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const { moderator } = JSON.parse(event.body || '{}')
    if (!moderator) return { statusCode: 400, body: 'Missing moderator' }
    const rewarded = await sql`INSERT INTO moderation_rewards (moderator, amount_aura) SELECT ${moderator}, 25 WHERE EXISTS (SELECT 1 FROM moderation_votes WHERE moderator = ${moderator}) RETURNING amount_aura`
    const total = rewarded.reduce((sum: number, r: any) => sum + Number(r.amount_aura), 0)
    await fetch('https://aurafloor.co.za/.netlify/functions/nft-indexer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reward', payload: { user_id: moderator, category: 'moderation_vote', amount: total } }) }).catch(() => {});
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, claimed: total }) }
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}
