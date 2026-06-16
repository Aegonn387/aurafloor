export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { nftId, userId } = await request.json();

    if (!nftId || !userId) {
      return NextResponse.json(
        { error: 'NFT ID and User ID are required' },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id FROM likes
      WHERE user_id = ${userId}
        AND likeable_type = 'nft'
        AND likeable_id = ${nftId}
    `;

    if (existing.length > 0) {
      await sql`
        DELETE FROM likes
        WHERE user_id = ${userId}
          AND likeable_type = 'nft'
          AND likeable_id = ${nftId}
      `;

      await sql`
        UPDATE nfts
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = ${nftId}
      `;

      return NextResponse.json({
        success: true,
        liked: false
      });
    } else {
      await sql`
        INSERT INTO likes (user_id, likeable_type, likeable_id)
        VALUES (${userId}, 'nft', ${nftId})
      `;

      await sql`
        UPDATE nfts
        SET like_count = like_count + 1
        WHERE id = ${nftId}
      `;

      return NextResponse.json({
        success: true,
        liked: true
      });
    }

  } catch (error) {
    console.error('[Like NFT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
