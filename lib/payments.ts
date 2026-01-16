import { query } from "./db"
import { redis } from "./redis"

// Remove the conflicting Window interface declaration
// The global type is already defined in types/pi-sdk.d.ts

export interface PaymentFees {
  PURCHASE_FEE: number // 10%
  RESALE_FEE: number // 7.5%
  MINT_FEE: number // 5%
  MIN_ROYALTY: number // 5%
  MAX_ROYALTY: number // 15%
  CREATOR_AD_SHARE: number // 40%
}

export const FEES: PaymentFees = {
  PURCHASE_FEE: 0.1, // 10%
  RESALE_FEE: 0.075, // 7.5%
  MINT_FEE: 0.05, // 5%
  MIN_ROYALTY: 0.05, // 5%
  MAX_ROYALTY: 0.15, // 15%
  CREATOR_AD_SHARE: 0.4, // 40%
}

export async function calculatePurchaseFees(price: number) {
  const platformFee = price * FEES.PURCHASE_FEE
  const creatorEarnings = price - platformFee
  return {
    total: price,
    platformFee,
    creatorEarnings,
    breakdown: `${(FEES.PURCHASE_FEE * 100).toFixed(1)}% platform fee`,
  }
}

export async function calculateResaleFees(price: number, royaltyPercent: number) {
  const platformFee = price * FEES.RESALE_FEE
  const creatorRoyalty = price * (royaltyPercent / 100)
  const sellerEarnings = price - platformFee - creatorRoyalty
  return {
    total: price,
    platformFee,
    creatorRoyalty,
    sellerEarnings,
    breakdown: `${(FEES.RESALE_FEE * 100).toFixed(1)}% platform fee + ${royaltyPercent}% creator royalty`,
  }
}

export async function createPendingTransaction(
  type: string,
  fromUserId: string,
  toUserId: string,
  nftId: string | null,
  amount: number,
  metadata?: any,
) {
  const [tx] = await query<{ id: string }>(
    `INSERT INTO transactions (type, from_user_id, to_user_id, nft_id, amount, metadata, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING id`,
    [type, fromUserId, toUserId, nftId, amount, JSON.stringify(metadata || {})],
  )
  return tx.id
}

export async function verifyPaymentWithPi(paymentId: string): Promise<any> {
  // Call Pi Network API to verify payment
  const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
    headers: {
      Authorization: `Key ${process.env.PI_API_KEY}`,
    },
  })
  if (!response.ok) {
    throw new Error("Failed to verify payment with Pi Network")
  }
  return await response.json()
}

export async function approvePaymentWithPi(paymentId: string): Promise<void> {
  const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.PI_API_KEY}`,
    },
  })
  if (!response.ok) {
    throw new Error("Failed to approve payment")
  }
}

export async function completePaymentWithPi(paymentId: string, txid: string): Promise<void> {
  const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.PI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ txid }),
  })
  if (!response.ok) {
    throw new Error("Failed to complete payment")
  }
}

export async function updateWalletBalance(userId: string, amount: number, type: "add" | "subtract"): Promise<void> {
  const operator = type === "add" ? "+" : "-"
  await query(
    `UPDATE user_wallets
     SET available_balance = available_balance ${operator} $1,
         updated_at = NOW()
     WHERE user_id = $2`,
    [Math.abs(amount), userId],
  )
  // Invalidate cache
  await redis.del(`wallet:${userId}`)
}
