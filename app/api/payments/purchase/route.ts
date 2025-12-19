import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { nftId, userId, price } = await request.json()

    // Calculate fees based on new structure
    const platformFee = price * 0.1 // 10% platform fee on primary purchase
    const creatorEarnings = price * 0.9 // 90% to creator

    // Create transaction record
    const transaction = {
      id: crypto.randomUUID(),
      type: "purchase",
      nft_id: nftId,
      buyer_id: userId,
      amount: price,
      platform_fee: platformFee,
      creator_earnings: creatorEarnings,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Purchase transaction created:", transaction)

    // In production: Store in database
    // await db.transactions.create(transaction)

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      breakdown: {
        total: price,
        platformFee,
        creatorEarnings,
      },
    })
  } catch (error) {
    console.error("[v0] Purchase failed:", error)
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 })
  }
}
