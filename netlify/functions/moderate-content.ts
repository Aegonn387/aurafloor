import { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    }
  }

  if (event.httpMethod === 'GET') {
    const { moderatorAddress } = event.queryStringParameters || {}
    if (!moderatorAddress) return { statusCode: 400, body: 'Missing moderatorAddress' }
    const assignments = await sql`
      SELECT id, content_id, creator_wallet, title, status, risk_score, audio_url, transcript, flagged_categories
      FROM moderation_assignments WHERE status = 'pending' LIMIT 10
    `
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ assignments })
    }
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, contentId, creatorWallet, title, audioUrl } = body

    if (action === 'vote') {
      const { assignmentId, moderator, vote } = body
      await sql`INSERT INTO moderation_votes (assignment_id, moderator, vote) VALUES (${assignmentId}, ${moderator}, ${vote})`
      if (vote === 'approve') {
        await sql`UPDATE moderation_assignments SET status = 'approved' WHERE id = ${assignmentId}`
      } else {
        await sql`UPDATE moderation_assignments SET status = 'rejected' WHERE id = ${assignmentId}`
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true })
      }
    }

    // Content screening with AssemblyAI
    if (!audioUrl) {
      const riskyWords = ['hate', 'kill', 'death', 'violence', 'racist', 'nazi', 'terrorist', 'porn', 'sex', 'drug', 'weapon']
      const titleLower = (title || '').toLowerCase()
      const hasRisk = riskyWords.some(w => titleLower.includes(w))
      const status = hasRisk ? 'pending' : 'approved'
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, status })
      }
    }

    // Submit to AssemblyAI
    const submitRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        content_safety: true
      })
    })

    if (!submitRes.ok) {
      const err = await submitRes.text()
      console.error('AssemblyAI submit failed:', err)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, status: 'approved' })
      }
    }

    const submitData = await submitRes.json()
    const transcriptId = submitData.id

    // Poll for result
    let result = null
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000))
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'Authorization': ASSEMBLYAI_API_KEY }
      })
      const pollData = await pollRes.json()

      if (pollData.status === 'completed') {
        result = pollData
        break
      }
      if (pollData.status === 'error') {
        console.error('AssemblyAI error:', pollData.error)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, status: 'approved' })
        }
      }
      attempts++
    }

    if (!result) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, status: 'approved' })
      }
    }

    // Analyze content safety
    const labels = result.content_safety_labels?.results || []
    let maxSeverity = 'low'
    const flaggedCategories: string[] = []

    for (const label of labels) {
      const severity = label.severity || 'low'
      if (severity === 'high') {
        maxSeverity = 'high'
        flaggedCategories.push(label.label)
      } else if (severity === 'medium' && maxSeverity !== 'high') {
        maxSeverity = 'medium'
        flaggedCategories.push(label.label)
      }
    }

    const shouldFlag = maxSeverity === 'high' || (maxSeverity === 'medium' && flaggedCategories.length >= 2)
    const status = shouldFlag ? 'pending' : 'approved'

    // Store in DB
    await sql`
      INSERT INTO moderation_assignments (content_id, creator_wallet, title, status, risk_score, audio_url, transcript, flagged_categories)
      VALUES (${contentId}, ${creatorWallet}, ${title}, ${status}, ${maxSeverity === 'high' ? 0.8 : maxSeverity === 'medium' ? 0.5 : 0.1}, ${audioUrl}, ${result.text || ''}, ${flaggedCategories})
    `

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        status,
        details: {
          severity: maxSeverity,
          flagged: flaggedCategories,
          transcript: result.text?.substring(0, 200) || ''
        }
      })
    }

  } catch (error: any) {
    console.error('Moderation error:', error)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, status: 'approved' })
    }
  }
}
