import { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' }, body: '' }
  }
  if (event.httpMethod === 'GET') {
    const { moderatorAddress } = event.queryStringParameters || {}
    if (!moderatorAddress) return { statusCode: 400, body: 'Missing moderatorAddress' }
    const assignments = await sql`SELECT * FROM moderation_assignments WHERE status = 'pending' LIMIT 5`
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ assignments }) }
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const body = JSON.parse(event.body || '{}')
    const { action } = body
    if (action === 'vote') {
      const { assignmentId, moderator, vote } = body
      await sql`INSERT INTO moderation_votes (assignment_id, moderator, vote) VALUES (${assignmentId}, ${moderator}, ${vote})`
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) }
    }
    const riskScore = Math.random()
    const { contentId, creatorWallet, title } = body
    const status = riskScore < 0.3 ? 'approved' : 'pending'
    await sql`INSERT INTO moderation_assignments (content_id, creator_wallet, title, status, risk_score) VALUES (${contentId}, ${creatorWallet}, ${title}, ${status}, ${riskScore})`
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true, status }) }
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}
