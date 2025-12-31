"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles, TrendingUp, Zap, Shield, Clock, CreditCard, RefreshCw } from "lucide-react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { PiAuth } from "@/lib/pi-auth"

export default function SubscribePage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const collectorPlans = [
    {
      id: "premium",
      name: "Collector Premium",
      price: 5,
      period: "month",
      features: [
        "Ad-free listening experience",
        "Offline downloads",
        "HD audio quality",
        "Early access to new drops",
        "Exclusive collector badge",
      ],
    },
    {
      id: "elite",
      name: "Collector Elite",
      price: 10,
      period: "month",
      features: [
        "Everything in Premium",
        "Priority access to limited editions",
        "Exclusive collector events",
        "Early pre-sale opportunities",
        "VIP support channel",
        "Collector analytics dashboard",
      ],
      recommended: true,
    },
  ]

  const creatorPlans = [
    {
      id: "basic",
      name: "Creator Basic",
      price: 10,
      period: "month",
      features: [
        "Advanced analytics dashboard",
        "Custom NFT badges",
        "Priority support",
        "Bulk minting tools",
        "Extended royalty options",
      ],
    },
    {
      id: "pro",
      name: "Creator Pro",
      price: 20,
      period: "month",
      features: [
        "Everything in Basic",
        "AI-powered insights",
        "Auto-promotion tools",
        "Collaboration features",
        "Premium verification badge",
        "Revenue optimization AI",
      ],
      recommended: true,
    },
  ]

  const handleSubscribe = async (planName: string, price: number) => {
    setLoading(true)
    setSelectedPlan(planName)

    try {
      // Validate user first
      if (!user) {
        router.push("/auth")
        return
      }

      const paymentId = await PiAuth.createPayment({
        amount: price,
        memo: `Subscribe to ${planName} on Aurafloor`,
        metadata: {
          type: "subscription",
          plan: planName,
          // @ts-ignore
          userId: user.id,
          role: user.role
        },
      })

      console.log("[v1] Subscription payment initiated:", paymentId)

      // Show success message before redirect
      setTimeout(() => {
        router.push("/profile?subscription=success")
      }, 1500)

    } catch (error) {
      console.error("Subscription failed:", error)
      // You could add error state UI here
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
          <Badge className="mb-4">Unlock Premium Features</Badge>
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">Upgrade your Aurafloor experience</p>
        </div>

        {user?.role !== "creator" && (
          <div className="grid md:grid-cols-2 gap-6">
            {collectorPlans.map((plan) => (
              <Card key={plan.id} className={plan.recommended ? "border-accent shadow-lg" : ""}>
                {plan.recommended && (
                  <div className="bg-accent text-accent-foreground text-center py-2 rounded-t-lg">
                    <span className="text-sm font-semibold">Most Popular</span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>Perfect for music collectors and enthusiasts</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{plan.price}π</div>
                      <div className="text-sm text-muted-foreground">per {plan.period}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.recommended ? "text-accent" : "text-primary"}`} />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plan.recommended ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.name, plan.price)}
                    disabled={loading}
                  >
                    {loading && selectedPlan === plan.name ? "Processing..." : "Subscribe Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {user?.role === "creator" && (
          <div className="grid md:grid-cols-2 gap-6">
            {creatorPlans.map((plan) => (
              <Card key={plan.id} className={plan.recommended ? "border-accent shadow-lg" : ""}>
                {plan.recommended && (
                  <div className="bg-accent text-accent-foreground text-center py-2 rounded-t-lg">
                    <span className="text-sm font-semibold">Recommended</span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.id === "basic" ? (
                      <TrendingUp className="w-5 h-5 text-primary" />
                    ) : (
                      <Zap className="w-5 h-5 text-accent" />
                    )}
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price}π<span className="text-sm text-muted-foreground font-normal"> / {plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2
                          className={`w-5 h-5 shrink-0 ${plan.recommended ? "text-accent" : "text-primary"}`}
                        />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plan.recommended ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.name, plan.price)}
                    disabled={loading}
                  >
                    {loading && selectedPlan === plan.name ? "Processing..." : "Subscribe Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-muted/50">
          <CardContent className="py-6 space-y-4">
            <h3 className="font-semibold text-lg">Subscription Terms & Conditions</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Cancel anytime with no commitments or hidden fees</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Instant activation - access features immediately</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-5 text-primary mt-0.5 shrink-0" />
                <span>Secure Pi Network payments - no credit card required</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>24/7 customer support via email and chat</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>No auto-renewal - subscriptions remain until cancelled</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Plan upgrades available anytime, prorated charges apply</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>All features listed are guaranteed for subscription period</span>
              </div>
            </div>
            <div className="pt-4 border-t text-xs text-muted-foreground">
              <p>By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions are billed monthly in Pi (π) until cancelled. You can manage your subscription in your profile settings.</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">Pi Network blockchain security</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">Flexible Plans</h3>
              <p className="text-sm text-muted-foreground">Change or cancel anytime</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <RefreshCw className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-1">Easy Management</h3>
              <p className="text-sm text-muted-foreground">Control everything in Settings</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
