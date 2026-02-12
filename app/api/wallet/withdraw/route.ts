import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, piAddress } = await request.json();

    if (!userId || !amount || !piAddress) {
      return NextResponse.json(
        { error: 'User ID, amount, and Pi address are required' },
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is 1π' },
        { status: 400 }
      );
    }

    const wallet = await sql`
      SELECT available_balance FROM user_wallets
      WHERE user_id = ${userId}
    `;

    if (wallet.length === 0) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    if (parseFloat(wallet[0].available_balance) < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    const transaction = await sql`
      INSERT INTO transactions (
        type, from_user_id, amount, status, metadata
      ) VALUES (
        'withdrawal',
        ${userId},
        ${amount},
        'pending',
        ${JSON.stringify({ pi_address: piAddress })}
      )
      RETURNING *
    `;

    await sql`
      UPDATE user_wallets
      SET
        available_balance = available_balance - ${amount},
        pending_balance = pending_balance + ${amount},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      transaction: transaction[0],
      message: 'Withdrawal request submitted. Processing may take 1-3 business days.'
    });

  } catch (error) {
    console.error('[Withdraw] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}
