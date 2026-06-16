"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, LogOut, Music2, Heart, Users, TrendingUp, Eye, ShoppingCart, Crown, Upload, UserPlus, UserCheck } from "lucide-react"
import { useStore } from "@/lib/store"
import { NFTCard } from "@/components/nft-card"
import { InlineWallet } from "@/components/inline-wallet"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { LoadMore } from "@/components/load-more"
import { useFollow } from "@/hooks/useFollow"
import { SUBSCRIPTION_TIERS, getTierConfig } from "@/lib/subscription-config"
import Link from "next/link"

export default function ProfilePage() {
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [allUserNFTs, setAllUserNFTs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [loadingSub, setLoadingSub] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { followers, isFollowing, toggle: toggleFollow, loading: followLoading } = useFollow(user?.username)

  useEffect(() => {
    async function fetchUserNFTs() {
      try {
        const response = await fetch('/api/stellar/get-listing/?getAll=true')
        const data = await response.json()
        if (data.success) setAllUserNFTs(data.listings || [])
      } catch (error) {
        console.error('[Profile] Error fetching NFTs:', error)
      } finally { setLoading(false) }
    }
    fetchUserNFTs()
  }, [])

  useEffect(() => {
    async function fetchSubscription() {
      if (!user?.piaddr) return
      try {
        const response = await fetch(`/api/subscription/update?user_pi_address=${user.piaddr}`)
        const data = await response.json()
        if (data.success) setSubscription(data.subscription)
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally { setLoadingSub(false) }
    }
    fetchSubscription()
  }, [user])

  const handleLogout = () => {
    setUser(null)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setProfileImage(base64)
      try {
        const res = await fetch('/.netlify/functions/update-profile-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64.split(',')[1],
            userPiAddress: user?.piaddr
          })
        })
        const data = await res.json()
        if (data.success) setProfileImage(data.url)
      } catch (err) {
        console.error('Failed to save profile image', err)
      }
    }
    reader.readAsDataURL(file)
  }

  const { items: displayedNFTs, loading: loadingMore, hasMore, loadMoreRef } = useInfiniteScroll({ initialItems: allUserNFTs })
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const tierConfig = subscription?.tier
    ? getTierConfig(((user?.role === 'creator' ? 'creator_' : 'collector_') + (subscription.tier === 'free' ? 'free' : subscription.tier)) as any)
    : undefined

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-20">
      <Header />
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <main className="container px-3 xs:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
              <div className="relative group">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 cursor-pointer" onClick={triggerFileInput}>
                  {profileImage ? <AvatarImage src={profileImage} alt={user?.username || "User"} /> : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl">
                    {user?.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold">{user?.username || "Guest"}</h2>
                  <Badge variant="secondary" className="text-xs">{user?.role || 'Collector'}</Badge>
                  {tierConfig && tierConfig.pricePi > 0 && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-xs">
                      <Crown className="w-3 h-3 mr-1" />{tierConfig.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">@{user?.username?.toLowerCase() || "guest"}</p>
                <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                  <Button size="sm" variant="outline" onClick={toggleFollow} disabled={followLoading}
                    className="gap-1 text-xs">
                    {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <span className="text-xs text-muted-foreground">{followers} follower{followers !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <InlineWallet mode={user?.role === 'creator' ? 'creator' : 'collector'} connected={true} />
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    Subscription
                  </CardTitle>
                  {tierConfig && tierConfig.pricePi > 0 && <Badge>{tierConfig.name}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                {loadingSub ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !tierConfig || tierConfig.pricePi === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Free tier • 10% fees on sales</p>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/subscribe">Upgrade & Save 50%</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-muted-foreground text-xs">Plan</p><p className="font-medium">{tierConfig?.name}</p></div>
                      <div><p className="text-muted-foreground text-xs">Fee</p><p className="font-medium text-green-600">{tierConfig?.marketplaceFeePercent}%</p></div>
                      <div><p className="text-muted-foreground text-xs">Status</p><p className="font-medium capitalize">{subscription?.status || 'active'}</p></div>
                      <div><p className="text-muted-foreground text-xs">Expires</p><p className="font-medium text-xs">{subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'N/A'}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild size="sm" className="flex-1">
                        <Link href="/subscribe">Manage Plan</Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1">
                        <Link href={user?.role === 'creator' ? '/creator/dashboard' : '/collector/portfolio'}>View Dashboard</Link>
                        <Button asChild size="sm" className="flex-1">
                          <Link href="/moderate">Moderate Content</Link>
                        </Button>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-2 pt-4 border-t">
              <Link href="/settings"><Button variant="outline" size="sm" className="w-full bg-transparent"><Settings className="w-4 h-4 mr-2" />Settings</Button></Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full bg-transparent"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
            </div>
          </CardContent>
        </Card>
        {user?.role === "creator" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <InlineWallet mode="creator" connected={true} />
            </div>
            <Card>
              <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1 text-sm"><Eye className="w-4 h-4" />Total Streams</CardDescription></CardHeader>
              <CardContent><div className="text-xl sm:text-2xl font-bold">{allUserNFTs.length > 0 ? '12.4K' : '0'}</div><p className="text-xs text-muted-foreground mt-1">Start minting to track</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1 text-sm"><Users className="w-4 h-4" />NFTs Minted</CardDescription></CardHeader>
              <CardContent><div className="text-xl sm:text-2xl font-bold">{allUserNFTs.length}</div><p className="text-xs text-muted-foreground mt-1">On Stellar blockchain</p></CardContent>
            </Card>
          </div>
        )}
        {user?.role === "creator" && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Crown className="w-4 h-4 text-primary" />Subscription</CardTitle>
                  {tierConfig && tierConfig.pricePi > 0 && <Badge>{tierConfig.name}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                {loadingSub ? <p className="text-sm text-muted-foreground">Loading...</p> : !tierConfig || tierConfig.pricePi === 0 ? (
                  <div className="space-y-3"><p className="text-sm text-muted-foreground">Free tier • 10% fees on sales</p><Button asChild size="sm" className="w-full"><Link href="/subscribe">Upgrade & Save 50%</Link></Button></div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-muted-foreground text-xs">Plan</p><p className="font-medium">{tierConfig?.name}</p></div>
                      <div><p className="text-muted-foreground text-xs">Fee</p><p className="font-medium text-green-600">{tierConfig?.marketplaceFeePercent}%</p></div>
                      <div><p className="text-muted-foreground text-xs">NFTs/Month</p><p className="font-medium">{tierConfig?.bulkMintingLimit || 'Unlimited'}</p></div>
                      <div><p className="text-muted-foreground text-xs">Expires</p><p className="font-medium text-xs">{subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'N/A'}</p></div>
                    </div>
                    <div className="flex gap-2"><Button variant="outline" asChild size="sm" className="flex-1"><Link href="/subscribe">Manage Plan</Link></Button><Button asChild size="sm" className="flex-1"><Link href="/creator/dashboard">Dashboard</Link></Button></div>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/mint"><Card className="hover:border-primary transition-colors cursor-pointer"><CardContent className="pt-6 text-center"><Music2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3" /><h3 className="font-semibold mb-1">Mint New NFT</h3><p className="text-sm text-muted-foreground">Upload and sell your audio</p></CardContent></Card></Link>
              <Link href="/marketplace"><Card className="hover:border-accent transition-colors cursor-pointer"><CardContent className="pt-6 text-center"><ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-accent mx-auto mb-3" /><h3 className="font-semibold mb-1">View Marketplace</h3><p className="text-sm text-muted-foreground">See all minted NFTs</p></CardContent></Card></Link>
            </div>
          </>
        )}
        <Tabs defaultValue="collection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collection" className="text-xs sm:text-sm">Collection</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs sm:text-sm">Favorites</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="collection" className="space-y-4 mt-6">
            {loading ? (
              <Card><CardContent className="py-12 text-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-muted-foreground">Loading your collection...</p></CardContent></Card>
            ) : allUserNFTs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedNFTs.map((nft) => (
                    <NFTCard key={nft.tokenId} track={{ id: nft.tokenId, title: nft.metadata?.name || `NFT #${nft.tokenId}`, artist: 'You', coverUrl: nft.metadata?.image || '/placeholder.svg', audioUrl: nft.metadata?.audio || '', audioUrls: { preview: nft.metadata?.audio || '', standard: nft.metadata?.audio || '', hq: nft.metadata?.audio || '' }, price: parseFloat(nft.price) / 1000000 || 0, royalty: nft.royaltyInfo?.basis_points ? nft.royaltyInfo.basis_points / 100 : 10, owned: true, duration: 180, plays: 0, image: nft.metadata?.image || '/placeholder.svg' }} onTip={() => {}} />
                  ))}
                </div>
                <LoadMore loading={loadingMore} hasMore={hasMore} observerRef={loadMoreRef as React.RefObject<HTMLDivElement>} />
              </>
            ) : (
              <Card><CardContent className="py-12 text-center"><Music2 className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" /><h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3><p className="text-sm text-muted-foreground mb-4">Start building your collection</p><Link href="/marketplace"><Button>Browse Marketplace</Button></Link></CardContent></Card>
            )}
          </TabsContent>
          <TabsContent value="favorites" className="space-y-4 mt-6">
            <Card><CardContent className="py-12 text-center"><Heart className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" /><h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3><p className="text-sm text-muted-foreground">Heart NFTs to save them here</p></CardContent></Card>
          </TabsContent>
          <TabsContent value="activity" className="space-y-4 mt-6">
            <Card><CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle><CardDescription className="text-sm">Your latest actions on Aurafloor</CardDescription></CardHeader><CardContent className="space-y-3"><div className="text-center py-8 text-sm text-muted-foreground">Activity tracking coming soon</div></CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>
      <MobileNav />
    </div>
  )
}
