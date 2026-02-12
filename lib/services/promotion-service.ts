import { sql } from '@/lib/db'

export class PromotionService {
  async createPromotion(data: any) {
    try {
      const result = await sql`
        INSERT INTO p (nid, tid, title, descr, budget, cpc, st, startd, endd, crid, pid)
        VALUES (${data.nftId}, ${data.type}, ${data.title}, ${data.description}, 
                ${data.budget}, ${data.cpc}, 'pending', ${data.startDate}, 
                ${data.endDate}, ${data.creatorId}, ${data.paymentId})
        RETURNING *
      `
      return result[0]
    } catch (error) {
      console.error('[PromotionService] Error creating promotion:', error)
      throw error
    }
  }

  async trackImpression(promotionId: string, userId: string) {
    try {
      await sql`
        INSERT INTO pci (pid, uid, ca)
        VALUES (${promotionId}, ${userId}, NOW())
      `
      await sql`UPDATE p SET imp = imp + 1 WHERE id = ${promotionId}`
    } catch (error) {
      console.error('[PromotionService] Error tracking impression:', error)
    }
  }

  async trackClick(promotionId: string, userId: string, cost: number) {
    try {
      await sql`
        INSERT INTO pc (pid, uid, cost, ca)
        VALUES (${promotionId}, ${userId}, ${cost}, NOW())
      `
      await sql`
        UPDATE p SET clicks = clicks + 1, spent = spent + ${cost}
        WHERE id = ${promotionId}
      `
      const result = await sql`SELECT spent, budget FROM p WHERE id = ${promotionId}`
      if (result[0] && result[0].spent >= result[0].budget) {
        await sql`UPDATE p SET st = 'depleted' WHERE id = ${promotionId}`
      }
    } catch (error) {
      console.error('[PromotionService] Error tracking click:', error)
    }
  }

  async activatePromotion(promotionId: string) {
    try {
      await sql`UPDATE p SET st = 'active' WHERE id = ${promotionId}`
    } catch (error) {
      console.error('[PromotionService] Error activating promotion:', error)
      throw error
    }
  }

  async getPromotionStats(promotionId: string) {
    try {
      const result = await sql`
        SELECT p.*, 
        CASE WHEN p.imp > 0 THEN (p.clicks::float / p.imp::float * 100) ELSE 0 END as ctr
        FROM p WHERE id = ${promotionId}
      `
      return result[0]
    } catch (error) {
      console.error('[PromotionService] Error getting promotion stats:', error)
      return null
    }
  }

  async getCreatorPromotions(creatorId: string) {
    try {
      const result = await sql`
        SELECT p.*, n.title as nft_title
        FROM p JOIN n ON p.nid = n.id
        WHERE p.crid = ${creatorId}
        ORDER BY p.ca DESC
      `
      return result
    } catch (error) {
      console.error('[PromotionService] Error getting creator promotions:', error)
      return []
    }
  }

  async getActiveCampaigns(options: any) {
    try {
      const { limit = 10 } = options
      const result = await sql`
        SELECT p.*, n.title as nft_title, n.cimg as nft_image
        FROM p 
        JOIN n ON p.nid = n.id
        WHERE p.st = 'active'
          AND p.startd <= NOW()
          AND p.endd >= NOW()
          AND p.spent < p.budget
        ORDER BY (p.spent / NULLIF(p.budget, 0)) ASC
        LIMIT ${limit}
      `
      return result
    } catch (error) {
      console.error('[PromotionService] Error getting active campaigns:', error)
      return []
    }
  }
}

export const promotionService = new PromotionService()
