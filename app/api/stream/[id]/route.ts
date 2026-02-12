import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { stellarIntegration } from '@/lib/blockchain/stellar-integration'

const sql = neon(process.env.DATABASE_URL!)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const TIER_CONFIG: Record<string, { quality: string; adRequired: boolean }> = {
  nft_owner: { quality: 'hq', adRequired: false },
  creator_top: { quality: 'hq', adRequired: false },
  collector_top: { quality: 'hq', adRequired: false },
  creator_standard: { quality: 'std', adRequired: true },
  collector_standard: { quality: 'std', adRequired: true },
  free: { quality: 'preview', adRequired: true }
}

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT: ${label} after ${ms}ms`)), ms))
  ])
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  console.log(`[${startTime}] POST /api/stream called`)

  try {
    const { id: tokenId } = await context.params
    const { userId } = await request.json()
    console.log(`[${Date.now()}] Params: tokenId=${tokenId}, userId=${userId}`)

    let userTier = 'free'

    console.log(`[${Date.now()}] Starting NFT ownership check...`)
    try {
      const ownerAddress = await withTimeout(
        stellarIntegration.getTokenOwner(parseInt(tokenId)),
        8000,
        'Stellar getTokenOwner'
      )
      console.log(`[${Date.now()}] Stellar RPC returned: ${ownerAddress}`)
      if (ownerAddress === userId) {
        userTier = 'nft_owner'
        console.log(`[${Date.now()}] ✅ User is NFT owner`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[${Date.now()}] ❌ NFT check error:`, errorMessage)
    }

    if (userTier === 'free') {
      console.log(`[${Date.now()}] Starting DB subscription check...`)
      try {
        const userData = await withTimeout(
          sql`SELECT subtier FROM u WHERE id = ${userId}`,
          5000,
          'Database query'
        )
        const subTier = userData[0]?.subtier
        if (subTier && TIER_CONFIG[subTier]) {
          userTier = subTier
        }
        console.log(`[${Date.now()}] DB check complete. Tier: ${userTier}`)
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error'
        console.error(`[${Date.now()}] ❌ DB error:`, errorMessage)
      }
    }

    const config = TIER_CONFIG[userTier] || TIER_CONFIG.free
    const r2ObjectKey = `audio/${tokenId}/${config.quality}.mp3`
    console.log(`[${Date.now()}] Serving: ${r2ObjectKey}`)
    console.log(`[${Date.now()}] Generating R2 signed URL...`)

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2ObjectKey,
      ResponseContentType: 'audio/mpeg',
    })

    const signedUrl = await withTimeout(
      getSignedUrl(r2Client, command, { expiresIn: 3600 }),
      5000,
      'R2 getSignedUrl'
    )
    console.log(`[${Date.now()}] ✅ Signed URL generated`)

    const responseTime = Date.now() - startTime
    return NextResponse.json({
      success: true,
      streamUrl: signedUrl,
      quality: config.quality,
      expiresIn: 3600,
      tier: userTier,
      requiresAd: config.adRequired,
      processingTimeMs: responseTime,
      tokenId: tokenId
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[${Date.now()}] ❌ Route handler error:`, errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process stream request',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tokenId } = await context.params
  return NextResponse.json({
    message: 'AuraFloor Secure Stream Endpoint',
    status: 'operational',
    tokenId: tokenId,
    requiredTiers: Object.keys(TIER_CONFIG),
    usage: 'POST with { "userId": "user123" } to get a secure audio URL'
  })
}
