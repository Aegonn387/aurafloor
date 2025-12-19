import { type NextRequest, NextResponse } from "next/server"
import { query, queryOne, transaction } from "@/lib/db"
import { completePaymentWithPi } from "@/lib/payments"
import { invalidateCache } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, transactionId } = await request.json()

    if (!paymentId || !transactionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use database transaction for atomicity
    await transaction(async () => {
      // Get transaction details
      const tx = await queryOne(`SELECT * FROM transactions WHERE id = $1`, [transactionId])

      if (!tx) {
        throw new Error("Transaction not found")
      }

      // Complete payment with Pi Network
      await completePaymentWithPi(paymentId, tx.id)

      // Update transaction status
      await query(
        `UPDATE transactions 
         SET status = 'completed', completed_at = NOW()
         WHERE id = $1`,
        [transactionId],
      )

      // Process based on transaction type
      if (tx.type === "purchase") {
        // Transfer NFT ownership
        await query(
          `UPDATE nfts SET current_owner_id = $1, sold_count = sold_count + 1 
           WHERE id = $2`,
          [tx.from_user_id, tx.nft_id],
        )

        await query(
          `INSERT INTO nft_ownership (nft_id, user_id, purchase_price)
           VALUES ($1, $2, $3)`,
          [tx.nft_id, tx.from_user_id, tx.amount],
        )

        // Update creator wallet (90% after 10% platform fee)
        const creatorEarnings = tx.amount - tx.platform_fee
        await query(
          `UPDATE user_wallets 
           SET available_balance = available_balance + $1,
               lifetime_earnings = lifetime_earnings + $1,
               updated_at = NOW()
           WHERE user_id = $2`,
          [creatorEarnings, tx.to_user_id],
        )

        // Create ledger entries
        await query(
          `INSERT INTO ledger_entries (transaction_id, user_id, account_type, amount, description)
           VALUES ($1, $2, 'wallet', $3, $4)`,
          [transactionId, tx.to_user_id, creatorEarnings, `NFT sale earnings (90%)`],
        )

        await query(
          `INSERT INTO ledger_entries (transaction_id, user_id, account_type, amount, description)
           VALUES ($1, NULL, 'platform_revenue', $2, $3)`,
          [transactionId, tx.platform_fee, `Platform fee (10%)`],
        )

        // Notify creator
        await query(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES ($1, 'sale', 'NFT Sold!', $2)`,
          [tx.to_user_id, `Your NFT was purchased for ${tx.amount}π`],
        )
      } else if (tx.type === "tip") {
        // Tips go 100% to creator
        await query(
          `UPDATE user_wallets 
           SET available_balance = available_balance + $1,
               lifetime_earnings = lifetime_earnings + $1,
               updated_at = NOW()
           WHERE user_id = $2`,
          [tx.amount, tx.to_user_id],
        )

        // Notify creator
        await query(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES ($1, 'tip', 'New Tip!', $2)`,
          [tx.to_user_id, `You received a ${tx.amount}π tip!`],
        )
      } else if (tx.type === "deposit") {
        // Add to user wallet
        await query(
          `UPDATE user_wallets 
           SET available_balance = available_balance + $1,
               updated_at = NOW()
           WHERE user_id = $2`,
          [tx.amount, tx.to_user_id],
        )
      }

      // Invalidate caches
      await invalidateCache(`wallet:${tx.from_user_id}`)
      await invalidateCache(`wallet:${tx.to_user_id}`)
      if (tx.nft_id) {
        await invalidateCache(`nft:${tx.nft_id}`)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Payment completion failed:", error)
    return NextResponse.json({ error: "Payment completion failed" }, { status: 500 })
  }
}
