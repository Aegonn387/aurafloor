import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId, period } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const days = parseInt(period || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueByType = await sql`
      SELECT
        type,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM transactions
      WHERE to_user_id = ${userId}
        AND status = 'completed'
        AND created_at >= ${startDate}
      GROUP BY type
    `;

    const dailyRevenue = await sql`
      SELECT
        DATE(created_at) as date,
        type,
        SUM(amount) as amount
      FROM transactions
      WHERE to_user_id = ${userId}
        AND status = 'completed'
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at), type
      ORDER BY date DESC
    `;

    const adRevenueHistory = await sql`
      SELECT
        period_start,
        period_end,
        stream_count,
        ad_impressions,
        revenue_share,
        status,
        paid_at
      FROM ad_revenue_distributions
      WHERE creator_id = ${userId}
        AND period_start >= ${startDate}
      ORDER BY period_start DESC
    `;

    const totals = {
      total_revenue: revenueByType.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0),
      transaction_count: revenueByType.reduce((sum, r) => sum + parseInt(r.transaction_count || 0), 0)
    };

    return NextResponse.json({
      success: true,
      revenue: {
        by_type: revenueByType,
        daily: dailyRevenue,
        ad_revenue: adRevenueHistory,
        totals
      }
    });

  } catch (error) {
    console.error('[Revenue History] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue history' },
      { status: 500 }
    );
  }
}
