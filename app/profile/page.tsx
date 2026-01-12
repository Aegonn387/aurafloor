"use client"

import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, LogOut, Music2, Heart, Users, TrendingUp, Eye, ShoppingCart, Crown, Upload } from "lucide-react"
import { useStore } from "@/lib/store"
import { mockTracks } from "@/lib/mock-data"
import { NFTCard } from "@/components/nft-card"
import { InlineWallet } from "@/components/inline-wallet"
import Link from "next/link"
import { useState, useRef } from "react"

export default function ProfilePage() {
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ownedTracks = mockTracks.filter((t) => t.owned)

  const handleLogout = () => {
    setUser(null)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (user?.role === "collector") {
    return (
      <div className="min-h-screen bg-background pb-16 sm:pb-20">
        <Header />
        
        {/* Hidden file input for image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        <main className="container px-3 xs:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
                <div className="relative group">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 cursor-pointer" onClick={triggerFileInput}>
                    {profileImage ? (
                      <AvatarImage src={profileImage} alt={user?.username || "User"} />
                    ) : null}
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
                    <Badge variant="secondary" className="text-xs">Collector</Badge>
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">@{user?.username?.toLowerCase() || "guest"}</p>
                </div>
              </div>

              {/* Wallet Section - EXACT InlineWallet component as provided */}
              <InlineWallet mode="collector" connected={true} />

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
              <TabsTrigger value="collection" className="text-xs sm:text-sm">Collection</TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs sm:text-sm">Favorites</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="collection" className="space-y-4 mt-6">
              {ownedTracks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ownedTracks.map((track) => (
                    <NFTCard key={track.id} track={track} onTip={() => {}} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Music2 className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
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
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                  <p className="text-sm text-muted-foreground">Heart NFTs to save them here</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">Your latest actions on Aurafloor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: ShoppingCart, label: "Purchased 'Urban Pulse'", time: "2 hours ago" },
                    { icon: Heart, label: "Favorited 'Jazz After Dark'", time: "1 day ago" },
                    { icon: Music2, label: "Streamed 'Neon Dreams'", time: "2 days ago" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <activity.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
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

          {/* Premium Subscription Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Premium Subscription
                </CardTitle>
                <CardDescription className="text-sm">Manage your premium features</CardDescription>
              </div>
              <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-xs">
                Active
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Collector Elite</p>
                    <p className="text-sm text-muted-foreground">10π/month • Next billing: Jan 15, 2024</p>
                  </div>
                  <Link href="/settings">
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
    <div className="min-h-screen bg-background pb-16 sm:pb-20">
      <Header />
      
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <main className="container px-3 xs:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
              <div className="relative group">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 cursor-pointer" onClick={triggerFileInput}>
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={user?.username || "User"} />
                  ) : null}
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
                  <Badge className="text-xs">Creator</Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">@{user?.username?.toLowerCase() || "guest"}</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Wallet Card for Creator - EXACT InlineWallet component as provided */}
          <div className="sm:col-span-2 lg:col-span-2">
            <InlineWallet mode="creator" connected={true} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-sm">
                <Eye className="w-4 h-4" />
                Total Streams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">12.4K</div>
              <p className="text-xs text-muted-foreground mt-1">+234 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-sm">
                <Users className="w-4 h-4" />
                Followers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">1,248</div>
              <p className="text-xs text-muted-foreground mt-1">+42 this week</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                <CardDescription className="text-sm">Your earnings sources</CardDescription>
              </div>
              <Link href="/mint">
                <Button size="sm">Mint New NFT</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">NFT Sales (90%)</p>
                    <p className="text-xs text-muted-foreground">Primary + Resale royalties</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-sm sm:text-base">324.8π</p>
                  <p className="text-xs text-muted-foreground">12 sales</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ad Revenue (40%)</p>
                    <p className="text-xs text-muted-foreground">From free-tier streams</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent text-sm sm:text-base">89.2π</p>
                  <p className="text-xs text-muted-foreground">3.2K streams</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tips</p>
                    <p className="text-xs text-muted-foreground">Direct support from fans</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-pink-500 text-sm sm:text-base">68.5π</p>
                  <p className="text-xs text-muted-foreground">24 tips</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/mint">
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Music2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Mint New NFT</h3>
                <p className="text-sm text-muted-foreground">Upload and sell your audio</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/promote">
            <Card className="hover:border-accent transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Promote Content</h3>
                <p className="text-sm text-muted-foreground">Boost your NFT visibility</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="w-5 h-5 text-purple-500" />
                  Creator Subscription
                </CardTitle>
                <CardDescription className="text-sm">Advanced tools and analytics</CardDescription>
              </div>
              <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                Creator Pro
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Creator Pro Plan</p>
                  <p className="text-sm text-muted-foreground">20π/month • Next billing: Jan 15, 2024</p>
                </div>
                <Link href="/settings">
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
