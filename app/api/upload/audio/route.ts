import { NextResponse } from "next/server"
import { uploadToR2, getAudioKey } from "@/lib/r2-storage"
import { processAudioFile, extractAudioMetadata } from "@/lib/audio-processor"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const nftId = formData.get("nftId") as string

    if (!audioFile || !nftId) {
      return NextResponse.json({ error: "Missing audio file or NFT ID" }, { status: 400 })
    }

    // Extract metadata
    const metadata = await extractAudioMetadata(audioFile)

    // Process audio into multiple qualities
    const qualities = [
      { bitrate: "128k" as const, suffix: "preview" as const },
      { bitrate: "256k" as const, suffix: "standard" as const },
      { bitrate: "320k" as const, suffix: "hq" as const },
    ]

    const uploadPromises = qualities.map(async ({ bitrate, suffix }) => {
      const processed = await processAudioFile(audioFile, bitrate)
      const key = getAudioKey(nftId, suffix)

      const url = await uploadToR2(processed.buffer, key, "audio/mpeg", {
        nftId,
        quality: suffix,
        bitrate,
        duration: metadata.duration.toString(),
      })

      return { quality: suffix, url, bitrate, size: processed.size }
    })

    const results = await Promise.all(uploadPromises)

    return NextResponse.json({
      success: true,
      metadata,
      urls: {
        preview: results[0].url,
        standard: results[1].url,
        hq: results[2].url,
      },
      sizes: results.map((r) => ({ quality: r.quality, size: r.size })),
    })
  } catch (error) {
    console.error("[v0] Audio upload failed:", error)
    return NextResponse.json({ error: "Failed to upload audio" }, { status: 500 })
  }
}
