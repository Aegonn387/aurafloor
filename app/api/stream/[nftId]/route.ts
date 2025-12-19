import { NextResponse } from "next/server"
import { getSignedStreamUrl, getAudioKey, type AudioQuality } from "@/lib/r2-storage"

export async function GET(request: Request, { params }: { params: { nftId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // In production, get user from session
    // const user = await getUserFromSession(request)

    // Mock user data for demo
    const user = {
      id: userId || "demo-user",
      subscriptionTier: "free" as "free" | "premium",
      ownedNFTs: [] as string[],
    }

    // Determine audio quality based on user tier
    let quality: AudioQuality
    let hasAds = false

    const ownsNFT = user.ownedNFTs.includes(params.nftId)

    if (ownsNFT) {
      // Owner gets highest quality, no ads
      quality = "hq"
      hasAds = false
    } else if (user.subscriptionTier === "premium") {
      // Premium subscriber gets standard quality, no ads
      quality = "standard"
      hasAds = false
    } else {
      // Free tier gets preview with ads
      quality = "preview"
      hasAds = true
    }

    const audioKey = getAudioKey(params.nftId, quality)
    const streamUrl = await getSignedStreamUrl(audioKey, 3600) // 1 hour expiry

    // Track stream for analytics and ad revenue
    if (hasAds) {
      // In production, track ad impression
      console.log("[v0] Tracking ad impression for NFT:", params.nftId)
    }

    return NextResponse.json({
      streamUrl,
      quality: quality === "hq" ? "320kbps" : quality === "standard" ? "256kbps" : "128kbps",
      hasAds,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error("[v0] Stream URL generation failed:", error)
    return NextResponse.json({ error: "Failed to generate stream URL" }, { status: 500 })
  }
}
