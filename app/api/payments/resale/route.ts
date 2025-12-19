import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { nftId, sellerId, buyerId, price, creatorRoyaltyPercent } = await request.json()

    // Validate royalty percentage (5-15%)
    const royaltyPercent = Math.max(5, Math.min(15, creatorRoyaltyPercent || 10))

    // Calculate fees for resale
    const platformFee = price * 0.075 // 7.5% platform fee on resale
    const creatorRoyalty = price * (royaltyPercent / 100) // 5-15% creator royalty
    const sellerEarnings = price - platformFee - creatorRoyalty

    const transaction = {
      id: crypto.randomUUID(),
      type: "resale",
      nft_id: nftId,
      seller_id: sellerId,
      buyer_id: buyerId,
      amount: price,
      platform_fee: platformFee,
      creator_royalty: creatorRoyalty,
      seller_earnings: sellerEarnings,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Resale transaction created:", transaction)

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      breakdown: {
        total: price,
        platformFee,
        creatorRoyalty,
        sellerEarnings,
      },
    })
  } catch (error) {
    console.error("[v0] Resale failed:", error)
    return NextResponse.json({ error: "Resale failed" }, { status: 500 })
  }
}
