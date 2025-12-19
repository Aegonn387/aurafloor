import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"
import { createPendingTransaction } from "@/lib/payments"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, toAddress } = await request.json()

    if (!amount || !toAddress || amount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal details" }, { status: 400 })
    }

    // Check balance
    const wallet = await queryOne<{ available_balance: number }>(
      `SELECT available_balance FROM user_wallets WHERE user_id = $1`,
      [user.id],
    )

    if (!wallet || wallet.available_balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Create withdrawal transaction
    const txId = await createPendingTransaction("withdrawal", user.id, user.id, null, amount, { toAddress })

    // Update balance (move to pending)
    await query(
      `UPDATE user_wallets 
       SET available_balance = available_balance - $1,
           pending_balance = pending_balance + $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [amount, user.id],
    )

    // In production: Process actual Pi Network withdrawal
    // For now, we'll simulate immediate completion
    setTimeout(async () => {
      await query(
        `UPDATE transactions SET status = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [txId],
      )

      await query(
        `UPDATE user_wallets 
         SET pending_balance = pending_balance - $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [amount, user.id],
      )
    }, 5000)

    return NextResponse.json({
      success: true,
      transactionId: txId,
      message: "Withdrawal initiated",
    })
  } catch (error) {
    console.error("[v0] Withdrawal failed:", error)
    return NextResponse.json({ error: "Withdrawal failed" }, { status: 500 })
  }
}
