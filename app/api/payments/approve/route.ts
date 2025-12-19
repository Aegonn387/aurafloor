import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"
import { verifyPaymentWithPi, approvePaymentWithPi } from "@/lib/payments"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, transactionId } = await request.json()

    if (!paymentId || !transactionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get transaction from database
    const transaction = await queryOne(`SELECT * FROM transactions WHERE id = $1`, [transactionId])

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Verify payment with Pi Network
    const paymentDTO = await verifyPaymentWithPi(paymentId)

    // Validate amounts match
    if (paymentDTO.amount !== transaction.amount) {
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 })
    }

    // Approve with Pi Network
    await approvePaymentWithPi(paymentId)

    // Update transaction status
    await query(
      `UPDATE transactions 
       SET status = 'approved', pi_payment_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [paymentId, transactionId],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Payment approval failed:", error)
    return NextResponse.json({ error: "Payment approval failed" }, { status: 500 })
  }
}
