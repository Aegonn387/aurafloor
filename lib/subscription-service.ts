import { getTierConfig, type SubscriptionTierId } from '@/lib/subscription-config';

export type AudioQuality = '128kbps' | '256kbps' | '320kbps';

function getUserTier(user: any): SubscriptionTierId {
  if (!user) return 'collector_free';
  if (typeof user.subscription === 'string') {
    const t = user.subscription as string;
    if (t === 'premium' || t === 'premium_plus' || t === 'pro' || t === 'circle' || t === 'free') {
      return user.role === 'creator' ? (`creator_${t}` as any) : (`collector_${t}` as any);
    }
    return user.role === 'creator' ? 'creator_free' : 'collector_free';
  }
  if (user.subscription?.tier) return user.subscription.tier as SubscriptionTierId;
  return user.role === 'creator' ? 'creator_free' : 'collector_free';
}

class SubscriptionServiceClass {
  getAudioQuality(user?: any): AudioQuality {
    const tier = getUserTier(user);
    const config = getTierConfig(tier);
    if (!config) return '128kbps';
    if (config.role === 'creator') return '128kbps';
    if (config.streamingBitrate >= 320) return '320kbps';
    if (config.streamingBitrate >= 256) return '256kbps';
    return '128kbps';
  }

  canSkipAds(user?: any): boolean {
    const tier = getUserTier(user);
    const config = getTierConfig(tier);
    return config ? !config.ads : false;
  }

  getMaxBitrate(user?: any): number {
    const tier = getUserTier(user);
    const config = getTierConfig(tier);
    return config?.streamingBitrate ?? 128;
  }

  getMarketplaceFee(user?: any): number {
    const tier = getUserTier(user);
    const config = getTierConfig(tier);
    return config?.marketplaceFeePercent ?? 2.5;
  }

  getMintingFee(user?: any): number {
    const tier = getUserTier(user);
    const config = getTierConfig(tier);
    return config?.mintingFeePercent ?? 10;
  }
}

export const subscriptionService = new SubscriptionServiceClass();
export const SubscriptionService = subscriptionService;
