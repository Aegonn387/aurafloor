import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const wallet = await sql`
      SELECT * FROM user_wallets WHERE user_id = ${userId}
    `;

    if (wallet.length === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    const recentTransactions = await sql`
      SELECT
        t.*,
        from_user.pi_username as from_username,
        to_user.pi_username as to_username,
        n.title as nft_title
      FROM transactions t
      LEFT JOIN users from_user ON t.from_user_id = from_user.id
      LEFT JOIN users to_user ON t.to_user_id = to_user.id
      LEFT JOIN nfts n ON t.nft_id = n.id
      WHERE t.from_user_id = ${userId} OR t.to_user_id = ${userId}
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      wallet: wallet[0],
      recentTransactions
    });

  } catch (error) {
    console.error('[Wallet Balance] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}
