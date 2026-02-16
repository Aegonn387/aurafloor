import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// GET - Fetch aggregate stats for GhostMode
export async function GET() {
  try {
    // Get total users (from authorized_creators as proxy)
    const userStats = await sql`
      SELECT COUNT(*) as total_users
      FROM authorized_creators
    `;

    // Get blog stats
    const blogStats = await sql`
      SELECT
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE is_published = true) as published_posts,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_posts
      FROM blog_posts
    `;

    // Get creator applications stats
    const creatorStats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_apps,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_apps,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_apps
      FROM creator_applications
    `;

    // Get authorized creators count
    const creatorsCount = await sql`
      SELECT COUNT(*) as total_creators
      FROM authorized_creators
      WHERE is_active = true
    `;

    // Get subscription stats
    const subscriptionStats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE tier = 'free') as free_users,
        COUNT(*) FILTER (WHERE tier = 'premium') as premium_users,
        COUNT(*) FILTER (WHERE tier = 'premium_plus') as premium_plus_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
        COALESCE(SUM(total_paid), 0) as total_subscription_revenue
      FROM user_subscriptions
    `;

    const subStats = subscriptionStats[0];

    // Aggregate all stats
    const stats = {
      // Users
      total_users: parseInt(userStats[0]?.total_users || '0'),
      new_users_today: 0,
      active_users_today: 0,

      // NFTs
      total_nfts_minted: 0,
      nfts_minted_today: 0,
      total_nft_sales: 0,
      nft_sales_today: 0,

      // Streams
      total_streams: 0,
      streams_today: 0,

      // Community
      total_posts: parseInt(blogStats[0]?.total_posts || '0'),
      posts_today: 0,
      total_comments: 0,

      // Financial
      total_volume_pi: 0,
      volume_today_pi: 0,

      // Blockchain
      total_transactions: 0,
      transactions_today: 0,

      // Content Creators
      pending_creator_apps: parseInt(creatorStats[0]?.pending_apps || '0'),
      total_creators: parseInt(creatorsCount[0]?.total_creators || '0'),

      // Blog
      blog_posts: parseInt(blogStats[0]?.published_posts || '0'),
      featured_posts: parseInt(blogStats[0]?.featured_posts || '0'),

      // Subscription-specific fields
      free_users: parseInt(subStats?.free_users || '0'),
      premium_users: parseInt(subStats?.premium_users || '0'),
      premium_plus_users: parseInt(subStats?.premium_plus_users || '0'),
      active_subscriptions: parseInt(subStats?.active_subscriptions || '0'),
      subscription_revenue: parseFloat(subStats?.total_subscription_revenue || '0'),
    };

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 });
  }
}
