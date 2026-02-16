// Utility to check if user's subscription tier allows a feature

export interface SubscriptionCheck {
  allowed: boolean;
  reason?: string;
  upgrade_required?: string;
}

export async function checkSubscriptionTier(
  userPiAddress: string,
  feature: 'mint' | 'analytics' | 'priority_support' | 'early_access' | 'ad_free'
): Promise<SubscriptionCheck> {
  try {
    const response = await fetch(`/api/subscription/update?user_pi_address=${userPiAddress}`);
    const data = await response.json();

    if (!data.success) {
      return { allowed: false, reason: 'Could not verify subscription' };
    }

    const sub = data.subscription;

    // Check feature access
    switch (feature) {
      case 'mint':
        return { allowed: true }; // All tiers can mint (but limits differ)
      
      case 'analytics':
        if (!sub.has_analytics) {
          return { 
            allowed: false, 
            reason: 'Analytics requires Premium or Premium+ subscription',
            upgrade_required: 'premium'
          };
        }
        return { allowed: true };
      
      case 'priority_support':
        if (!sub.has_priority_support) {
          return { 
            allowed: false, 
            reason: 'Priority support requires Premium+ subscription',
            upgrade_required: 'premium_plus'
          };
        }
        return { allowed: true };
      
      case 'early_access':
        if (!sub.has_early_access) {
          return { 
            allowed: false, 
            reason: 'Early access requires Premium or Premium+ subscription',
            upgrade_required: 'premium'
          };
        }
        return { allowed: true };
      
      case 'ad_free':
        if (!sub.has_ad_free) {
          return { 
            allowed: false, 
            reason: 'Ad-free experience requires Premium or Premium+ subscription',
            upgrade_required: 'premium'
          };
        }
        return { allowed: true };
      
      default:
        return { allowed: false, reason: 'Unknown feature' };
    }
  } catch (error) {
    console.error('Subscription check failed:', error);
    return { allowed: false, reason: 'Subscription check failed' };
  }
}

export async function checkMintLimit(userPiAddress: string): Promise<{
  can_mint: boolean;
  mints_used: number;
  mints_allowed: number;
  unlimited: boolean;
}> {
  try {
    const response = await fetch(`/api/subscription/update?user_pi_address=${userPiAddress}`);
    const data = await response.json();

    if (!data.success) {
      return { can_mint: false, mints_used: 0, mints_allowed: 0, unlimited: false };
    }

    const sub = data.subscription;
    const maxMints = sub.max_nfts_per_month;

    // -1 means unlimited
    if (maxMints === -1) {
      return { can_mint: true, mints_used: 0, mints_allowed: -1, unlimited: true };
    }

    // Free tier (0 mints)
    if (maxMints === 0) {
      return { 
        can_mint: false, 
        mints_used: 0, 
        mints_allowed: 0, 
        unlimited: false 
      };
    }

    // TODO: Track actual mints this month from database
    // For now, allow if under limit
    const mintsUsed = 0; // Placeholder

    return {
      can_mint: mintsUsed < maxMints,
      mints_used: mintsUsed,
      mints_allowed: maxMints,
      unlimited: false
    };
  } catch (error) {
    console.error('Mint limit check failed:', error);
    return { can_mint: false, mints_used: 0, mints_allowed: 0, unlimited: false };
  }
}

export function getCommissionRate(tier: string): number {
  switch (tier) {
    case 'free':
      return 10.0;
    case 'premium':
    case 'premium_plus':
      return 5.0;
    default:
      return 10.0;
  }
}
