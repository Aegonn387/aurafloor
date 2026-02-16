import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await context.params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';
    const user_pi_address = searchParams.get('user_pi_address');

    // CHECK SUBSCRIPTION TIER - ENFORCE ANALYTICS ACCESS
    if (user_pi_address) {
      const subscription = await sql`
        SELECT 
          us.tier,
          sp.has_analytics
        FROM user_subscriptions us
        LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_pi_address = ${user_pi_address}
        LIMIT 1
      `;

      // Block free users from accessing analytics
      if (subscription.length > 0 && !subscription[0].has_analytics) {
        return NextResponse.json({
          success: false,
          error: 'Analytics access requires Premium or Premium+ subscription',
          upgrade_required: true,
          current_tier: subscription[0].tier
        }, { status: 403 });
      }
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await sql`
      SELECT
        COUNT(DISTINCT n.id) as total_nfts,
        COUNT(DISTINCT no.id) as total_sales,
        COALESCE(SUM(no.purchase_price), 0) as total_revenue,
        COALESCE(SUM(n.play_count), 0) as total_plays,
        COALESCE(SUM(n.like_count), 0) as total_likes
      FROM nfts n
      LEFT JOIN nft_ownership no ON n.id = no.nft_id
      WHERE n.creator_id = ${creatorId}
        AND n.created_at >= ${startDate}
    `;

    const revenueBreakdown = await sql`
      SELECT
        t.type,
        COUNT(*) as count,
        SUM(t.amount) as total
      FROM transactions t
      WHERE t.to_user_id = ${creatorId}
        AND t.status = 'completed'
        AND t.created_at >= ${startDate}
      GROUP BY t.type
    `;

    const topNFTs = await sql`
      SELECT
        id, title, cover_image_url, price,
        play_count, like_count, sold_count
      FROM nfts
      WHERE creator_id = ${creatorId}
      ORDER BY play_count DESC
      LIMIT 5
    `;

    const streamStats = await sql`
      SELECT
        DATE(sl.created_at) as date,
        COUNT(*) as streams,
        COUNT(DISTINCT sl.user_id) as unique_listeners
      FROM stream_logs sl
      JOIN nfts n ON sl.nft_id = n.id
      WHERE n.creator_id = ${creatorId}
        AND sl.created_at >= ${startDate}
      GROUP BY DATE(sl.created_at)
      ORDER BY date DESC
    `;

    const adRevenue = await sql`
      SELECT
        COALESCE(SUM(revenue_share), 0) as total_ad_revenue,
        COUNT(*) as periods_paid
      FROM ad_revenue_distributions
      WHERE creator_id = ${creatorId}
        AND period_start >= ${startDate}
    `;

    return NextResponse.json({
      success: true,
      analytics: {
        summary: stats[0],
        revenue_breakdown: revenueBreakdown,
        top_nfts: topNFTs,
        stream_stats: streamStats,
        ad_revenue: adRevenue[0]
      }
    });

  } catch (error) {
    console.error('[Creator Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
