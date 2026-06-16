export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { fromUserId, toUserId, amount, nftId, piPaymentId } = await request.json();

    if (!fromUserId || !toUserId || !amount) {
      return NextResponse.json(
        { error: 'From User, To User, and Amount are required' },
        { status: 400 }
      );
    }

    if (amount < 0.1) {
      return NextResponse.json(
        { error: 'Minimum tip amount is 0.1π' },
        { status: 400 }
      );
    }

    const wallet = await sql`
      SELECT available_balance FROM user_wallets
      WHERE user_id = ${fromUserId}
    `;

    if (wallet.length === 0 || parseFloat(wallet[0].available_balance) < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    const transaction = await sql`
      INSERT INTO transactions (
        type, from_user_id, to_user_id, nft_id,
        amount, status, pi_payment_id
      ) VALUES (
        'tip',
        ${fromUserId},
        ${toUserId},
        ${nftId || null},
        ${amount},
        'pending',
        ${piPaymentId}
      )
      RETURNING *
    `;

    await sql`
      UPDATE user_wallets
      SET
        available_balance = available_balance - ${amount},
        lifetime_spent = lifetime_spent + ${amount},
        updated_at = NOW()
      WHERE user_id = ${fromUserId}
    `;

    await sql`
      UPDATE user_wallets
      SET
        available_balance = available_balance + ${amount},
        lifetime_earnings = lifetime_earnings + ${amount},
        updated_at = NOW()
      WHERE user_id = ${toUserId}
    `;

    await sql`
      INSERT INTO ledger_entries (transaction_id, user_id, account_type, amount, description)
      VALUES
        (${transaction[0].id}, ${fromUserId}, 'wallet', ${-amount}, 'Tip sent'),
        (${transaction[0].id}, ${toUserId}, 'wallet', ${amount}, 'Tip received')
    `;

    return NextResponse.json({
      success: true,
      transaction: transaction[0],
      message: 'Tip sent successfully'
    });

  } catch (error) {
    console.error('[Tip] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send tip' },
      { status: 500 }
    );
  }
}
