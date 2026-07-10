export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { v4 as uuidv4 } from 'uuid'
import { getBackendConfig, validatePiConfig } from '@/lib/pi-config'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const requiredFields = ['creatorWallet', 'title', 'price', 'resaleFee']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', missing: missingFields },
        { status: 400 }
      )
    }

    const resaleFee = Number(body.resaleFee)

    if (isNaN(resaleFee) || resaleFee < 500 || resaleFee > 1500) {
      return NextResponse.json(
        { error: 'Resale fee must be a number between 5% and 15% (500-1500)' },
        { status: 400 }
      )
    }

    const configCheck = validatePiConfig()
    if (!configCheck.valid) {
      console.error('[Approve Payment] Config errors:', configCheck.errors)
      return NextResponse.json(
        { error: 'Server configuration error', details: configCheck.errors },
        { status: 500 }
      )
    }

    const backend = getBackendConfig()
    const paymentId = uuidv4()

    console.log('[Approve Payment] Creating NFT record for:', body.title)

    await sql`
      INSERT INTO pending_nft_mints (
        payment_id,
        creator_wallet,
        title,
        description,
        category,
        price,
        resale_fee,
        edition_type,
        total_editions,
        monetization,
        audio_filename,
        audio_content_type,
        cover_filename,
        cover_content_type,
        expires_at
      ) VALUES (
        ${paymentId},
        ${body.creatorWallet},
        ${body.title},
        ${body.description || null},
        ${body.category || null},
        ${body.price},
        ${resaleFee},
        ${body.editionType || null},
        ${body.totalEditions || null},
        ${body.monetization ? JSON.stringify(body.monetization) : null},
        ${body.audioFilename || null},
        ${body.audioContentType || null},
        ${body.coverFilename || null},
        ${body.coverContentType || null},
        ${new Date(Date.now() + 3600000)}
      )
    `

    console.log('[Approve Payment] NFT record created:', paymentId)

    const piPayment = await fetch(`${backend.baseUrl}/payments`, {
      method: 'POST',
      headers: backend.headers,
      body: JSON.stringify({
        payment: {
          payment_id: paymentId,
          amount: body.price,
          memo: `Mint NFT: ${body.title}`,
          metadata: {
            nft_title: body.title,
            creator_wallet: body.creatorWallet,
          },
        },
      }),
    })

    if (!piPayment.ok) {
      const errorText = await piPayment.text()
      console.error('[Approve Payment] Pi payment creation failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to create Pi payment', details: errorText },
        { status: 502 }
      )
    }

    const piData = await piPayment.json()

    return NextResponse.json({
      success: true,
      paymentId,
      piPaymentId: piData.identifier,
      amount: body.price,
      memo: `Mint NFT: ${body.title}`,
      message: 'NFT record created and Pi payment initiated',
    })
  } catch (error) {
    console.error('[Approve Payment] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create NFT record',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    )
  }
}
