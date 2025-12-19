import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, title, price, editionType, totalEditions, royaltyPercent } = await request.json()

    // Validate royalty percentage (5-15%)
    const validatedRoyalty = Math.max(5, Math.min(15, royaltyPercent || 10))

    const mintingFee = price * 0.05 // 5% minting fee
    const creatorReceives = price - mintingFee

    const mintTransaction = {
      id: crypto.randomUUID(),
      type: "mint",
      creator_id: userId,
      title,
      price,
      minting_fee: mintingFee,
      creator_receives: creatorReceives,
      edition_type: editionType,
      total_editions: totalEditions,
      royalty_percent: validatedRoyalty,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Mint transaction created:", mintTransaction)

    return NextResponse.json({
      success: true,
      transactionId: mintTransaction.id,
      breakdown: {
        mintingFee,
        royaltyPercent: validatedRoyalty,
      },
    })
  } catch (error) {
    console.error("[v0] Minting failed:", error)
    return NextResponse.json({ error: "Minting failed" }, { status: 500 })
  }
}
