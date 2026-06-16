export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const sort = searchParams.get('sort') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let orderClause = 'ml.created_at DESC';
    if (sort === 'price_low') orderClause = 'ml.price ASC';
    if (sort === 'price_high') orderClause = 'ml.price DESC';

    const listings = await sql`
      SELECT
        ml.*,
        n.title, n.description, n.genre, n.cover_image_url,
        n.duration, n.play_count, n.like_count,
        seller.pi_username as seller_username,
        seller.display_name as seller_display_name,
        seller.avatar_url as seller_avatar,
        creator.pi_username as creator_username,
        creator.display_name as creator_display_name
      FROM marketplace_listings ml
      JOIN nfts n ON ml.nft_id = n.id
      JOIN users seller ON ml.seller_id = seller.id
      JOIN users creator ON n.creator_id = creator.id
      WHERE ml.status = 'active'
        ${genre ? sql`AND n.genre = ${genre}` : sql``}
      ORDER BY ${sql.unsafe(orderClause)}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = await sql`
      SELECT COUNT(*) as count
      FROM marketplace_listings ml
      JOIN nfts n ON ml.nft_id = n.id
      WHERE ml.status = 'active'
        ${genre ? sql`AND n.genre = ${genre}` : sql``}
    `;

    return NextResponse.json({
      success: true,
      listings,
      pagination: {
        total: parseInt(total[0].count),
        limit,
        offset,
        hasMore: offset + limit < parseInt(total[0].count)
      }
    });

  } catch (error) {
    console.error('[Marketplace Listings] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
