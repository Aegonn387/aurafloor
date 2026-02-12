// netlify/functions/complete-subscription.ts
import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!);

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface CompleteSubscriptionRequest {
  paymentId: string;
  txid: string;
}

interface PendingSubscription {
  userId: number;
  tier: string;
  price: number;
  duration: number; // in days
}

async function verifyPiPayment(paymentId: string, txid: string) {
  const piApiKey = process.env.PI_API_KEY;
  if (!piApiKey) {
    throw new Error('PI_API_KEY environment variable is not set');
  }

  // Verify payment with Pi API
  const verifyUrl = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
  const verifyResponse = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${piApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ txid })
  });

  if (!verifyResponse.ok) {
    const errorText = await verifyResponse.text();
    throw new Error(`Pi payment verification failed: ${errorText}`);
  }

  // Get payment details
  const detailsResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
    headers: {
      'Authorization': `Key ${piApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!detailsResponse.ok) {
    throw new Error('Failed to fetch payment details');
  }

  return await detailsResponse.json();
}

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}') as CompleteSubscriptionRequest;
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Payment ID and txid are required' })
      };
    }

    console.log('[Complete Subscription] Processing subscription payment:', paymentId);

    // Get pending subscription from Redis
    const redisKey = `pending_sub:${paymentId}`;
    const pendingData = await redis.get(redisKey);
    
    if (!pendingData) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Subscription not found or expired' })
      };
    }

    const pending = JSON.parse(pendingData) as PendingSubscription;
    const { userId, tier, price, duration } = pending;

    console.log(`[Complete Subscription] Found pending subscription for user ${userId}, tier: ${tier}`);

    // Verify payment with Pi
    const paymentDetails = await verifyPiPayment(paymentId, txid);
    console.log('[Complete Subscription] Payment verified successfully');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    // Activate subscription in database
    await sql`
      UPDATE users
      SET
        subscription_tier = ${tier},
        subscription_expires_at = ${expiresAt.toISOString()},
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    console.log(`[Complete Subscription] Activated ${tier} subscription for user ${userId}`);

    // Record transaction
    await sql`
      INSERT INTO transactions (
        type,
        from_user_id,
        amount,
        status,
        pi_payment_id,
        blockchain_tx_hash,
        completed_at,
        created_at
      ) VALUES (
        'subscription',
        ${userId},
        ${price},
        'completed',
        ${paymentId},
        ${txid},
        NOW(),
        NOW()
      )
    `;

    // Update user wallet (deduct subscription cost)
    await sql`
      UPDATE user_wallets
      SET
        available_balance = available_balance - ${price},
        lifetime_spent = lifetime_spent + ${price},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    // Add subscription benefits based on tier
    if (tier === 'premium') {
      // Example: Add premium features
      await sql`
        UPDATE user_features
        SET
          max_uploads = 100,
          can_monetize = true,
          analytics_access = true,
          updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } else if (tier === 'pro') {
      await sql`
        UPDATE user_features
        SET
          max_uploads = 1000,
          can_monetize = true,
          analytics_access = true,
          priority_support = true,
          updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    }

    // Clean up Redis
    await redis.del(redisKey);

    // Optional: Send confirmation email or notification
    console.log('[Complete Subscription] Subscription completed successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        subscription: {
          tier,
          price,
          expiresAt: expiresAt.toISOString(),
          duration,
          userId
        },
        message: 'Subscription activated successfully!'
      })
    };

  } catch (error) {
    console.error('[Complete Subscription] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Subscription activation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
