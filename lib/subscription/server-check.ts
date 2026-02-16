import { queryWithRetry, sql } from '@/lib/db';

export async function getSubscription(userPiAddress: string) {
  try {
    const result = await queryWithRetry(() => sql`
      SELECT
        us.*,
        sp.plan_name,
        sp.commission_rate,
        sp.max_nfts_per_month,
        sp.has_analytics,
        sp.has_priority_support,
        sp.has_early_access,
        sp.has_ad_free
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_pi_address = ${userPiAddress}
      LIMIT 1
    `);

    if (result.length === 0) {
      // Return free tier
      return {
        tier: 'free',
        commission_rate: 10.0,
        max_nfts_per_month: 0,
        has_analytics: false,
        has_priority_support: false,
        has_early_access: false,
        has_ad_free: false
      };
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return null;
  }
}

export async function canMint(userPiAddress: string): Promise<boolean> {
  const sub = await getSubscription(userPiAddress);
  if (!sub) return false;

  // -1 = unlimited
  if (sub.max_nfts_per_month === -1) return true;

  // 0 = cannot mint
  if (sub.max_nfts_per_month === 0) return false;

  // TODO: Check actual mints this month from database
  return true;
}

export async function getCommissionRate(userPiAddress: string): Promise<number> {
  const sub = await getSubscription(userPiAddress);
  return sub?.commission_rate || 10.0;
}
