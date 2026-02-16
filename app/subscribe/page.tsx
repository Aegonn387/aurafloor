"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles, TrendingUp, Zap } from "lucide-react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { PiAuth } from "@/lib/pi-auth"

export default function SubscribePage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const collectorPlans = [
    { id: "premium", name: "Collector Premium", price: 5, period: "month",
      features: ["5% fees (save 50%!)", "Ad-free", "HD audio", "Early access"] },
    { id: "premium_plus", name: "Collector Premium+", price: 15, period: "month",
      features: ["Everything in Premium", "Analytics", "VIP support"], recommended: true },
  ]

  const creatorPlans = [
    { id: "premium", name: "Creator Premium", price: 10, period: "month",
      features: ["5% fees (save 50%!)", "10 mints/month", "Analytics"] },
    { id: "premium_plus", name: "Creator Premium+", price: 25, period: "month",
      features: ["Everything in Premium", "Unlimited mints", "AI insights"], recommended: true },
  ]

  const handleSubscribe = async (planName: string, price: number) => {
    setLoading(true)
    setSelectedPlan(planName)
    try {
      if (!user) { router.push("/auth"); return }
      const paymentId = await PiAuth.createPayment({
        amount: price, memo: `Subscribe to ${planName}`,
        metadata: { type: "subscription", plan: planName, piAddress: user.piaddr }
      })
      const response = await fetch('/api/subscription/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_pi_address: user.piaddr, plan_name: planName, payment_id: paymentId, amount_pi: price })
      })
      const data = await response.json()
      if (data.success) { setTimeout(() => router.push("/profile?subscription=success"), 1500) }
      else { alert(data.error || "Failed") }
    } catch (error) { alert("Failed") }
    finally { setLoading(false); setSelectedPlan(null) }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <Badge className="mb-4">Save 50% on Fees</Badge>
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">Cut platform fees in half!</p>
        </div>
        {user?.role !== "creator" && (
          <div className="grid md:grid-cols-2 gap-6">
            {collectorPlans.map((plan) => (
              <Card key={plan.id} className={plan.recommended ? "border-primary shadow-lg" : ""}>
                {plan.recommended && (<div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg"><span className="text-sm font-semibold">Most Popular</span></div>)}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />{plan.name}</CardTitle>
                      <CardDescription>For collectors</CardDescription>
                    </div>
                    <div className="text-right"><div className="text-3xl font-bold text-primary">{plan.price}π</div><div className="text-sm text-muted-foreground">per {plan.period}</div></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (<div key={index} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" /><span className="text-sm">{feature}</span></div>))}
                  </div>
                  <Button className="w-full" size="lg" variant={plan.recommended ? "default" : "outline"} onClick={() => handleSubscribe(plan.name, plan.price)} disabled={loading}>
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
              <Card key={plan.id} className={plan.recommended ? "border-primary shadow-lg" : ""}>
                {plan.recommended && (<div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg"><span className="text-sm font-semibold">Recommended</span></div>)}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">{plan.id === "premium" ? <TrendingUp className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-primary" />}{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">{plan.price}π<span className="text-sm text-muted-foreground font-normal"> / {plan.period}</span></div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (<div key={index} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" /><span className="text-sm">{feature}</span></div>))}
                  </div>
                  <Button className="w-full" size="lg" variant={plan.recommended ? "default" : "outline"} onClick={() => handleSubscribe(plan.name, plan.price)} disabled={loading}>
                    {loading && selectedPlan === plan.name ? "Processing..." : "Subscribe Now"}
                  </Button>
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
