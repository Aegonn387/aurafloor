import { sql } from '@/lib/db'

export const homepageAggregator = {
  async getPromotedNFTs() {
    try {
      const result = await sql`
        SELECT n.*, u.dname as creator_name
        FROM p 
        JOIN n ON p.nid = n.id
        JOIN u ON n.crid = u.id
        WHERE p.st = 'active'
          AND p.startd <= NOW()
          AND p.endd >= NOW()
          AND p.spent < p.budget
        ORDER BY p.spent / p.budget ASC
        LIMIT 10
      `
      return result
    } catch (error) {
      console.error('[HomepageAggregator] Error getting promoted NFTs:', error)
      return []
    }
  },

  async getFeaturedNFTs() {
    try {
      const result = await sql`
        SELECT n.*, u.dname as creator_name,
               COUNT(DISTINCT l.id) as like_count,
               COUNT(DISTINCT sl.id) as stream_count
        FROM n
        JOIN u ON n.crid = u.id
        LEFT JOIN l ON n.id = l.nid
        LEFT JOIN sl ON n.id = sl.nid
        WHERE n.st = 'active'
        GROUP BY n.id, u.dname
        ORDER BY (COUNT(DISTINCT l.id) * 2 + COUNT(DISTINCT sl.id)) DESC
        LIMIT 10
      `
      return result
    } catch (error) {
      console.error('[HomepageAggregator] Error getting featured NFTs:', error)
      return []
    }
  },

  async getTrendingNFTs() {
    try {
      const result = await sql`
        SELECT n.*, u.dname as creator_name,
               COUNT(DISTINCT l.id) as like_count,
               COUNT(DISTINCT sl.id) as stream_count
        FROM n
        JOIN u ON n.crid = u.id
        LEFT JOIN l ON n.id = l.nid AND l.ca >= NOW() - INTERVAL '7 days'
        LEFT JOIN sl ON n.id = sl.nid AND sl.ca >= NOW() - INTERVAL '7 days'
        WHERE n.st = 'active'
          AND n.ca >= NOW() - INTERVAL '30 days'
        GROUP BY n.id, u.dname
        ORDER BY (COUNT(DISTINCT l.id) * 2 + COUNT(DISTINCT sl.id)) DESC
        LIMIT 10
      `
      return result
    } catch (error) {
      console.error('[HomepageAggregator] Error getting trending NFTs:', error)
      return []
    }
  },

  async updateHomepageCache() {
    const [promoted, featured, trending] = await Promise.all([
      this.getPromotedNFTs(),
      this.getFeaturedNFTs(),
      this.getTrendingNFTs(),
    ])
    return { promoted, featured, trending }
  }
}
