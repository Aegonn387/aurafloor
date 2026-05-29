"use client"

import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Megaphone, BarChart3, Zap, Key, Package, Crown, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { getTierConfig } from "@/lib/subscription-config"

export default function CreatorToolsPage() {
  const user = useStore((state) => state.user)
  const tierKey = (user?.role === 'creator' ? 'creator_' : 'collector_') + (user?.subscription?.tier || 'free')
  const tierConfig = getTierConfig(tierKey as any)
  const isProOrAbove = tierConfig?.bulkMintingLimit != null
  const isCircle = tierConfig?.id === 'creator_circle'

  if (user?.role !== "creator") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Creator Access Only</h1>
          <p className="text-muted-foreground mb-6">Creator Tools are available for creator accounts.</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/profile"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Creator Tools</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Powerful tools for creators to manage, promote, and grow their content
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" />Your Plan</CardTitle>
            <CardDescription>{tierConfig ? tierConfig.name : 'Creator Free'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground text-xs">Minting Fee</p><p className="font-medium">{tierConfig?.mintingFeePercent ?? 10}%</p></div>
              <div><p className="text-muted-foreground text-xs">Marketplace Fee</p><p className="font-medium">{tierConfig?.marketplaceFeePercent ?? 2.5}%</p></div>
              <div><p className="text-muted-foreground text-xs">Bulk Minting</p><p className="font-medium">{tierConfig?.bulkMintingLimit ? `Up to ${tierConfig.bulkMintingLimit} NFTs/tx` : 'Not available'}</p></div>
              <div><p className="text-muted-foreground text-xs">Analytics</p><p className="font-medium capitalize">{tierConfig?.analytics || 'Basic'}</p></div>
            </div>
            {!isProOrAbove && (
              <Link href="/subscribe"><Button size="sm" className="w-full">Upgrade to Pro</Button></Link>
            )}
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5 text-primary" />Bulk Minting</CardTitle>
              <CardDescription>Mint multiple NFTs in a single transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isProOrAbove ? (
                <>
                  <Badge className="bg-green-600">Available</Badge>
                  <p className="text-sm text-muted-foreground">Mint up to {tierConfig?.bulkMintingLimit} NFTs per transaction.</p>
                  <Link href="/mint"><Button size="sm" variant="outline" className="w-full">Go to Mint Page</Button></Link>
                </>
              ) : (
                <>
                  <Badge variant="outline">Pro & Circle Only</Badge>
                  <p className="text-sm text-muted-foreground">Upgrade to Creator Pro or Circle to unlock bulk minting.</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-5 w-5 text-primary" />Advanced Analytics</CardTitle>
              <CardDescription>Detailed insights into your audience and revenue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tierConfig?.analytics && tierConfig.analytics !== 'basic' ? (
                <>
                  <Badge className="bg-green-600">Available</Badge>
                  <p className="text-sm text-muted-foreground">{tierConfig.analytics === 'advanced_api' ? 'Full API access included.' : 'View streams, revenue, and audience data.'}</p>
                  <Link href="/creator/dashboard"><Button size="sm" variant="outline" className="w-full">View Dashboard</Button></Link>
                </>
              ) : (
                <>
                  <Badge variant="outline">Pro & Circle Only</Badge>
                  <p className="text-sm text-muted-foreground">Upgrade to Creator Pro or Circle for advanced analytics.</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-5 w-5 text-primary" />Promote Content</CardTitle>
              <CardDescription>Burn AURA to feature your NFTs on the homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Minimum {isProOrAbove ? '50' : '100'} AURA. 100% permanently burned.</p>
              <Link href="/promote"><Button size="sm" variant="outline" className="w-full">Promote NFT</Button></Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Key className="h-5 w-5 text-primary" />API Access</CardTitle>
              <CardDescription>Programmatic access to your creator data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isCircle ? (
                <>
                  <Badge className="bg-green-600">Circle Exclusive</Badge>
                  <p className="text-sm text-muted-foreground">Full API access for building custom integrations.</p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => window.location.href = 'mailto:Aegonn@aurafloor.co.za?subject=API Access Request'}><ExternalLink className="w-4 h-4 mr-2" />Request API Key</Button>
                </>
              ) : (
                <>
                  <Badge variant="outline">Circle Only</Badge>
                  <p className="text-sm text-muted-foreground">API access is exclusive to Creator Circle members.</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
