"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music2, TrendingUp, Wallet, Clock, Heart, Play, Download } from "lucide-react"
import { useStore } from "@/lib/store"
import { NFTCard } from "@/components/nft-card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CollectorPortfolio() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [nfts, setNfts] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [stats, setStats] = useState({
    total_value: 0,
    total_nfts: 0,
    total_spent: 0,
    total_streams: 0
  })

  useEffect(() => {
    if (user?.role !== 'collector') {
      router.push('/profile')
      return
    }
    fetchPortfolioData()
  }, [user])

  async function fetchPortfolioData() {
    if (!user?.piaddr) return
    setLoading(true)
    try {
      const [nftRes, subRes] = await Promise.all([
        fetch('/api/stellar/get-listing/?getAll=true'),
        fetch(`/api/subscription/update?user_pi_address=${user.piaddr}`)
      ])
      const nftData = await nftRes.json()
      const subData = await subRes.json()
      
      if (nftData.success) {
        setNfts(nftData.listings || [])
        const totalValue = nftData.listings.reduce((sum: number, nft: any) => sum + (parseFloat(nft.price) / 1000000 || 0), 0)
        setStats({
          total_value: totalValue,
          total_nfts: nftData.listings.length,
          total_spent: totalValue,
          total_streams: 0
        })
      }
      if (subData.success) setSubscription(subData.subscription)
    } catch (error) {
      console.error('Portfolio fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'collector') {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Portfolio</h1>
            <p className="text-muted-foreground">Your NFT collection and stats</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
          </div>
        </div>

        {subscription && (
          <Card className={subscription.tier !== 'free' ? 'border-primary' : ''}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <p className="font-medium">{subscription.plan_name || 'Free Tier'}</p>
                    <p className="text-muted-foreground text-xs">
                      {subscription.has_ad_free ? 'Ad-free • HD audio' : 'Limited features'}
                    </p>
                  </div>
                </div>
                {subscription.tier === 'free' ? (
                  <Button asChild size="sm"><Link href="/subscribe">Upgrade Now</Link></Button>
                ) : (
                  <Badge>{subscription.tier.toUpperCase()}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_value.toFixed(2)}π</div>
              <p className="text-xs text-muted-foreground mt-1">Current market value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">NFTs Owned</CardTitle>
              <Music2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_nfts}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique tracks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_spent.toFixed(2)}π</div>
              <p className="text-xs text-muted-foreground mt-1">All-time purchases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <Play className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_streams}</div>
              <p className="text-xs text-muted-foreground mt-1">Listening time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="collection" className="space-y-4">
          <TabsList>
            <TabsTrigger value="collection">My Collection</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="history">Purchase History</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading your collection...</p>
                </CardContent>
              </Card>
            ) : nfts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nfts.map((nft) => (
                  <NFTCard
                    key={nft.tokenId}
                    track={{
                      id: nft.tokenId,
                      title: nft.metadata?.name || `NFT #${nft.tokenId}`,
                      artist: 'Various',
                      coverUrl: nft.metadata?.image || '/placeholder.svg',
                      audioUrl: nft.metadata?.audio || '',
                      audioUrls: {
                        preview: nft.metadata?.audio || '',
                        standard: nft.metadata?.audio || '',
                        hq: nft.metadata?.audio || ''
                      },
                      price: parseFloat(nft.price) / 1000000 || 0,
                      royalty: nft.royaltyInfo?.basis_points ? nft.royaltyInfo.basis_points / 100 : 10,
                      owned: true,
                      duration: 180,
                      plays: 0,
                      image: nft.metadata?.image || '/placeholder.svg'
                    }}
                    onTip={() => {}}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start building your collection</p>
                  <Button asChild><Link href="/marketplace">Browse Marketplace</Link></Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                <p className="text-sm text-muted-foreground">Heart NFTs to save them here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>Your NFT transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {nfts.length > 0 ? (
                  <div className="space-y-3">
                    {nfts.map((nft) => (
                      <div key={nft.tokenId} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                            {nft.metadata?.image && (
                              <img src={nft.metadata.image} alt={nft.metadata.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{nft.metadata?.name || `NFT #${nft.tokenId}`}</p>
                            <p className="text-sm text-muted-foreground">Purchased</p>
                          </div>
                        </div>
                        <p className="font-bold">{(parseFloat(nft.price) / 1000000).toFixed(2)}π</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No purchases yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center gap-2">
          <Button asChild variant="outline"><Link href="/marketplace">Browse NFTs</Link></Button>
          <Button asChild><Link href="/profile">Back to Profile</Link></Button>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
