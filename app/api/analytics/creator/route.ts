// app/api/analytics/creator/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: NextRequest) {
  try {
    // Initialize database connection INSIDE the function
    const sql = neon(process.env.DATABASE_URL!);
    
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    
    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: 'Creator ID is required' },
        { status: 400 }
      );
    }
    
    // Your analytics queries here
    const revenueData = await sql`
      SELECT SUM(amount) as total_revenue
      FROM payments 
      WHERE creator_id = ${creatorId}
        AND status = 'completed'
    `;
    
    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: revenueData[0]?.total_revenue || 0,
        creatorId
      }
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
