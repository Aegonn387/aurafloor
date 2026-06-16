export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { nftId, buyerId, piPaymentId } = await request.json();

    if (!nftId || !buyerId) {
      return NextResponse.json(
        { error: 'NFT ID and Buyer ID are required' },
        { status: 400 }
      );
    }

    // Query your 'n' table with CORRECT column: 'royalty' not 'resale_royalty_percent'
    const nft = await sql`
      SELECT
        n.id as nft_id,
        n.crid as seller_id,
        n.price,
        n.royalty,  -- CORRECT: Using your 'royalty' column
        n.title as nft_title,
        n.crid as creator_id
      FROM n
      WHERE n.id = ${nftId} AND n.st = 'active'
    `;

    if (nft.length === 0) {
      return NextResponse.json(
        { error: 'NFT not found or not available for sale' },
        { status: 404 }
      );
    }

    const { nft_id, seller_id, price, royalty, nft_title, creator_id } = nft[0];

    const platformFee = price * 0.075;
    const creatorRoyalty = price * (royalty / 100);  // Using 'royalty' column
    const sellerAmount = price - platformFee - creatorRoyalty;

    // Create transaction in your 't' table
    const transaction = await sql`
      INSERT INTO t (
        type, fuid, tuid, nid,
        amt, pfee, croy,
        st, ppay, meta
      ) VALUES (
        'purchase',
        ${buyerId},
        ${seller_id},
        ${nft_id},
        ${price},
        ${platformFee},
        ${creatorRoyalty},
        'pending',
        ${piPaymentId},
        ${JSON.stringify({ direct_nft_purchase: true })}
      )
      RETURNING id
    `;

    // CREATE NOTIFICATION FOR THE SELLER
    await sql`
      INSERT INTO notif (uid, type, title, msg, actor_uid, nid, tid, amt, action)
      VALUES (
        ${seller_id},
        'purchase',
        'NFT Sold!',
        ${`Buyer purchased your NFT "${nft_title}"`},
        ${buyerId},
        ${nft_id},
        ${transaction[0].id},
        ${price},
        'purchased'
      )
    `;

    // Update NFT status and owner
    await sql`
      UPDATE n
      SET 
        ownerid = ${buyerId},
        st = 'sold',
        scount = scount + 1,
        ua = NOW()
      WHERE id = ${nft_id}
    `;

    // Record ownership history
    await sql`
      INSERT INTO no (nid, uid, pa, pprice)
      VALUES (${nft_id}, ${buyerId}, NOW(), ${price})
    `;

    // Update buyer's wallet (deduct purchase)
    await sql`
      UPDATE uw
      SET 
        available_balance = available_balance - ${price},
        lifetime_spent = lifetime_spent + ${price},
        ua = NOW()
      WHERE uid = ${buyerId}
    `;

    // Update seller's wallet (add proceeds)
    await sql`
      UPDATE uw
      SET 
        available_balance = available_balance + ${sellerAmount},
        lifetime_earnings = lifetime_earnings + ${sellerAmount},
        ua = NOW()
      WHERE uid = ${seller_id}
    `;

    // Update creator's wallet (add royalty) - creator is seller in this case
    await sql`
      UPDATE uw
      SET 
        available_balance = available_balance + ${creatorRoyalty},
        lifetime_earnings = lifetime_earnings + ${creatorRoyalty},
        ua = NOW()
      WHERE uid = ${creator_id}
    `;

    return NextResponse.json({
      success: true,
      transaction: transaction[0],
      nft: {
        id: nft_id,
        title: nft_title,
        new_owner: buyerId
      },
      breakdown: {
        total: price,
        platformFee,
        creatorRoyalty,
        sellerAmount
      }
    });

  } catch (error) {
    console.error('[Purchase NFT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase NFT' },
      { status: 500 }
    );
  }
}
