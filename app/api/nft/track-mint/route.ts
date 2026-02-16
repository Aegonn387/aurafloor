import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// POST - Track a new NFT mint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_pi_address, nft_id, token_id, metadata } = body;

    if (!user_pi_address) {
      return NextResponse.json({ 
        success: false, 
        error: 'User address required' 
      }, { status: 400 });
    }

    // Get current month-year
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check user's subscription and mint limit
    const subscription = await sql`
      SELECT 
        us.tier,
        sp.max_nfts_per_month
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_pi_address = ${user_pi_address}
      LIMIT 1
    `;

    if (subscription.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No subscription found. Please subscribe first.' 
      }, { status: 403 });
    }

    const maxMints = subscription[0].max_nfts_per_month;

    // -1 means unlimited
    if (maxMints !== -1) {
      // Check current month's mints
      const mintCount = await sql`
        SELECT get_monthly_mint_count(${user_pi_address}, ${monthYear}) as count
      `;

      const currentMints = parseInt(mintCount[0].count);

      if (currentMints >= maxMints) {
        return NextResponse.json({ 
          success: false, 
          error: `Mint limit reached. You can mint ${maxMints} NFTs per month on your current plan.`,
          current_mints: currentMints,
          max_mints: maxMints
        }, { status: 403 });
      }
    }

    // Track the mint
    await sql`
      INSERT INTO nft_mints (
        user_pi_address,
        nft_id,
        token_id,
        month_year,
        metadata
      ) VALUES (
        ${user_pi_address},
        ${nft_id || null},
        ${token_id || null},
        ${monthYear},
        ${metadata ? JSON.stringify(metadata) : null}
      )
    `;

    // Get updated count
    const newCount = await sql`
      SELECT get_monthly_mint_count(${user_pi_address}, ${monthYear}) as count
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Mint tracked successfully',
      mints_this_month: parseInt(newCount[0].count),
      max_mints: maxMints === -1 ? 'unlimited' : maxMints
    });

  } catch (error) {
    console.error('Mint tracking failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to track mint' 
    }, { status: 500 });
  }
}

// GET - Check user's mint count for current month
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_pi_address = searchParams.get('user_pi_address');

    if (!user_pi_address) {
      return NextResponse.json({ 
        success: false, 
        error: 'User address required' 
      }, { status: 400 });
    }

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const mintCount = await sql`
      SELECT get_monthly_mint_count(${user_pi_address}, ${monthYear}) as count
    `;

    const subscription = await sql`
      SELECT sp.max_nfts_per_month
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_pi_address = ${user_pi_address}
      LIMIT 1
    `;

    const maxMints = subscription[0]?.max_nfts_per_month || 0;
    const currentMints = parseInt(mintCount[0].count);

    return NextResponse.json({ 
      success: true,
      mints_this_month: currentMints,
      max_mints: maxMints === -1 ? 'unlimited' : maxMints,
      can_mint: maxMints === -1 || currentMints < maxMints,
      remaining: maxMints === -1 ? 'unlimited' : Math.max(0, maxMints - currentMints)
    });

  } catch (error) {
    console.error('Failed to get mint count:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get mint count' 
    }, { status: 500 });
  }
}
