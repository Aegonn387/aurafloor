export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import pinataSDK from '@pinata/sdk'
import { v4 as uuidv4 } from 'uuid'

const sql = neon(process.env.DATABASE_URL!)
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
)

export async function POST(req: NextRequest) {
  try {
    console.log('[Upload to IPFS] Starting file upload...')
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    const paymentId = formData.get('paymentId') as string
    const fileType = formData.get('type') as string || 'cover'

    if (!file || !paymentId) {
      return NextResponse.json({ error: 'File and paymentId are required' }, { status: 400 })
    }

    console.log(`[Upload to IPFS] Processing: ${file.name} (${fileType}) for payment ${paymentId}`)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileUuid = uuidv4()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileExtension = file.name.split('.').pop() || 'bin'
    const pinataName = `${fileType}-${paymentId}-${fileUuid}.${fileExtension}`

    console.log(`[Upload to IPFS] Uploading to Pinata: ${pinataName}`)

    const pinataOptions = {
      pinataMetadata: {
        name: pinataName,
      },
      pinataOptions: {
        cidVersion: 0 as const,
      }
    }

    const { Readable } = require("stream")
    const stream = Readable.from(buffer)
    const pinataResult = await pinata.pinFileToIPFS(stream, pinataOptions)
    const cid = pinataResult.IpfsHash
    const ipfsUrl = `ipfs://${cid}`
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`

    console.log(`[Upload to IPFS] File uploaded to IPFS: ${cid}`)
    console.log(`[Upload to IPFS] IPFS URL: ${ipfsUrl}`)
    console.log(`[Upload to IPFS] Gateway URL: ${gatewayUrl}`)

    if (fileType === 'cover') {
      await sql`
        UPDATE pending_nft_mints
        SET
          cover_ipfs_cid = ${cid},
          cover_ipfs_url = ${ipfsUrl},
          cover_gateway_url = ${gatewayUrl}
        WHERE payment_id = ${paymentId}
      `
      console.log(`[Upload to IPFS] Cover IPFS CID saved to database for payment: ${paymentId}`)
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to IPFS',
      cid: cid,
      ipfsUrl: ipfsUrl,
      gatewayUrl: gatewayUrl,
      filename: file.name,
      contentType: file.type,
      size: buffer.length,
      fileType: fileType
    })
  } catch (error) {
    console.error('[Upload to IPFS] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to upload file to IPFS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  const isConfigured = !!(process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET)

  try {
    let pinataTest = false
    if (isConfigured) {
      const testResult = await pinata.testAuthentication()
      pinataTest = testResult.authenticated
    }

    return NextResponse.json({
      pinata_configured: isConfigured,
      pinata_authenticated: pinataTest,
      message: isConfigured ? 'Pinata configured' : 'Missing PINATA_API_KEY or PINATA_API_SECRET'
    })
  } catch (error) {
    return NextResponse.json({
      pinata_configured: isConfigured,
      pinata_authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
