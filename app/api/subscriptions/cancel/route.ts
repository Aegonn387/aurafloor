import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_pi_address } = body;

    if (!user_pi_address) {
      return NextResponse.json({
        success: false,
        error: 'User address required'
      }, { status: 400 });
    }

    // Get current subscription to preserve role
    const currentSub = await sql`
      SELECT plan_type FROM user_subscriptions
      WHERE user_pi_address = ${user_pi_address}
      AND status = 'active'
      LIMIT 1
    `;

    const role = currentSub.length > 0 ? currentSub[0].plan_type : 'collector';
    const freePlanName = role === 'creator' ? 'Creator Free' : 'Collector Free';

    // Get free plan ID
    const freePlan = await sql`
      SELECT id FROM subscription_plans
      WHERE plan_name = ${freePlanName}
      LIMIT 1
    `;

    const freePlanId = freePlan.length > 0 ? freePlan[0].id : null;

    // Update subscription to free tier
    if (freePlanId) {
      await sql`
        UPDATE user_subscriptions
        SET plan_id = ${freePlanId},
            tier = 'free',
            status = 'active',
            expires_at = NULL,
            updated_at = NOW()
        WHERE user_pi_address = ${user_pi_address}
      `;
    } else {
      await sql`
        UPDATE user_subscriptions
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE user_pi_address = ${user_pi_address}
      `;
    }

    // Update u table to free tier
    await sql`
      UPDATE u
      SET subtier = 'free',
          subexp = NULL
      WHERE piaddr = ${user_pi_address}
    `;

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error: any) {
    console.error('Failed to cancel subscription:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    }, { status: 500 });
  }
}
