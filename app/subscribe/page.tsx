"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles, TrendingUp, Zap, Loader2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { SUBSCRIPTION_TIERS, getTiersByRole, type TierConfig } from "@/lib/subscription-config"
import { subscribeToService } from "@/lib/contracts"
import { signTransaction, getPublicKey } from "@/lib/wallet"

// Map tier IDs to service symbols (must match those registered on the contract)
const tierToServiceId: Record<string, string> = {
  'collector_free': 'CFREE',
  'collector_basic': 'CBASIC',
  'collector_premium': 'CPREM',
  'collector_premium_plus': 'CPREM+',
  'creator_pro': 'CRPRO',
  'creator_circle': 'CRCIRCLE',
}

export default function SubscribePage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const collectorTiers = getTiersByRole('collector')
  const creatorTiers = getTiersByRole('creator')

  const handleSubscribe = async (tier: TierConfig) => {
    setLoading(true)
    setSelectedPlan(tier.id)
    try {
      if (!user) { router.push("/auth"); return }

      // Get user's wallet address
      const walletAddress = await getPublicKey()
      if (!walletAddress) throw new Error('Wallet not connected')

      const serviceId = tierToServiceId[tier.id]
      if (!serviceId) throw new Error(`No service mapping for tier ${tier.id}`)

      // Subscribe to the service on the contract (1 period)
      await subscribeToService(signTransaction, walletAddress, serviceId, 1)

      alert('Subscription successful! You are now subscribed.')
      router.push("/profile?subscription=success")
    } catch (err: any) {
      console.error('Subscription error:', err)
      alert(err.message || 'Subscription failed')
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <Badge className="mb-4">Save 50% on Fees</Badge>
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">Six tiers designed for every listener and creator</p>
        </div>

        {user?.role !== "creator" && (
          <div className="grid md:grid-cols-3 gap-6">
            {collectorTiers.map((tier) => (
              <Card key={tier.id} className={tier.id === 'collector_premium_plus' ? "border-primary shadow-lg" : ""}>
                {tier.id === 'collector_premium_plus' && (
                  <div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg">
                    <span className="text-sm font-semibold">Most Popular</span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {tier.name}
                      </CardTitle>
                      <CardDescription>{tier.pricePi === 0 ? 'Free forever' : 'For passionate collectors'}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{tier.pricePi === 0 ? 'Free' : `${tier.pricePi}π`}</div>
                      <div className="text-sm text-muted-foreground">/month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  {tier.pricePi > 0 && (
                    <Button className="w-full" size="lg"
                      variant={tier.id === 'collector_premium_plus' ? "default" : "outline"}
                      onClick={() => handleSubscribe(tier)}
                      disabled={loading}>
                      {loading && selectedPlan === tier.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {loading && selectedPlan === tier.id ? "Processing..." : "Subscribe Now"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {user?.role === "creator" && (
          <div className="grid md:grid-cols-3 gap-6">
            {creatorTiers.map((tier) => (
              <Card key={tier.id} className={tier.id === 'creator_circle' ? "border-primary shadow-lg" : ""}>
                {tier.id === 'creator_circle' && (
                  <div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg">
                    <span className="text-sm font-semibold">Recommended</span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {tier.id === 'creator_pro' ? <TrendingUp className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-primary" />}
                    {tier.name}
                  </CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {tier.pricePi === 0 ? 'Free' : `${tier.pricePi}π`}
                    <span className="text-sm text-muted-foreground font-normal"> / month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  {tier.pricePi > 0 && (
                    <Button className="w-full" size="lg"
                      variant={tier.id === 'creator_circle' ? "default" : "outline"}
                      onClick={() => handleSubscribe(tier)}
                      disabled={loading}>
                      {loading && selectedPlan === tier.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {loading && selectedPlan === tier.id ? "Processing..." : "Subscribe Now"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Card className="bg-muted/50">
          <CardContent className="py-6 space-y-4">
            <h3 className="font-semibold text-lg">Why Subscribe?</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /><span><strong>Save 50% on fees</strong> - Pay 5% instead of 10%</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /><span>Cancel anytime - No commitments</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /><span>Instant activation</span></div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /><span>Secure Pi payments</span></div>
            </div>
          </CardContent>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}
