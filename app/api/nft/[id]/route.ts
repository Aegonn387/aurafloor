import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const nft = await sql`
      SELECT
        n.*,
        u.pi_username as creator_username,
        u.pi_address as creator_address,
        u.avatar_url as creator_avatar,
        u.display_name as creator_display_name
      FROM nfts n
      LEFT JOIN users u ON n.creator_id = u.id
      WHERE n.id = ${id} OR n.blockchain_nft_id = ${id}
      LIMIT 1
    `;

    if (nft.length === 0) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
    }

    const currentOwner = await sql`
      SELECT
        u.id, u.pi_username, u.pi_address, u.avatar_url, u.display_name,
        no.purchased_at, no.purchase_price
      FROM nft_ownership no
      JOIN users u ON no.user_id = u.id
      WHERE no.nft_id = ${nft[0].id}
      ORDER BY no.purchased_at DESC
      LIMIT 1
    `;

    const ownershipHistory = await sql`
      SELECT
        u.pi_username, u.avatar_url, u.display_name,
        no.purchased_at, no.purchase_price
      FROM nft_ownership no
      JOIN users u ON no.user_id = u.id
      WHERE no.nft_id = ${nft[0].id}
      ORDER BY no.purchased_at DESC
      LIMIT 10
    `;

    const similarNFTs = await sql`
      SELECT
        id, title, cover_image_url, price, play_count, like_count
      FROM nfts
      WHERE creator_id = ${nft[0].creator_id} AND id != ${nft[0].id}
      ORDER BY created_at DESC
      LIMIT 6
    `;

    return NextResponse.json({
      success: true,
      nft: {
        ...nft[0],
        current_owner: currentOwner[0] || null,
        ownership_history: ownershipHistory,
        similar_nfts: similarNFTs,
        audio_urls: {
          preview: nft[0].audio_preview_url,
          standard: nft[0].audio_standard_url,
          hq: nft[0].audio_hq_url
        }
      }
    });

  } catch (error) {
    console.error('[NFT Details] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT details' },
      { status: 500 }
    );
  }
}