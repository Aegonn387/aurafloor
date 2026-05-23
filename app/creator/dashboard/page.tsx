"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, DollarSign, Music2, Eye, Users, Download, ArrowUpRight, Lock } from "lucide-react"
import { useStore } from "@/lib/store"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function CreatorDashboard() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [revenue, setRevenue] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [period, setPeriod] = useState('30')
  const [analyticsBlocked, setAnalyticsBlocked] = useState(false)

  useEffect(() => {
    if (user?.role !== 'creator') {
      router.push('/profile')
      return
    }
    fetchDashboardData()
  }, [user, period])

  async function fetchDashboardData() {
    if (!user?.uid || !user?.piaddr) return
    setLoading(true)
    setAnalyticsBlocked(false)
    try {
      const [analyticsRes, revenueRes, subRes] = await Promise.all([
        fetch(`/api/analytics/creator/${user.uid}?period=${period}&user_pi_address=${user.piaddr}`),
        fetch('/api/revenue/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, period })
        }),
        fetch(`/api/subscription/update?user_pi_address=${user.piaddr}`)
      ])

      const analyticsData = await analyticsRes.json()
      const revenueData = await revenueRes.json()
      const subData = await subRes.json()

      // Check if analytics was blocked
      if (analyticsData.upgrade_required) {
        setAnalyticsBlocked(true)
      } else if (analyticsData.success) {
        setAnalytics(analyticsData.analytics)
      }

      if (revenueData.success) setRevenue(revenueData.revenue)
      if (subData.success) setSubscription(subData.subscription)
    } catch (error) {
      console.error('Dashboard fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const revenueChartData = revenue?.daily?.slice(0, 30).reverse().map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(item.amount || 0)
  })) || []

  const streamChartData = analytics?.stream_stats?.slice(0, 30).reverse().map((stat: any) => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    streams: parseInt(stat.streams || 0),
    listeners: parseInt(stat.unique_listeners || 0)
  })) || []

  const hasAnalyticsAccess = subscription?.has_analytics && !analyticsBlocked

  if (!user || user.role !== 'creator') {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Creator Dashboard</h1>
            <p className="text-muted-foreground">Track your performance and earnings</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg bg-background">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <Button variant="outline" size="sm" disabled={!hasAnalyticsAccess}>
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
          </div>
        </div>

        {subscription && (
          <Card className={subscription.tier !== 'free' ? 'border-primary' : 'border-amber-500'}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <p className="font-medium">{subscription.plan_name || 'Free Tier'}</p>
                    <p className="text-muted-foreground text-xs">
                      Platform fee: {subscription.commission_rate}%
                      {subscription.tier === 'free' && ' • Analytics locked'}
                    </p>
                  </div>
                </div>
                {subscription.tier === 'free' ? (
                  <Button asChild size="sm"><Link href="/subscribe">Upgrade & Save 50%</Link></Button>
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenue?.totals?.total_revenue?.toFixed(2) || '0.00'}π</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <span className="text-green-600">+12.5%</span> from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {hasAnalyticsAccess ? (
                <>
                  <div className="text-2xl font-bold">{analytics?.summary?.total_plays || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all NFTs</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-500" />
                    ---
                  </div>
                  <p className="text-xs text-amber-600 mt-1">Upgrade required</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">NFTs Sold</CardTitle>
              <Music2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {hasAnalyticsAccess ? (
                <>
                  <div className="text-2xl font-bold">{analytics?.summary?.total_sales || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{analytics?.summary?.total_nfts || 0} total minted</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-500" />
                    ---
                  </div>
                  <p className="text-xs text-amber-600 mt-1">Upgrade required</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unique Listeners</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {hasAnalyticsAccess ? (
                <>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-500" />
                    ---
                  </div>
                  <p className="text-xs text-amber-600 mt-1">Upgrade required</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="nfts">Top NFTs</TabsTrigger>
            <TabsTrigger value="streams">Streams</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {!hasAnalyticsAccess ? (
              <Card className="border-amber-500 bg-amber-500/5">
                <CardContent className="py-12 text-center">
                  <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Advanced Analytics Locked</h3>
                  <p className="text-muted-foreground mb-6">Upgrade to Premium or Premium+ to unlock detailed charts, insights, and revenue tracking</p>
                  <div className="flex justify-center gap-3">
                    <Button asChild size="lg"><Link href="/subscribe">View Plans</Link></Button>
                    <Button asChild variant="outline" size="lg"><Link href="/profile">Back to Profile</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Daily earnings over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-16">No revenue data yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stream Activity</CardTitle>
                    <CardDescription>Streams and listeners daily</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {streamChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={streamChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="streams" fill="#3b82f6" />
                          <Bar dataKey="listeners" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-16">No stream data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Income by source</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenue?.by_type && revenue.by_type.length > 0 ? (
                    <div className="space-y-3">
                      {revenue.by_type.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium capitalize">{item.type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">{item.transaction_count} transactions</p>
                          </div>
                          <p className="font-bold">{parseFloat(item.total_amount).toFixed(2)}π</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No revenue data yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ad Revenue</CardTitle>
                  <CardDescription>Earnings from streaming ads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{analytics?.ad_revenue?.total_ad_revenue?.toFixed(2) || '0.00'}π</div>
                  <p className="text-sm text-muted-foreground">{analytics?.ad_revenue?.periods_paid || 0} payout periods</p>
                  {subscription?.tier === 'free' && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">50% of ad revenue goes to the Creator Pool, distributed weekly based on your share of impressions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest earnings</CardDescription>
              </CardHeader>
              <CardContent>
                {revenue?.daily && revenue.daily.length > 0 ? (
                  <div className="space-y-2">
                    {revenue.daily.slice(0, 10).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium capitalize">{item.type.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <p className="font-bold text-green-600">+{parseFloat(item.amount).toFixed(2)}π</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-4">
            {!hasAnalyticsAccess ? (
              <Card className="border-amber-500 bg-amber-500/5">
                <CardContent className="py-12 text-center">
                  <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Top NFTs analytics require Premium subscription</p>
                  <Button asChild><Link href="/subscribe">Upgrade Now</Link></Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing NFTs</CardTitle>
                  <CardDescription>Your best-selling tracks</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.top_nfts && analytics.top_nfts.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.top_nfts.map((nft: any, index: number) => (
                        <div key={nft.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded flex items-center justify-center font-bold text-primary">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{nft.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>{nft.play_count} plays</span>
                              <span>{nft.like_count} likes</span>
                              <span>{nft.sold_count} sold</span>
                            </div>
                          </div>
                          <p className="font-bold">{nft.price}π</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No NFTs minted yet</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="streams" className="space-y-4">
            {!hasAnalyticsAccess ? (
              <Card className="border-amber-500 bg-amber-500/5">
                <CardContent className="py-12 text-center">
                  <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Stream analytics require Premium subscription</p>
                  <Button asChild><Link href="/subscribe">Upgrade Now</Link></Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Stream Analytics</CardTitle>
                  <CardDescription>Daily listening activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.stream_stats && analytics.stream_stats.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.stream_stats.map((stat: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                          <p className="text-sm">{new Date(stat.date).toLocaleDateString()}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>{stat.streams} streams</span>
                            <span className="text-muted-foreground">{stat.unique_listeners} listeners</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No stream data yet</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-center gap-2">
          <Button asChild variant="outline"><Link href="/mint">Mint New NFT</Link></Button>
          <Button asChild><Link href="/profile">Back to Profile</Link></Button>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
