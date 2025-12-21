// inngest/functions.ts
import { inngest } from "@/inngest/client";
import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";

// Helper to send notifications
async function sendNotification(userId: string, type: string, title: string, message: string) {
  const notificationQuery = `
    INSERT INTO notifications (user_id, type, title, message, read, created_at)
    VALUES ($1, $2, $3, $4, false, NOW())
    RETURNING id
  `;
  return sql(notificationQuery, [userId, type, title, message]);
}

// Function 1: Transcode Audio
export const transcodeAudio = inngest.createFunction(
  { id: "transcode-audio" },
  { event: "audio/transcode.requested" },
  async ({ event, step }) => {
    try {
      const { audioId, userId } = event.data;
      
      // Send notification to user
      await sendNotification(
        userId,
        "audio_processing",
        "Audio Processing Started",
        "Your audio file is now being transcoded."
      );

      // Simulate transcoding process
      await step.run("transcode-audio-file", async () => {
        // Your audio transcoding logic here
        console.log(`Transcoding audio: ${audioId}`);
        return { status: "transcoding" };
      });

      // Update audio status
      const updateQuery = `
        UPDATE audio_files 
        SET status = 'processed', updated_at = NOW()
        WHERE id = $1
      `;
      await sql(updateQuery, [audioId]);

      // Send completion notification
      await sendNotification(
        userId,
        "audio_completed",
        "Audio Processing Complete",
        "Your audio file has been successfully transcoded."
      );

      return { success: true, audioId };
    } catch (error) {
      console.error("Transcode audio function error:", error);
      throw error;
    }
  }
);

// Function 2: Distribute Ad Revenue
export const distributeAdRevenue = inngest.createFunction(
  { id: "distribute-ad-revenue" },
  { event: "revenue/distribute.requested" },
  async ({ event, step }) => {
    try {
      const { campaignId, totalAmount } = event.data;

      // Get all participants for this campaign
      const participantsQuery = `
        SELECT user_id, share_percentage 
        FROM campaign_participants 
        WHERE campaign_id = $1
      `;
      const participants = await sql(participantsQuery, [campaignId]);

      // Distribute revenue to each participant
      for (const participant of participants) {
        await step.run(`distribute-to-${participant.user_id}`, async () => {
          const amount = totalAmount * (participant.share_percentage / 100);
          
          // Update user balance
          const updateBalanceQuery = `
            UPDATE users 
            SET balance = balance + $1, updated_at = NOW()
            WHERE id = $2
          `;
          await sql(updateBalanceQuery, [amount, participant.user_id]);

          // Log the transaction
          const logTransactionQuery = `
            INSERT INTO revenue_distributions 
            (user_id, campaign_id, amount, distributed_at)
            VALUES ($1, $2, $3, NOW())
          `;
          await sql(logTransactionQuery, [participant.user_id, campaignId, amount]);

          // Send notification
          await sendNotification(
            participant.user_id,
            "revenue_received",
            "Revenue Distributed",
            `You received $${amount.toFixed(2)} from campaign ${campaignId}`
          );
        });
      }

      // Mark campaign as distributed
      const updateCampaignQuery = `
        UPDATE campaigns 
        SET revenue_distributed = true, distribution_date = NOW()
        WHERE id = $1
      `;
      await sql(updateCampaignQuery, [campaignId]);

      return { success: true, campaignId, participants: participants.length };
    } catch (error) {
      console.error("Distribute ad revenue function error:", error);
      throw error;
    }
  }
);

// Function 3: Sync Blockchain
export const syncBlockchain = inngest.createFunction(
  { id: "sync-blockchain" },
  { event: "blockchain/sync.requested" },
  async ({ event, step }) => {
    try {
      const { chain, startBlock, endBlock } = event.data;

      // Sync blocks in batches
      let currentBlock = startBlock;
      while (currentBlock <= endBlock) {
        await step.run(`sync-block-${currentBlock}`, async () => {
          // Your blockchain sync logic here
          console.log(`Syncing block ${currentBlock} on ${chain}`);
          
          // Example: Sync transactions from this block
          const syncQuery = `
            INSERT INTO blockchain_transactions 
            (chain, block_number, transaction_hash, processed_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (chain, transaction_hash) DO NOTHING
          `;
          // This is a placeholder - you'd need to implement actual blockchain interaction
          
          return { block: currentBlock, status: "synced" };
        });
        currentBlock++;
      }

      // Update sync status
      const updateSyncQuery = `
        INSERT INTO blockchain_sync_status (chain, last_synced_block, synced_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (chain) DO UPDATE 
        SET last_synced_block = $2, synced_at = NOW()
      `;
      await sql(updateSyncQuery, [chain, endBlock]);

      return { success: true, chain, blocksSynced: endBlock - startBlock + 1 };
    } catch (error) {
      console.error("Sync blockchain function error:", error);
      throw error;
    }
  }
);

