import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { creatorId, userId, amount, message } = await request.json()

    const tipTransaction = {
      id: crypto.randomUUID(),
      type: "tip",
      from_user_id: userId,
      to_user_id: creatorId,
      amount, // 100% goes to creator
      platform_fee: 0, // No platform fee on tips
      message,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Tip transaction created:", tipTransaction)

    return NextResponse.json({
      success: true,
      transactionId: tipTransaction.id,
      breakdown: {
        total: amount,
        creatorReceives: amount,
        platformFee: 0,
      },
    })
  } catch (error) {
    console.error("[v0] Tip failed:", error)
    return NextResponse.json({ error: "Tip failed" }, { status: 500 })
  }
}
