import { inngest } from "./client"
import { query } from "@/lib/db"
import { uploadToR2 } from "@/lib/r2-storage"
import { pinToIPFS } from "@/lib/ipfs"
import { FEES } from "@/lib/payments"

// Audio transcoding after upload
export const transcodeAudio = inngest.createFunction(
  { id: "transcode-audio", retries: 3 },
  { event: "audio.uploaded" },
  async ({ event, step }) => {
    const { nftId, audioBuffer } = event.data

    // Step 1: Convert to 3 qualities (placeholder - needs actual ffmpeg)
    const versions = await step.run("transcode", async () => {
      // In production, use ffmpeg to convert
      return {
        preview: audioBuffer, // 128kbps
        standard: audioBuffer, // 256kbps
        hq: audioBuffer, // 320kbps
      }
    })

    // Step 2: Upload to R2
    const urls = await step.run("upload-r2", async () => {
      return {
        preview: await uploadToR2(versions.preview, `audio/${nftId}-preview.mp3`, "audio/mpeg"),
        standard: await uploadToR2(versions.standard, `audio/${nftId}-standard.mp3`, "audio/mpeg"),
        hq: await uploadToR2(versions.hq, `audio/${nftId}-hq.mp3`, "audio/mpeg"),
      }
    })

    // Step 3: Pin to IPFS
    const ipfsHash = await step.run("pin-ipfs", async () => {
      return await pinToIPFS(versions.hq)
    })

    // Step 4: Update database
    await step.run("update-db", async () => {
      await query(
        `UPDATE nfts SET 
          audio_preview_url = $1,
          audio_standard_url = $2,
          audio_hq_url = $3,
          audio_ipfs_hash = $4,
          status = 'active',
          updated_at = NOW()
         WHERE id = $5`,
        [urls.preview, urls.standard, urls.hq, ipfsHash, nftId],
      )
    })
  },
)

// Distribute ad revenue (runs twice a month: 1st and 15th)
export const distributeAdRevenue = inngest.createFunction(
  { id: "distribute-ad-revenue" },
  { cron: "0 0 1,15 * *" }, // 1st and 15th of every month
  async ({ step }) => {
    const period = await step.run("get-period", async () => {
      const now = new Date()
      const isFirstHalf = now.getDate() === 1

      if (isFirstHalf) {
        // Previous month's second half
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 16)
        const end = new Date(now.getFullYear(), now.getMonth(), 0)
        return { start, end }
      } else {
        // Current month's first half
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 15)
        return { start, end }
      }
    })

    // Calculate distributions
    await step.run("calculate", async () => {
      // Get total ad revenue
      const [result] = await query<{ total: number }>(
        `SELECT COALESCE(SUM(revenue), 0) as total 
         FROM ad_impressions 
         WHERE created_at BETWEEN $1 AND $2`,
        [period.start, period.end],
      )

      const totalRevenue = result.total
      const creatorShare = totalRevenue * FEES.CREATOR_AD_SHARE // 40%

      // Get stream counts per creator
      const creators = await query<{ creator_id: string; stream_count: number }>(
        `SELECT n.creator_id, COUNT(s.id) as stream_count
         FROM stream_logs s
         JOIN nfts n ON s.nft_id = n.id
         JOIN users u ON s.user_id = u.id
         WHERE s.created_at BETWEEN $1 AND $2
           AND s.watched_ad = true
         GROUP BY n.creator_id`,
        [period.start, period.end],
      )

      const totalStreams = creators.reduce((sum, c) => sum + Number(c.stream_count), 0)

      // Distribute proportionally
      for (const creator of creators) {
        const creatorRevenue = (Number(creator.stream_count) / totalStreams) * creatorShare

        // Record distribution
        await query(
          `INSERT INTO ad_revenue_distributions 
           (creator_id, period_start, period_end, stream_count, revenue_share, status)
           VALUES ($1, $2, $3, $4, $5, 'paid')`,
          [creator.creator_id, period.start, period.end, creator.stream_count, creatorRevenue],
        )

        // Update wallet
        await query(
          `UPDATE user_wallets 
           SET available_balance = available_balance + $1,
               lifetime_earnings = lifetime_earnings + $1,
               updated_at = NOW()
           WHERE user_id = $2`,
          [creatorRevenue, creator.creator_id],
        )

        // Send notification
        await query(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES ($1, 'ad_revenue', 'Ad Revenue Earned', $2)`,
          [creator.creator_id, `You earned ${creatorRevenue.toFixed(2)}π from ad revenue this period!`],
        )
      }
    })
  },
)

// Blockchain sync (every 5 minutes)
export const syncBlockchain = inngest.createFunction(
  { id: "sync-blockchain" },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    await step.run("sync", async () => {
      // Sync blockchain state with database
      // This would query the Stellar blockchain for NFT events
      console.log("[v0] Blockchain sync running...")
    })
  },
)
