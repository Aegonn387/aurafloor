import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fee Structure | Aurafloor',
  description: 'Transparent breakdown of fees, subscriptions, and revenue sharing on the Aurafloor platform.',
}

export default function FeesPage() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Fee Structure</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Transparent breakdown of fees, subscriptions, and revenue sharing
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Fee Structure
            </CardTitle>
            <CardDescription>
              Last Updated: February 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm sm:text-base">
            <div className="space-y-6">
              <p className="text-muted-foreground">
                This document outlines all fees, subscriptions, and revenue sharing associated with the Aurafloor platform. All transaction fees are automatically processed by Smart Contracts unless otherwise stated.
              </p>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">1. NFT Sales Fees</h2>
                <h3 className="font-semibold text-sm sm:text-base mt-4">Primary Sale (Initial Minting & Sale)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center my-4">
                  <div className="p-4 bg-background border rounded-lg">
                    <p className="text-2xl font-bold text-primary">10%</p>
                    <p className="text-sm font-medium">Standard Platform Fee</p>
                    <p className="text-xs text-muted-foreground mt-2">For free users</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">5%</p>
                    <p className="text-sm font-medium">Subscriber Platform Fee</p>
                    <p className="text-xs text-muted-foreground mt-2">Premium subscribers save 50%</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg">
                    <p className="text-sm font-medium">Gas Fees Apply</p>
                    <p className="text-xs text-muted-foreground mt-2">Paid by the minter to the Pi Network</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Subscribers pay only 5% platform fee on primary sales, a 50% discount from the standard 10% rate. Creator receives the remaining 95% (for subscribers) or 90% (for free users) after platform fee.
                </p>

                <h3 className="font-semibold text-sm sm:text-base mt-6">Secondary Sale (Resale by Collector)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center my-4">
                  <div className="p-4 bg-background border rounded-lg">
                    <p className="text-2xl font-bold text-primary">5%</p>
                    <p className="text-sm font-medium">Platform Fee</p>
                    <p className="text-xs text-muted-foreground mt-2">Same for all users</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">5-15%</p>
                    <p className="text-sm font-medium">Creator Royalty</p>
                    <p className="text-xs text-muted-foreground mt-2">Set by creator at minting</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg">
                    <p className="text-xl font-bold">Remainder</p>
                    <p className="text-sm font-medium">Seller Receives</p>
                    <p className="text-xs text-muted-foreground mt-2">After platform fee & royalty</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg">
                    <p className="text-sm font-medium">Gas Fees Apply</p>
                    <p className="text-xs text-muted-foreground mt-2">Paid by the seller to the Pi Network</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground"><strong>Note:</strong> Creator royalties are automatically enforced and distributed by Smart Contracts on every secondary sale.</p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">2. Creator Tipping Fees</h2>
                <p className="text-muted-foreground">
                  To support creators directly, users may send Tips. A small platform fee helps maintain this service and prevent system abuse.
                </p>
                <div className="flex items-center justify-center p-4 bg-background border rounded-lg my-4 max-w-md mx-auto">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">0.5%</p>
                    <p className="text-sm font-medium">Platform Tip Fee</p>
                    <p className="text-xs text-muted-foreground mt-2">+ Stellar Network Fee (~0.00001 XLM)</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  A 0.5% fee is deducted from the tip amount to support platform operations related to the tipping infrastructure. This fee structure is subject to review and may be adjusted in the future. All adjustments will be communicated transparently.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">3. Subscription Plans</h2>
                <p className="text-muted-foreground">
                  Aurafloor offers optional subscription plans that unlock enhanced features and reduced platform fees (5% instead of 10%).
                </p>

                <h3 className="font-semibold text-sm sm:text-base mt-4">Collector Subscriptions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="p-4 bg-background border rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">5 π/month</p>
                    <p className="text-sm font-medium">Collector Premium</p>
                    <p className="text-xs text-muted-foreground mt-2">5% fees, ad‑free, HD audio, early access</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">15 π/month</p>
                    <p className="text-sm font-medium">Collector Premium+</p>
                    <p className="text-xs text-muted-foreground mt-2">Everything in Premium + analytics, VIP support</p>
                  </div>
                </div>

                <h3 className="font-semibold text-sm sm:text-base mt-4">Creator Subscriptions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="p-4 bg-background border rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">10 π/month</p>
                    <p className="text-sm font-medium">Creator Premium</p>
                    <p className="text-xs text-muted-foreground mt-2">5% fees, 10 mints/month, analytics</p>
                  </div>
                  <div className="p-4 bg-background border rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">25 π/month</p>
                    <p className="text-sm font-medium">Creator Premium+</p>
                    <p className="text-xs text-muted-foreground mt-2">Everything in Premium + unlimited mints, AI insights</p>
                  </div>
                </div>

                <div className="space-y-2 text-muted-foreground">
                  <p className="text-sm"><strong>Billing:</strong> Subscriptions automatically renew monthly unless canceled before the next cycle.</p>
                  <p className="text-sm"><strong>Cancellation:</strong> You may cancel anytime via account settings. Cancellation stops future renewals but does not refund the current period.</p>
                  <p className="text-sm"><strong>Changes:</strong> We reserve the right to modify subscription fees, features, or tiers with prior notice.</p>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">4. Ad Revenue Share for Free Creators</h2>
                <p className="text-muted-foreground">
                  Creators who use the platform without a paid subscription are eligible to earn a share of advertising revenue.
                </p>
                <div className="flex items-center justify-center p-4 bg-background border rounded-lg my-4 max-w-md mx-auto">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">40%</p>
                    <p className="text-sm font-medium">Ad Revenue Share</p>
                    <p className="text-xs text-muted-foreground mt-2">Of net Pi Ads revenue from their content streams</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Free Creators receive <strong>40% of the net revenue</strong> that Aurafloor earns from Pi Ads served during streams of their audio content. Revenue share is calculated by the platform based on aggregated advertising performance metrics and paid out according to platform schedules. Amounts may vary with advertising market conditions.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">5. Network & Service Fees</h2>
                <div className="space-y-1 text-muted-foreground">
                  <p className="text-sm"><strong>Blockchain (Gas) Fees:</strong> Every on‑chain transaction requires payment of network fees to the Pi/Stellar Network. These fees vary and are non‑refundable.</p>
                  <p className="text-sm"><strong>No Hidden Fees:</strong> Apart from the fees listed above, Aurafloor charges no additional fees for standard platform use.</p>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="font-semibold text-base sm:text-lg">6. Taxes</h2>
                <p className="text-muted-foreground">
                  You are solely responsible for determining, reporting, and paying any taxes applicable to your transactions on the platform. Aurafloor does not withhold or remit taxes on your behalf.
                </p>
              </section>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
          <section className="space-y-2">
            <h2 className="font-semibold text-base sm:text-lg">9. AURA Token Rewards</h2>
            <p className="text-muted-foreground">AURA tokens are earned through meaningful platform participation. All rewards follow daily caps and anti‑sybil measures. See the <Link href="/rewards" className="text-primary hover:underline">Rewards Hub</Link> for full details.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-4 bg-background border rounded-lg"><p className="text-xl font-bold text-primary">25 AURA</p><p className="text-sm font-medium">Per Approved Blog Post</p><p className="text-xs text-muted-foreground mt-2">Stake 100 AURA required</p></div>
              <div className="p-4 bg-background border rounded-lg"><p className="text-xl font-bold text-primary">10 AURA</p><p className="text-sm font-medium">Per Stream / Ad Watch</p><p className="text-xs text-muted-foreground mt-2">Daily caps apply</p></div>
              <div className="p-4 bg-background border rounded-lg"><p className="text-xl font-bold text-primary">25 AURA</p><p className="text-sm font-medium">Per Correct Moderation Vote</p><p className="text-xs text-muted-foreground mt-2">Speed bonus up to +15%</p></div>
              <div className="p-4 bg-background border rounded-lg"><p className="text-xl font-bold text-primary">25 AURA</p><p className="text-sm font-medium">Per Verified User Invited</p><p className="text-xs text-muted-foreground mt-2">Unlimited</p></div>
            </div>
          </section>
                  This Fee Structure is part of and governed by the Aurafloor <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>. All terms are subject to change with notice; your continued use constitutes acceptance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}
