import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';

const sql = neon(process.env.DATABASE_URL!);
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface CompleteSubscriptionRequest {
  paymentId: string;
  txid: string;
}

interface PendingSubscription {
  user_pi_address: string;
  plan_name: string;
  price: number;
  duration_days: number;
  role: 'collector' | 'creator';
}

async function verifyPiPayment(paymentId: string, txid: string) {
  const piApiKey = process.env.PI_API_KEY;
  if (!piApiKey) {
    throw new Error('PI_API_KEY environment variable is not set');
  }

  const completeUrl = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
  const completeResponse = await fetch(completeUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${piApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ txid }),
  });

  if (!completeResponse.ok) {
    const errorText = await completeResponse.text();
    throw new Error(`Pi payment completion failed: ${errorText}`);
  }

  const detailsUrl = `https://api.minepi.com/v2/payments/${paymentId}`;
  const detailsResponse = await fetch(detailsUrl, {
    headers: {
      'Authorization': `Key ${piApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!detailsResponse.ok) {
    throw new Error('Failed to fetch payment details after completion');
  }

  return await detailsResponse.json();
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as CompleteSubscriptionRequest;
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Payment ID and txid are required' }),
      };
    }

    console.log('[Complete Subscription] Processing:', paymentId);

    const redisKey = `pending_sub:${paymentId}`;
    const pendingData = await redis.get(redisKey);

    if (!pendingData) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Pending subscription not found or expired' }),
      };
    }

    const pending = JSON.parse(pendingData) as PendingSubscription;
    const { user_pi_address, plan_name, price, duration_days, role } = pending;

    console.log(`[Complete Subscription] Found pending: user=${user_pi_address}, plan=${plan_name}, role=${role}`);

    await verifyPiPayment(paymentId, txid);
    console.log('[Complete Subscription] Payment verified successfully');

    const plans = await sql`
      SELECT id, tier, commission_rate, has_analytics, max_nfts_per_month
      FROM subscription_plans
      WHERE plan_name = ${plan_name}
        AND plan_type = ${role}
        AND is_active = true
      LIMIT 1
    `;

    if (plans.length === 0) {
      throw new Error(`Active plan not found: ${plan_name} for role ${role}`);
    }

    const plan = plans[0];

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration_days);

    const existing = await sql`
      SELECT id FROM user_subscriptions
      WHERE user_pi_address = ${user_pi_address}
    `;

    let subscriptionId: string;
    if (existing.length > 0) {
      const result = await sql`
        UPDATE user_subscriptions
        SET
          plan_id = ${plan.id},
          tier = ${plan.tier},
          plan_type = ${role},
          status = 'active',
          expires_at = ${expiresAt.toISOString()},
          last_payment_amount = ${price},
          last_payment_date = NOW(),
          total_paid = total_paid + ${price},
          updated_at = NOW()
        WHERE user_pi_address = ${user_pi_address}
        RETURNING id
      `;
      subscriptionId = result[0].id;
    } else {
      const result = await sql`
        INSERT INTO user_subscriptions (
          user_pi_address, plan_id, tier, plan_type, status, expires_at,
          last_payment_amount, last_payment_date, total_paid, created_at, updated_at
        ) VALUES (
          ${user_pi_address}, ${plan.id}, ${plan.tier}, ${role}, 'active',
          ${expiresAt.toISOString()}, ${price}, NOW(), ${price}, NOW(), NOW()
        )
        RETURNING id
      `;
      subscriptionId = result[0].id;
    }

    await sql`
      INSERT INTO subscription_transactions (
        subscription_id, user_pi_address, plan_id, amount_pi, transaction_type,
        payment_id, status, metadata, created_at
      ) VALUES (
        ${subscriptionId}, ${user_pi_address}, ${plan.id}, ${price}, 'payment',
        ${paymentId}, 'completed', ${JSON.stringify({ plan_name, role })}, NOW()
      )
    `;

    await sql`
      UPDATE u
      SET
        subtier = ${plan.tier},
        subexp = ${expiresAt.toISOString()}
      WHERE piaddr = ${user_pi_address}
    `;

    await redis.del(redisKey);

    console.log('[Complete Subscription] Successfully activated subscription');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        subscription: {
          tier: plan.tier,
          expires_at: expiresAt.toISOString(),
          plan_name,
        },
      }),
    };
  } catch (error) {
    console.error('[Complete Subscription] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        error: 'Subscription activation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