// NFT minted function
export const nftMinted = inngest.createFunction(
  { id: "nft-minted" },
  { event: "nft/minted" },
  async ({ event }) => {
    try {
      const { nftId, creatorId } = event.data;

      // Send notification to creator
      await sendNotification(
        creatorId,
        "nft_minted",
        "NFT Minted Successfully",
        "Your NFT has been minted and is now live on the marketplace."
      );

      // Update creator stats
      const updateStatsQuery = `
        UPDATE user_stats 
        SET nfts_minted = nfts_minted + 1, updated_at = NOW()
        WHERE user_id = $1
      `;
      await sql(updateStatsQuery, [creatorId]);

      // Invalidate cache
      await redis.del(`creator:${creatorId}:stats`);

      return { success: true, nftId };
    } catch (error) {
      console.error("NFT minted function error:", error);
      throw error;
    }
  }
);

// Payment completed function
export const paymentCompleted = inngest.createFunction(
  { id: "payment-completed" },
  { event: "payment/completed" },
  async ({ event }) => {
    try {
      const { paymentId, userId, amount } = event.data;

      // Send notification to user
      await sendNotification(
        userId,
        "payment_received",
        "Payment Received",
        `Your payment of $${amount} has been completed successfully.`
      );

      // Update user balance
      const updateBalanceQuery = `
        UPDATE users 
        SET balance = balance + $1, updated_at = NOW()
        WHERE id = $2
      `;
      await sql(updateBalanceQuery, [amount, userId]);

      // Log transaction
      const logTransactionQuery = `
        INSERT INTO transactions (user_id, type, amount, status, payment_id, created_at)
        VALUES ($1, 'credit', $2, 'completed', $3, NOW())
      `;
      await sql(logTransactionQuery, [userId, amount, paymentId]);

      return { success: true, paymentId };
    } catch (error) {
      console.error("Payment completed function error:", error);
      throw error;
    }
  }
);

// Daily analytics aggregation
export const dailyAnalytics = inngest.createFunction(
  { id: "daily-analytics" },
  { cron: "0 2 * * *" }, // Runs daily at 2 AM
  async () => {
    try {
      // Aggregate daily revenue
      const revenueQuery = `
        INSERT INTO daily_metrics (metric_date, total_revenue, nfts_minted, new_users)
        SELECT
          DATE(created_at) as metric_date,
          COALESCE(SUM(amount), 0) as total_revenue,
          COUNT(DISTINCT nft_id) as nfts_minted,
          COUNT(DISTINCT new_user_id) as new_users
        FROM (
          SELECT created_at, amount, NULL as nft_id, NULL as new_user_id
          FROM payments
          WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '1 day'
          UNION ALL
          SELECT created_at, NULL, id, NULL
          FROM nfts
          WHERE created_at >= NOW() - INTERVAL '1 day'
          UNION ALL
          SELECT created_at, NULL, NULL, id
          FROM users
          WHERE created_at >= NOW() - INTERVAL '1 day'
        ) daily_data
        GROUP BY DATE(created_at)
        ON CONFLICT (metric_date) DO UPDATE SET
          total_revenue = EXCLUDED.total_revenue,
          nfts_minted = EXCLUDED.nfts_minted,
          new_users = EXCLUDED.new_users,
          updated_at = NOW()
      `;
      await sql(revenueQuery, []);

      // Cleanup old cache
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const cachePattern = `analytics:*${yesterday.toISOString().split('T')[0]}*`;
      const keys = await redis.keys(cachePattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      return { success: true, message: "Daily analytics processed" };
    } catch (error) {
      console.error("Daily analytics function error:", error);
      throw error;
    }
  }
);
