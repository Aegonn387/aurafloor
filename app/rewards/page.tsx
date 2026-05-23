import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Coins, TrendingUp, Edit3, Eye, MessageCircle, ThumbsUp, UserPlus, Shield, Video, BookOpen } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AURA Rewards Hub | Aurafloor',
  description: 'Complete guide to earning AURA tokens through platform participation.',
}

const rewardCategories = [
  {
    title: "Content Creation",
    icon: <Edit3 className="w-5 h-5 text-primary" />,
    items: [
      { activity: "Mint an Audio NFT", reward: "10 AURA", cap: "Unlimited", note: "Per successful mint" },
      { activity: "Write & Publish a Blog Post", reward: "25 AURA", cap: "Unlimited", note: "Stake 100 AURA" },
    ]
  },
  {
    title: "Engagement & Consumption",
    icon: <Eye className="w-5 h-5 text-primary" />,
    items: [
      { activity: "Stream Music/Beat (60s)", reward: "10 AURA", cap: "20 streams/day", note: "Interstitial ads" },
      { activity: "Stream Podcast (4min)", reward: "10 AURA", cap: "20 streams/day", note: "Interstitial ads" },
      { activity: "Watch Rewarded Ads", reward: "10 AURA", cap: "15 (free) / 20 (sub)", note: "Opt‑in, 30s cooldown" },
      { activity: "Streak Bonus (≥7 days)", reward: "+1 AURA/ad", cap: "Applied on top", note: "Resets after 2 missed days" },
      { activity: "Read a Blog Post (30s)", reward: "2.5 AURA", cap: "20/day", note: "Unique IP" },
    ]
  },
  {
    title: "Social & Community",
    icon: <MessageCircle className="w-5 h-5 text-primary" />,
    items: [
      { activity: "Comment on a Blog Post", reward: "5 AURA", cap: "20/day", note: "Spam detection" },
      { activity: "Like a Blog Post", reward: "0.5 AURA", cap: "20/day", note: "Rate limited" },
      { activity: "Invite a Verified User", reward: "25 AURA", cap: "Unlimited", note: "KYC verification" },
    ]
  },
  {
    title: "Moderation & Governance",
    icon: <Shield className="w-5 h-5 text-primary" />,
    items: [
      { activity: "Correct Moderation Vote", reward: "25 AURA", cap: "Per vote", note: "Speed bonus up to +15%" },
      { activity: "Report Inappropriate Content", reward: "1 AURA", cap: "5/day", note: "False‑report penalties" },
      { activity: "Lock AURA for DAO Governance", reward: "Varies", cap: "Continuous", note: "Yield from swap fees" },
    ]
  },
  {
    title: "Commerce",
    icon: <TrendingUp className="w-5 h-5 text-primary" />,
    items: [
      { activity: "Buy an NFT", reward: "5 AURA", cap: "Unlimited", note: "Per purchase" },
      { activity: "Subscribe to Premium Tier", reward: "50 AURA", cap: "One‑time per tier", note: "" },
    ]
  },
]

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/fees"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">AURA Rewards Hub</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Earn AURA tokens through meaningful platform participation</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" />How Rewards Work</CardTitle>
            <CardDescription>Every meaningful action on Aurafloor earns AURA tokens. Rewards follow yearly halving and daily caps to prevent farming.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Total Community Pool:</strong> 650,000,000 AURA (65% of total supply)</p>
            <p>• <strong>Emission Schedule:</strong> Yearly halving — Year 1: 100M → Year 2: 50M → Year 3: 25M → Year 4: 12.5M → Perpetual tail: 6.25M</p>
            <p>• <strong>Anti‑Sybil:</strong> Pi KYC verification, daily caps, rate limiting, server‑side verification</p>
            <p>• <strong>Distribution:</strong> Rewards are claimable via your profile. Moderation and DAO rewards require staking.</p>
          </CardContent>
        </Card>
        {rewardCategories.slice(0,2).map((cat) => (
          <Card key={cat.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">{cat.icon}{cat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cat.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.activity}</p>
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <Badge className="text-xs bg-primary/10 text-primary">{item.reward}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{item.cap}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {rewardCategories.slice(2).map((cat) => (
          <Card key={cat.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">{cat.icon}{cat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cat.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.activity}</p>
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <Badge className="text-xs bg-primary/10 text-primary">{item.reward}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{item.cap}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">AURA rewards are distributed according to the <Link href="/whitepaper" className="text-primary hover:underline">Official Whitepaper</Link>. All amounts subject to yearly halving schedule.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" size="sm"><Link href="/fees">View Fee Structure</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/subscribe">Upgrade Subscription</Link></Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}
