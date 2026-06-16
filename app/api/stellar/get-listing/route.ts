export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { stellarIntegration } from '@/lib/blockchain/stellar-integration'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
import { sql } from '@/lib/db'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

async function getAudioForToken(tokenId: string): Promise<string | null> {
  try {
    try {
      const nfts = await sql`
        SELECT aipfs as "audioUrl", id as "paymentId"
        FROM n
        WHERE bnid = ${tokenId}
        LIMIT 1
      `
      if (nfts.length > 0 && nfts[0].audioUrl) {
        return nfts[0].audioUrl
      }
      if (nfts.length > 0 && nfts[0].paymentId) {
        const paymentPath = `audio/${nfts[0].paymentId}/audio.mp3`
        try {
          await r2Client.send(new HeadObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || '',
            Key: paymentPath,
          }))
          return `/api/stream/${paymentPath}`
        } catch (error) {
          // Continue
        }
      }
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error'
      console.log(`[API] Database error for token ${tokenId}:`, errorMessage)
    }
    const paths = [`audio/${tokenId}/preview.mp3`, `audio/token_${tokenId}.mp3`, `audio/${tokenId}.mp3`]
    for (const path of paths) {
      try {
        await r2Client.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || '', Key: path }))
        return `/api/stream/${path}`
      } catch (error) {
        // Continue
      }
    }
    return null
  } catch (error) {
    return null
  }
}

async function getTokenMetadata(tokenId: string): Promise<any> {
  try {
    const nfts = await sql`
      SELECT title as "name", descr as "description", cipfs as "coverCID", 
             etype as "editionType", ted as "totalEditions"
      FROM n WHERE bnid = ${tokenId} LIMIT 1
    `
    if (nfts.length > 0) {
      return {
        name: nfts[0].name || `Audio NFT #${tokenId}`,
        description: nfts[0].description || 'Unique audio on Stellar',
        image: nfts[0].coverCID ? `https://gateway.pinata.cloud/ipfs/${nfts[0].coverCID}` : '/default-cover.jpg',
      }
    }
  } catch (dbError) {
    // Ignore
  }
  return { name: `Audio NFT #${tokenId}`, description: 'Unique audio on Stellar', image: '/default-cover.jpg' }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tokenId = searchParams.get('tokenId')
    const getAll = searchParams.get('getAll') === 'true'

    if (!await stellarIntegration.checkConnection()) {
      return NextResponse.json({ error: 'Stellar connection failed' }, { status: 503 })
    }

    if (getAll) {
      const allTokens = await stellarIntegration.getAllListings()
      const BATCH_SIZE = 10
      const allListings = []

      for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
        const batch = allTokens.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(async (token: any) => {
            try {
              const currentTokenId = token.tokenId
              const audioUrl = await getAudioForToken(currentTokenId)
              if (!audioUrl) return null
              const listing = await stellarIntegration.getListing(currentTokenId)
              if (!listing) return null
              const metadata = await getTokenMetadata(currentTokenId)
              return {
                ...listing,
                audioUrl,
                metadata,
                external_url: `https://aurafloor.xyz/track/${currentTokenId}`,
              }
            } catch (error) {
              return null
            }
          })
        )
        allListings.push(...batchResults.filter(item => item !== null))
      }

      return NextResponse.json({ success: true, count: allListings.length, listings: allListings })
    }

    if (!tokenId) {
      return NextResponse.json({ error: 'Need tokenId or getAll=true' }, { status: 400 })
    }

    const audioUrl = await getAudioForToken(tokenId)
    if (!audioUrl) {
      return NextResponse.json({ error: 'No audio for this token' }, { status: 404 })
    }

    const listing = await stellarIntegration.getListing(tokenId)
    if (!listing) {
      return NextResponse.json({ error: 'Token not on blockchain' }, { status: 404 })
    }

    const metadata = await getTokenMetadata(tokenId)
    return NextResponse.json({
      success: true,
      listing: { ...listing, audioUrl, metadata, external_url: `https://aurafloor.xyz/track/${tokenId}` }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
