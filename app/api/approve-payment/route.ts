import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // CHANGED: Removed audioData, audioFilename, audioContentType from required fields
    const requiredFields = ['creatorWallet', 'title', 'price', 'resaleFee'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missing: missingFields
      }, { status: 400 });
    }

    if (body.resaleFee < 500 || body.resaleFee > 1500) {
      return NextResponse.json({
        error: 'Resale fee must be between 5% and 15% (500-1500)'
      }, { status: 400 });
    }

    const paymentId = uuidv4();
    
    // CHANGED: NO MORE Buffer.from() - we don't handle files here
    // The frontend will upload files separately and update this record later
    
    console.log('[Approve Payment] Creating NFT record for:', body.title);

    await sql`
      INSERT INTO pending_nft_mints (
        payment_id, creator_wallet, title, description, category,
        price, resale_fee, edition_type, total_editions, monetization,
        audio_filename, audio_content_type,  -- STILL store filenames for reference
        cover_filename, cover_content_type, expires_at,
        audio_data, cover_data  -- SET THESE TO NULL - will be filled later by upload endpoints
      ) VALUES (
        ${paymentId}, ${body.creatorWallet}, ${body.title}, ${body.description || null}, ${body.category || null},
        ${body.price}, ${body.resaleFee}, ${body.editionType || null}, ${body.totalEditions || null},
        ${body.monetization ? JSON.stringify(body.monetization) : null},
        ${body.audioFilename || null}, ${body.audioContentType || null},  -- Optional, for reference only
        ${body.coverFilename || null}, ${body.coverContentType || null},
        ${new Date(Date.now() + 3600000)},  -- 1 hour expiry
        ${Buffer.from("")}, ${Buffer.from("")}  -- TEMP: Empty buffers for NOT NULL constraint
      )
    `;

    console.log('[Approve Payment] NFT record created with paymentId:', paymentId);

    return NextResponse.json({
      success: true,
      paymentId,
      amount: body.price,
      memo: `Mint NFT: ${body.title}`,
      message: 'NFT record created. Please upload files next.'
    });

  } catch (error) {
    console.error('[Approve Payment] Error:', error);
    return NextResponse.json({
      error: 'Failed to create NFT record',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}