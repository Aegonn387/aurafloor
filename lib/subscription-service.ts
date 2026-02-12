/**
 * Subscription Service
 * 
 * Handles subscription tiers, audio quality, and access control.
 */

export type SubscriptionTier = 'free' | 'plus' | 'premium' | 'pro'
export type AudioQuality = '128kbps' | '256kbps' | '320kbps'

export interface Subscription {
  tier: SubscriptionTier
  status: 'active' | 'past_due' | 'canceled' | 'expired'
  expiresAt?: Date
  autoRenew: boolean
  features: string[]
}

export interface UserSubscription {
  subscription?: Subscription
  accessToken?: string
}

// Type guard to check if user is in the old format (string) or new format (object)
function getSubscriptionTier(user: any): SubscriptionTier {
  if (!user) return 'free'
  
  // Case 1: user.subscription is a string ("free", "premium")
  if (typeof user.subscription === 'string') {
    const tier = user.subscription as string
    if (tier === 'premium' || tier === 'plus' || tier === 'pro' || tier === 'free') {
      return tier as SubscriptionTier
    }
    return 'free'
  }
  
  // Case 2: user.subscription is an object with tier property
  if (user.subscription?.tier) {
    const tier = user.subscription.tier as string
    if (tier === 'premium' || tier === 'plus' || tier === 'pro' || tier === 'free') {
      return tier as SubscriptionTier
    }
  }
  
  return 'free'
}

class SubscriptionServiceClass {
  /**
   * Get audio quality based on subscription tier
   * Accepts both old format (string) and new format (object)
   */
  getAudioQuality(user?: any): AudioQuality {
    const tier = getSubscriptionTier(user)
    
    switch (tier) {
      case 'pro':
      case 'premium':
        return '320kbps'
      case 'plus':
        return '256kbps'
      case 'free':
      default:
        return '128kbps'
    }
  }

  /**
   * Check if user can access premium audio
   */
  canAccessPremium(user?: any): boolean {
    const tier = getSubscriptionTier(user)
    return tier === 'premium' || tier === 'pro'
  }

  /**
   * Check if user can download lossless audio
   */
  canDownloadLossless(user?: any): boolean {
    const tier = getSubscriptionTier(user)
    return tier === 'pro'
  }

  /**
   * Check if user can skip ads
   */
  canSkipAds(user?: any): boolean {
    const tier = getSubscriptionTier(user)
    return tier === 'plus' || tier === 'premium' || tier === 'pro'
  }

  /**
   * Get subscription features for tier
   */
  getFeaturesForTier(tier: SubscriptionTier): string[] {
    const baseFeatures = [
      'Stream in 128kbps',
      'Basic playback controls'
    ]

    const plusFeatures = [
      ...baseFeatures,
      'Stream in 256kbps',
      'Ad-free listening',
      'Create playlists',
      'Save for offline'
    ]

    const premiumFeatures = [
      ...plusFeatures,
      'Stream in 320kbps',
      'Early access to new releases',
      'Exclusive artist content',
      'Discord role'
    ]

    const proFeatures = [
      ...premiumFeatures,
      'Lossless downloads',
      'Commercial license',
      'Direct artist support',
      'Promotion tools',
      'Analytics dashboard'
    ]

    switch (tier) {
      case 'pro': return proFeatures
      case 'premium': return premiumFeatures
      case 'plus': return plusFeatures
      case 'free': return baseFeatures
      default: return baseFeatures
    }
  }

  /**
   * Get max stream quality for tier (in kbps)
   */
  getMaxBitrate(tier: SubscriptionTier): number {
    switch (tier) {
      case 'pro':
      case 'premium':
        return 320
      case 'plus':
        return 256
      case 'free':
      default:
        return 128
    }
  }

  /**
   * Get daily play limit for free tier (null = unlimited)
   */
  getDailyPlayLimit(user?: any): number | null {
    const tier = getSubscriptionTier(user)
    
    switch (tier) {
      case 'free':
        return 180 // 3 hours = 180 minutes
      case 'plus':
      case 'premium':
      case 'pro':
      default:
        return null // Unlimited
    }
  }

  /**
   * Check if user can play a specific track
   */
  canPlayTrack(user?: any, trackOwned?: boolean): boolean {
    // User owns the track -> always can play
    if (trackOwned) return true
    
    const tier = getSubscriptionTier(user)
    
    // Free users have limited access
    if (tier === 'free') {
      // Check daily play limit
      const limit = this.getDailyPlayLimit(user)
      if (limit === null) return true
      
      // This would need to be checked against a daily counter
      // For now, assume they can play
      return true
    }
    
    // Paid tiers can play anything
    return true
  }

  /**
   * Get user's current subscription from API
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const res = await fetch(`/api/subscriptions/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch subscription')
      return await res.json()
    } catch (error) {
      console.error('SubscriptionService.getUserSubscription error:', error)
      return null
    }
  }

  /**
   * Update subscription tier
   */
  async updateSubscription(userId: string, tier: SubscriptionTier): Promise<Subscription> {
    try {
      const res = await fetch(`/api/subscriptions/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      })
      if (!res.ok) throw new Error('Failed to update subscription')
      return await res.json()
    } catch (error) {
      console.error('SubscriptionService.updateSubscription error:', error)
      throw error
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const res = await fetch(`/api/subscriptions/${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to cancel subscription')
    } catch (error) {
      console.error('SubscriptionService.cancelSubscription error:', error)
      throw error
    }
  }

  /**
   * Get available subscription plans
   */
  async getPlans(): Promise<Array<{
    id: string
    name: string
    tier: SubscriptionTier
    price: number
    currency: string
    interval: 'month' | 'year'
    features: string[]
  }>> {
    try {
      const res = await fetch('/api/subscriptions/plans')
      if (!res.ok) throw new Error('Failed to fetch plans')
      return await res.json()
    } catch (error) {
      console.error('SubscriptionService.getPlans error:', error)
      // Return default plans if API fails
      return [
        {
          id: 'free',
          name: 'Free',
          tier: 'free',
          price: 0,
          currency: 'π',
          interval: 'month',
          features: this.getFeaturesForTier('free')
        },
        {
          id: 'plus',
          name: 'Plus',
          tier: 'plus',
          price: 5,
          currency: 'π',
          interval: 'month',
          features: this.getFeaturesForTier('plus')
        },
        {
          id: 'premium',
          name: 'Premium',
          tier: 'premium',
          price: 10,
          currency: 'π',
          interval: 'month',
          features: this.getFeaturesForTier('premium')
        },
        {
          id: 'pro',
          name: 'Pro',
          tier: 'pro',
          price: 20,
          currency: 'π',
          interval: 'month',
          features: this.getFeaturesForTier('pro')
        }
      ]
    }
  }
}

// Singleton instance
export const subscriptionService = new SubscriptionServiceClass()

// Alias for backward compatibility with existing imports
export const SubscriptionService = subscriptionService
