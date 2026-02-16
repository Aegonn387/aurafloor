import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// POST - Subscribe user to a plan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_pi_address, plan_name, payment_id, amount_pi } = body;

    if (!user_pi_address || !plan_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const plans = await sql`
      SELECT * FROM subscription_plans
      WHERE plan_name = ${plan_name} AND is_active = true
    `;

    if (plans.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid plan' 
      }, { status: 404 });
    }

    const plan = plans[0];
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const existing = await sql`
      SELECT * FROM user_subscriptions
      WHERE user_pi_address = ${user_pi_address}
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE user_subscriptions
        SET 
          plan_id = ${plan.id},
          tier = ${plan.tier},
          plan_type = ${plan.plan_type},
          status = 'active',
          expires_at = ${expiryDate.toISOString()},
          last_payment_amount = ${amount_pi || plan.price_pi},
          last_payment_date = NOW(),
          total_paid = total_paid + ${amount_pi || plan.price_pi},
          updated_at = NOW()
        WHERE user_pi_address = ${user_pi_address}
      `;
    } else {
      await sql`
        INSERT INTO user_subscriptions (
          user_pi_address, plan_id, tier, plan_type, status, expires_at,
          last_payment_amount, last_payment_date, total_paid
        ) VALUES (
          ${user_pi_address}, ${plan.id}, ${plan.tier}, ${plan.plan_type}, 'active',
          ${expiryDate.toISOString()}, ${amount_pi || plan.price_pi}, NOW(), ${amount_pi || plan.price_pi}
        )
      `;
    }

    const subscription = await sql`SELECT id FROM user_subscriptions WHERE user_pi_address = ${user_pi_address}`;

    await sql`
      INSERT INTO subscription_transactions (
        subscription_id, user_pi_address, plan_id, amount_pi, transaction_type, payment_id, status, metadata
      ) VALUES (
        ${subscription[0].id}, ${user_pi_address}, ${plan.id}, ${amount_pi || plan.price_pi}, 'payment', ${payment_id || null}, 'completed', ${JSON.stringify({ plan_name })}
      )
    `;

    return NextResponse.json({ 
      success: true,
      message: `Subscribed to ${plan_name}`,
      subscription: { tier: plan.tier, expires_at: expiryDate.toISOString() }
    });

  } catch (error) {
    console.error('Subscription update failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update subscription' }, { status: 500 });
  }
}

// GET - Get user's subscription (auto-create free tier if none exists)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_pi_address = searchParams.get('user_pi_address');

    if (!user_pi_address) {
      return NextResponse.json({ success: false, error: 'User address required' }, { status: 400 });
    }

    let subscriptions = await sql`
      SELECT 
        us.*,
        sp.plan_name,
        sp.price_pi,
        sp.has_analytics,
        sp.has_priority_support,
        sp.has_early_access,
        sp.has_ad_free,
        sp.max_nfts_per_month,
        sp.commission_rate
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_pi_address = ${user_pi_address}
    `;

    // AUTO-CREATE FREE TIER IF NONE EXISTS
    if (subscriptions.length === 0) {
      const userRole = searchParams.get('role') || 'collector';
      const freePlanName = userRole === 'creator' ? 'Creator Free' : 'Collector Free';
      
      const freePlan = await sql`
        SELECT * FROM subscription_plans WHERE plan_name = ${freePlanName} LIMIT 1
      `;

      if (freePlan.length > 0) {
        await sql`
          INSERT INTO user_subscriptions (
            user_pi_address, plan_id, tier, plan_type, status, total_paid
          ) VALUES (
            ${user_pi_address}, ${freePlan[0].id}, 'free', ${userRole}, 'active', 0
          )
        `;

        subscriptions = await sql`
          SELECT 
            us.*,
            sp.plan_name,
            sp.price_pi,
            sp.has_analytics,
            sp.has_priority_support,
            sp.has_early_access,
            sp.has_ad_free,
            sp.max_nfts_per_month,
            sp.commission_rate
          FROM user_subscriptions us
          LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
          WHERE us.user_pi_address = ${user_pi_address}
        `;
      }
    }

    return NextResponse.json({ 
      success: true,
      subscription: subscriptions[0] || {
        tier: 'free',
        plan_type: 'collector',
        status: 'active',
        commission_rate: 10,
        has_analytics: false,
        has_priority_support: false,
        has_early_access: false,
        has_ad_free: false
      }
    });

  } catch (error) {
    console.error('Failed to get subscription:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
