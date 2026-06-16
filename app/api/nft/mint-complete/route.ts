export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, userPiAddress, contractAddress, tokenId } = body;

    if (!paymentId || !userPiAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pending = await sql`
      SELECT * FROM pending_nft_mints WHERE payment_id = ${paymentId} LIMIT 1
    `;

    if (!pending.length) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const { audio_r2_url, cover_r2_url, metadata_json } = pending[0];

    if (!audio_r2_url || !cover_r2_url || !metadata_json) {
      return NextResponse.json({
        error: 'Complete flow required',
        missing: {
          audio: !audio_r2_url,
          cover: !cover_r2_url,
          metadata: !metadata_json
        }
      }, { status: 400 });
    }

    const metadata = typeof metadata_json === 'string' ? JSON.parse(metadata_json) : metadata_json;
    const metadataUri = metadata.metadata_uri || metadata.ipfs_hash ? `ipfs://${metadata.ipfs_hash}` : null;

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await sql`
      INSERT INTO nft_mints (
        user_pi_address,
        payment_id,
        contract_address,
        token_id,
        metadata_uri,
        audio_url,
        cover_url,
        month_year,
        minted_at
      ) VALUES (
        ${userPiAddress},
        ${paymentId},
        ${contractAddress},
        ${tokenId},
        ${metadataUri},
        ${audio_r2_url},
        ${cover_r2_url},
        ${monthYear},
        NOW()
      )
    `;

    await sql`
      DELETE FROM pending_nft_mints WHERE payment_id = ${paymentId}
    `;

    return NextResponse.json({
      success: true,
      message: 'NFT minted successfully',
      nft: {
        tokenId,
        metadataUri,
        audioUrl: audio_r2_url,
        coverUrl: cover_r2_url
      }
    });
  } catch (error) {
    console.error('[Mint Complete Error]:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to complete mint',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
