"use client"

import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, LogOut, Music2, Heart, Wallet, Users, TrendingUp, Eye, ShoppingCart, Crown } from "lucide-react"
import { useStore } from "@/lib/store"
import { mockTracks } from "@/lib/mock-data"
import { NFTCard } from "@/components/nft-card"
import { WalletModal } from "@/components/wallet-modal"
import Link from "next/link"

export default function ProfilePage() {
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)

  const ownedTracks = mockTracks.filter((t) => t.owned)

  const handleLogout = () => {
    setUser(null)
  }

  if (user?.role === "collector") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />

        <main className="container px-4 py-6 space-y-6 max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
                <Avatar className="w-20 h-20 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user?.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">{user?.username || "Guest"}</h2>
                    <Badge variant="secondary">Collector</Badge>
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">@{user?.username?.toLowerCase() || "guest"}</p>
                  <p className="text-xs text-muted-foreground">Verified Pi Network User</p>
                </div>
              </div>

              <Card className="mb-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Pi Wallet</span>
                    </div>
                    <Badge variant="outline">Connected</Badge>
                  </div>
                  <div className="text-3xl font-bold mb-1">124.5π</div>
                  <p className="text-xs text-muted-foreground mb-3">Available Balance</p>
                  <div className="grid grid-cols-1 gap-2">
                    <WalletModal currentBalance={124.5}>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <Wallet className="w-4 h-4 mr-1" />
                        Manage Wallet
                      </Button>
                    </WalletModal>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{ownedTracks.length}</div>
                  <div className="text-xs text-muted-foreground">NFTs Owned</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">8</div>
                  <div className="text-xs text-muted-foreground">Favorites</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">24</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full bg-transparent">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="collection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="collection">Collection</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="collection" className="space-y-4 mt-6">
              {ownedTracks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {ownedTracks.map((track) => (
                    <NFTCard key={track.id} track={track} onTip={() => {}} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start building your collection</p>
                    <Link href="/marketplace">
                      <Button>Browse Marketplace</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4 mt-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                  <p className="text-sm text-muted-foreground">Heart NFTs to save them here</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions on Aurafloor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: ShoppingCart, label: "Purchased 'Urban Pulse'", time: "2 hours ago" },
                    { icon: Heart, label: "Favorited 'Jazz After Dark'", time: "1 day ago" },
                    { icon: Music2, label: "Streamed 'Neon Dreams'", time: "2 days ago" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <activity.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.label}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Subscription
                  </CardTitle>
                  <CardDescription>Manage your premium features</CardDescription>
                </div>
                <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-500">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Collector Elite</p>
                    <p className="text-sm text-muted-foreground">10π/month • Next billing: Jan 15, 2024</p>
                  </div>
                  <Link href="/settings">
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Ad-free streaming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Offline downloads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>HD audio quality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Early access</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container px-4 py-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
              <Avatar className="w-20 h-20 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user?.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{user?.username || "Guest"}</h2>
                  <Badge>Creator</Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">@{user?.username?.toLowerCase() || "guest"}</p>
                <p className="text-xs text-muted-foreground">Verified Pi Network Creator</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full bg-transparent">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                Total Earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary mb-1">482.5π</div>
              <p className="text-xs text-muted-foreground mb-3">+12.3π this week</p>
              <WalletModal currentBalance={482.5}>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Wallet className="w-4 h-4 mr-2" />
                  Manage Wallet
                </Button>
              </WalletModal>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Total Streams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4K</div>
              <p className="text-xs text-muted-foreground mt-1">+234 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Followers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,248</div>
              <p className="text-xs text-muted-foreground mt-1">+42 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Music2 className="w-4 h-4" />
                NFTs Minted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground mt-1">3 this month</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Your earnings sources</CardDescription>
              </div>
              <Link href="/mint">
                <Button size="sm">Mint New NFT</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">NFT Sales (90%)</p>
                    <p className="text-xs text-muted-foreground">Primary + Resale royalties</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">324.8π</p>
                  <p className="text-xs text-muted-foreground">12 sales</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ad Revenue (40%)</p>
                    <p className="text-xs text-muted-foreground">From free-tier streams</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">89.2π</p>
                  <p className="text-xs text-muted-foreground">3.2K streams</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tips</p>
                    <p className="text-xs text-muted-foreground">Direct support from fans</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-pink-500">68.5π</p>
                  <p className="text-xs text-muted-foreground">24 tips</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/mint">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Music2 className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Mint New NFT</h3>
                <p className="text-sm text-muted-foreground">Upload and sell your audio</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/promote">
            <Card className="hover:border-accent transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-12 h-12 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Promote Content</h3>
                <p className="text-sm text-muted-foreground">Boost your NFT visibility</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-500" />
                  Creator Subscription
                </CardTitle>
                <CardDescription>Advanced tools and analytics</CardDescription>
              </div>
              <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
                Creator Pro
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Creator Pro Plan</p>
                  <p className="text-sm text-muted-foreground">20π/month • Next billing: Jan 15, 2024</p>
                </div>
                <Link href="/settings">
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>AI-powered insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Auto-promotion tools</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Premium verification</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  )
}
