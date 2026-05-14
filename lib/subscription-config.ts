export type SubscriptionTierId =
  | 'collector_free'
  | 'collector_premium'
  | 'collector_premium_plus'
  | 'creator_free'
  | 'creator_pro'
  | 'creator_circle';

export interface TierConfig {
  id: SubscriptionTierId;
  name: string;
  role: 'collector' | 'creator';
  pricePi: number;
  priceAura: number;
  features: string[];
  streamingBitrate: number;
  ads: boolean;
  marketplaceFeePercent: number;
  mintingFeePercent?: number;
  bulkMintingLimit?: number | null;
  analytics?: 'basic' | 'advanced' | 'advanced_api';
  prioritySupport?: string | null;
}

const auraPrice = (piPrice: number) => Math.round((piPrice * 0.9) * 100) / 100;

export const SUBSCRIPTION_TIERS: TierConfig[] = [
  {
    id: 'collector_free',
    name: 'Collector Free',
    role: 'collector',
    pricePi: 0,
    priceAura: 0,
    streamingBitrate: 128,
    ads: true,
    marketplaceFeePercent: 2.5,
    features: ['128 kbps streaming', 'Basic discovery', 'Ads'],
  },
  {
    id: 'collector_premium',
    name: 'Collector Premium',
    role: 'collector',
    pricePi: 10,
    priceAura: auraPrice(10),
    streamingBitrate: 320,
    ads: false,
    marketplaceFeePercent: 1.25,
    features: ['320 kbps streaming', 'Ad‑free', 'Exclusive collectibles', '50% off fees', 'Badge'],
    prioritySupport: '12‑hour',
  },
  {
    id: 'collector_premium_plus',
    name: 'Collector Premium+',
    role: 'collector',
    pricePi: 15,
    priceAura: auraPrice(15),
    streamingBitrate: 320,
    ads: false,
    marketplaceFeePercent: 1.25,
    features: ['320 kbps', 'Ad‑free', 'Exclusive collectibles', '50% off fees', 'Early access', 'Custom playlists', 'Advanced discovery', 'Priority support'],
    prioritySupport: '12‑hour',
  },
  {
    id: 'creator_free',
    name: 'Creator Free',
    role: 'creator',
    pricePi: 0,
    priceAura: 0,
    streamingBitrate: 128,
    ads: true,
    marketplaceFeePercent: 2.5,
    mintingFeePercent: 10,
    features: ['Basic minting (10% fee)', 'Basic dashboard', '128 kbps', 'Ads on streams'],
    analytics: 'basic',
  },
  {
    id: 'creator_pro',
    name: 'Creator Pro',
    role: 'creator',
    pricePi: 20,
    priceAura: auraPrice(20),
    streamingBitrate: 128,
    ads: true,
    marketplaceFeePercent: 1.25,
    mintingFeePercent: 5,
    bulkMintingLimit: 100,
    features: ['5% minting fee', '1.25% marketplace fee', 'Bulk minting (100/tx)', 'Advanced analytics', 'Featured placement (24h/month)', 'Priority support (6‑hour)'],
    analytics: 'advanced',
    prioritySupport: '6‑hour',
  },
  {
    id: 'creator_circle',
    name: 'Creator Circle',
    role: 'creator',
    pricePi: 25,
    priceAura: auraPrice(25),
    streamingBitrate: 128,
    ads: true,
    marketplaceFeePercent: 1.25,
    mintingFeePercent: 5,
    bulkMintingLimit: 250,
    features: ['5% minting fee', '1.25% marketplace fee', 'Bulk minting (250/tx)', 'Advanced analytics + API', 'Featured placement + promotion', 'Dedicated support (6‑hour)'],
    analytics: 'advanced_api',
    prioritySupport: '6‑hour',
  },
];

export function getTierConfig(id: SubscriptionTierId): TierConfig | undefined {
  return SUBSCRIPTION_TIERS.find(t => t.id === id);
}

export function getTiersByRole(role: 'collector' | 'creator'): TierConfig[] {
  return SUBSCRIPTION_TIERS.filter(t => t.role === role);
}
