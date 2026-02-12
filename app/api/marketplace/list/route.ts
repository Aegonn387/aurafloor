import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { nftId, sellerId, price } = await request.json();

    if (!nftId || !sellerId || !price) {
      return NextResponse.json(
        { error: 'NFT ID, Seller ID, and Price are required' },
        { status: 400 }
      );
    }

    const ownership = await sql`
      SELECT id FROM nft_ownership
      WHERE nft_id = ${nftId} AND user_id = ${sellerId}
      ORDER BY purchased_at DESC
      LIMIT 1
    `;

    if (ownership.length === 0) {
      return NextResponse.json(
        { error: 'You do not own this NFT' },
        { status: 403 }
      );
    }

    const listing = await sql`
      INSERT INTO marketplace_listings (nft_id, seller_id, price)
      VALUES (${nftId}, ${sellerId}, ${price})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      listing: listing[0]
    });

  } catch (error) {
    console.error('[List NFT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list NFT' },
      { status: 500 }
    );
  }
}
