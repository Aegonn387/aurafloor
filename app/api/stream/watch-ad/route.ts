import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, nftId, creatorId } = await request.json()

    // Record ad impression
    const adImpression = {
      id: crypto.randomUUID(),
      user_id: userId,
      nft_id: nftId,
      creator_id: creatorId,
      ad_revenue: 0.01, // Example: 0.01π per ad view
      creator_cut: 0.004, // 40% to creator
      platform_cut: 0.006, // 60% to platform
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Ad impression recorded:", adImpression)

    // Grant temporary streaming access (30 minutes)
    const streamAccess = {
      userId,
      nftId,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      quality: "128kbps", // Free tier gets preview quality
    }

    return NextResponse.json({
      success: true,
      message: "Ad watched! You can now stream for 30 minutes",
      streamAccess,
      adImpression,
    })
  } catch (error) {
    console.error("[v0] Ad watch failed:", error)
    return NextResponse.json({ error: "Failed to process ad" }, { status: 500 })
  }
}
