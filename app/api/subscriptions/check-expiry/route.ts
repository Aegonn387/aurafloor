import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// GET - Check and auto-downgrade expired subscriptions
export async function GET() {
  try {
    const now = new Date().toISOString();

    // Find all expired subscriptions
    const expiredSubs = await sql`
      SELECT 
        us.id,
        us.user_pi_address,
        us.tier,
        us.plan_type,
        us.expires_at,
        sp.plan_name
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.status = 'active'
      AND us.tier != 'free'
      AND us.expires_at < ${now}
    `;

    if (expiredSubs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired subscriptions found',
        expired_count: 0
      });
    }

    // Downgrade each expired subscription to free tier
    const downgraded = [];

    for (const sub of expiredSubs) {
      // Get the free plan for this user type
      const freePlanName = sub.plan_type === 'creator' ? 'Creator Free' : 'Collector Free';
      
      const freePlan = await sql`
        SELECT * FROM subscription_plans
        WHERE plan_name = ${freePlanName}
        LIMIT 1
      `;

      if (freePlan.length > 0) {
        // Update subscription to free tier
        await sql`
          UPDATE user_subscriptions
          SET 
            plan_id = ${freePlan[0].id},
            tier = 'free',
            status = 'expired',
            updated_at = NOW()
          WHERE id = ${sub.id}
        `;

        downgraded.push({
          user: sub.user_pi_address,
          from: sub.plan_name,
          to: freePlanName,
          expired_at: sub.expires_at
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${downgraded.length} subscriptions downgraded to free tier`,
      expired_count: expiredSubs.length,
      downgraded: downgraded
    });

  } catch (error) {
    console.error('Expiry check failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check expiry' 
    }, { status: 500 });
  }
}

// POST - Manually check a specific user's subscription
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

    const now = new Date().toISOString();

    const subscription = await sql`
      SELECT 
        us.*,
        sp.plan_name
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_pi_address = ${user_pi_address}
      LIMIT 1
    `;

    if (subscription.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No subscription found' 
      }, { status: 404 });
    }

    const sub = subscription[0];

    // Check if expired
    if (sub.tier !== 'free' && sub.expires_at && new Date(sub.expires_at) < new Date()) {
      // Downgrade to free
      const freePlanName = sub.plan_type === 'creator' ? 'Creator Free' : 'Collector Free';
      
      const freePlan = await sql`
        SELECT * FROM subscription_plans
        WHERE plan_name = ${freePlanName}
        LIMIT 1
      `;

      if (freePlan.length > 0) {
        await sql`
          UPDATE user_subscriptions
          SET 
            plan_id = ${freePlan[0].id},
            tier = 'free',
            status = 'expired',
            updated_at = NOW()
          WHERE user_pi_address = ${user_pi_address}
        `;

        return NextResponse.json({
          success: true,
          message: 'Subscription expired and downgraded to free tier',
          was_expired: true,
          old_plan: sub.plan_name,
          new_plan: freePlanName
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription is still active',
      was_expired: false,
      plan: sub.plan_name,
      expires_at: sub.expires_at
    });

  } catch (error) {
    console.error('Manual expiry check failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check expiry' 
    }, { status: 500 });
  }
}
