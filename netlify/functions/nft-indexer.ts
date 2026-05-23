import { Handler } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' }
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const body = JSON.parse(event.body || '{}')
    const { type, payload } = body
    if (!type) return { statusCode: 400, body: 'Missing event type' }

    switch (type) {
      case 'reward':
        await handleReward(payload);
        break;
      case 'mint':
        await handleMint(payload)
        break
      case 'transfer':
        await handleTransfer(payload)
        break
      case 'sale':
        await handleSale(payload)
        break
      case 'stream':
        await handleStream(payload)
        break
      case 'sync':
        await runSync()
        break
      default:
        return { statusCode: 400, body: JSON.stringify({ error: 'Unknown type' }) }
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) }
  } catch (error: any) {
    console.error('[Indexer] Error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

async function handleMint(p: any) {
async function handleReward(p: any) {
  const { user_id, category, amount } = p;
  if (!user_id || !category) return;
  await sql`INSERT INTO stream_events (user_id, track_id, quality, duration, owned, timestamp) VALUES (${user_id}, ${'reward_' + category}, ${'reward'}, ${amount || 0}, false, NOW())`;
}

  const { user_pi_address, token_id, month_year, metadata } = p
  if (!user_pi_address || !token_id) throw new Error('Missing mint fields')
  await sql`
    INSERT INTO nft_mints (user_pi_address, token_id, month_year, metadata)
    VALUES (${user_pi_address}, ${token_id}, ${month_year || new Date().toISOString().slice(0,7)}, ${metadata || {}})
  `
}

async function handleTransfer(p: any) {
  const { from, to, token_id } = p
  if (!from || !to || !token_id) throw new Error('Missing transfer fields')
  await sql`
    UPDATE nft_mints SET user_pi_address = ${to} WHERE token_id = ${token_id}
  `
}

async function handleSale(p: any) {
  const { seller, buyer, token_id, price } = p
  if (!seller || !buyer || !token_id) throw new Error('Missing sale fields')
  await sql`
    UPDATE nft_mints SET user_pi_address = ${buyer} WHERE token_id = ${token_id}
  `
}

async function handleStream(p: any) {
  const { user_id, track_id, quality, duration, owned } = p
  if (!user_id || !track_id) throw new Error('Missing stream fields')
  await sql`
    INSERT INTO stream_events (user_id, track_id, quality, duration, owned, timestamp)
    VALUES (${user_id}, ${track_id}, ${quality || 'standard'}, ${duration || 0}, ${owned || false}, NOW())
  `
}

async function runSync() {
  try {
    const res = await fetch('https://aurafloor.co.za/api/stellar/get-listing?getAll=true')
    if (!res.ok) throw new Error(`Sync fetch failed: ${res.status}`)
    const data = await res.json()
    const listings = data.listings || []
    for (const nft of listings) {
      const { tokenId, metadata } = nft
      await sql`
        INSERT INTO n (bnid, title, dur, cimg, ahq, astd, aprev, updated_at)
        VALUES (
          ${tokenId},
          ${metadata?.name || `NFT #${tokenId}`},
          ${metadata?.duration || 0},
          ${metadata?.image || null},
          ${metadata?.audio_hq || null},
          ${metadata?.audio_std || null},
          ${metadata?.audio_preview || null},
          NOW()
        )
        ON CONFLICT (bnid) DO UPDATE SET
          title = EXCLUDED.title,
          dur = EXCLUDED.dur,
          cimg = EXCLUDED.cimg,
          ahq = EXCLUDED.ahq,
          astd = EXCLUDED.astd,
          aprev = EXCLUDED.aprev,
          updated_at = NOW()
      `
    }
    console.log(`Synced ${listings.length} NFTs`)
  } catch (err) {
    console.error('Sync failed:', err)
    throw err
  }
}
