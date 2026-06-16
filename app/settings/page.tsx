"use client"

import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Mail, Bell, Shield, CreditCard, User, Palette, Moon, Sun, Download, Lock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import { useStore } from "@/lib/store"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function SettingsPage() {
  const user = useStore((state) => state.user)
  const fontSize = useStore((state) => state.fontSize)
  const animations = useStore((state) => state.animations)
  const setFontSize = useStore((state) => state.setFontSize)
  const setAnimations = useStore((state) => state.setAnimations)

  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const { theme, setTheme } = useTheme()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };
  useEffect(() => {
    async function fetchSubscription() {
      if (!user?.piaddr) return
      try {
        const response = await fetch(`/api/subscription/update?user_pi_address=${user.piaddr}`)
        const data = await response.json()
        if (data.success) setSubscription(data.subscription)
      } catch (error) { console.error('Failed to fetch subscription:', error) }
      finally { setLoading(false) }
    }
    fetchSubscription()
  }, [user])

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    setTimeout(() => { setIsCancelling(false); setCancelDialogOpen(false) }, 1500)
  }

  const handleDataExport = async () => {
    alert("Data export feature coming soon. You will receive an email with your data.")
  }

  const handleEmailSupport = () => {
    window.location.href = "mailto:aegon23@icloud.com?subject=Aurafloor%20Support%20Request";
  }
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your account preferences and settings</p>
        </div>

        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-1">
            <TabsTrigger value="subscription" className="text-xs sm:text-sm">Subscription</TabsTrigger>
            <TabsTrigger value="account" className="text-xs sm:text-sm">Account</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs sm:text-sm">Appearance</TabsTrigger>
            <TabsTrigger value="support" className="text-xs sm:text-sm">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your premium plan and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading subscription...</p>
                  </div>
                ) : subscription ? (
                  <>
                    <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base sm:text-lg">{subscription.plan_name || 'Free Tier'}</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                              <Badge variant={subscription.status === "active" ? "default" : "secondary"} className="w-fit">
                                {subscription.status || 'Active'}
                              </Badge>
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {subscription.tier === 'free' ? 'Free' : `${subscription.price_pi || 0}π per month`}
                              </span>
                            </div>
                          </div>
                        </div>
                        {subscription.expires_at && (
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm text-muted-foreground">Next billing</p>
                            <p className="font-semibold text-sm sm:text-base">{new Date(subscription.expires_at).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Subscription Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Plan Fee</span>
                              <span className="font-medium text-green-600">{subscription.commission_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Paid</span>
                              <span>{subscription.total_paid || 0}π</span>
                            </div>
                            {subscription.tier !== 'free' && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Payment Method</span>
                                <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />Pi Wallet</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Plan Features</h4>
                          <div className="space-y-1">
                            {subscription.tier === 'free' ? (
                              <div className="text-sm text-muted-foreground">Upgrade to unlock premium features</div>
                            ) : (
                              <>
                                {subscription.has_analytics && <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-green-500" /><span>Advanced Analytics</span></div>}
                                {subscription.has_ad_free && <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-green-500" /><span>Ad-Free Experience</span></div>}
                                {subscription.has_early_access && <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-green-500" /><span>Early Access</span></div>}
                                {subscription.has_priority_support && <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-green-500" /><span>Priority Support</span></div>}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/subscribe" className="flex-1">
                          <Button className="w-full text-sm sm:text-base">{subscription.tier === 'free' ? 'Upgrade Now' : 'Change Plan'}</Button>
                        </Link>
                        {subscription.tier !== 'free' && (
                          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="flex-1 text-sm sm:text-base">Cancel Subscription</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Cancel Subscription</DialogTitle>
                                <DialogDescription>Are you sure? You'll lose access to premium features immediately.</DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">What happens when you cancel:</p>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                                      <li>Platform fees return to 10%</li>
                                      <li>Loss of premium features</li>
                                      <li>No further charges</li>
                                      <li>Can resubscribe anytime</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="w-full sm:w-auto">Keep Subscription</Button>
                                <Button variant="destructive" onClick={handleCancelSubscription} disabled={isCancelling} className="w-full sm:w-auto">
                                  {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm sm:text-base mb-3">Need Help?</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4">Contact support for billing questions or issues.</p>
                      <Button variant="outline" className="w-full text-sm sm:text-base" onClick={handleEmailSupport}>
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Support
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Unable to load subscription</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your Pi wallet address and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm sm:text-base">{user?.username || "Guest"}</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wallet" className="text-sm sm:text-base">Pi Wallet Address</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm sm:text-base font-mono">
                      {user?.piaddr ? truncateAddress(user.piaddr) : "Not connected"}
                    </span>
                    {user?.piaddr && (
                      <Badge variant="outline" className="ml-auto text-xs">Primary</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is the only address associated with your account. Use the same wallet for all transactions.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-sm sm:text-base">Account Type</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm sm:text-base capitalize">{user?.role || "Collector"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Control how we notify you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications" className="flex items-center gap-2 text-sm sm:text-base">
                      <Bell className="w-4 h-4" />
                      Push Notifications
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receive notifications about new content</p>
                  </div>
                  <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-updates" className="flex items-center gap-2 text-sm sm:text-base">
                      <Mail className="w-4 h-4" />
                      Email Updates
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">Coming soon - we don't collect emails yet</p>
                  </div>
                  <Switch id="email-updates" disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Manage your privacy settings and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm sm:text-base">Privacy Policy</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Review how we handle your data</p>
                  <Button variant="outline" className="w-full justify-start text-sm sm:text-base" asChild>
                    <Link href="/privacy">
                      <Lock className="w-4 h-4 mr-2" />
                      View Privacy Policy
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm sm:text-base">Download Your Data</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Request a copy of your personal data</p>
                  <Button variant="outline" className="w-full justify-start text-sm sm:text-base" onClick={handleDataExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Request Data Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>Customize how Aurafloor looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode" className="flex items-center gap-2 text-sm sm:text-base">
                      <Palette className="w-4 h-4" />
                      Theme Mode
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">Switch between light and dark theme</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className={`w-4 h-4 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
                    <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
                    <Moon className={`w-4 h-4 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm sm:text-base">Font Size</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={fontSize === 'default' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFontSize('default')}
                      className="text-sm"
                    >
                      Default
                    </Button>
                    <Button
                      variant={fontSize === 'large' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFontSize('large')}
                      className="text-lg"
                    >
                      Large
                    </Button>
                    <Button
                      variant={fontSize === 'larger' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFontSize('larger')}
                      className="text-xl"
                    >
                      Larger
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="animations" className="text-sm sm:text-base">Animations</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">Enable interface animations</p>
                  </div>
                  <Switch id="animations" checked={animations} onCheckedChange={setAnimations} />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm sm:text-base mb-3">Theme Preview</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${theme === "light" ? "border-primary bg-primary/5" : "border-border"}`} onClick={() => setTheme("light")}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-8 bg-white border rounded mt-2"></div>
                      </div>
                      <div className="text-center mt-3">
                        <p className="text-sm font-medium">Light Mode</p>
                      </div>
                    </div>
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${theme === "dark" ? "border-primary bg-primary/5" : "border-border"}`} onClick={() => setTheme("dark")}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-700 rounded"></div>
                        <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-8 bg-gray-800 border border-gray-700 rounded mt-2"></div>
                      </div>
                      <div className="text-center mt-3">
                        <p className="text-sm font-medium">Dark Mode</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Help & Support</CardTitle>
                <CardDescription>Get help and contact us</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <h4 className="font-medium text-sm sm:text-base">Contact Us</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">Have questions or need help? Reach out to our support team.</p>
                  <Button className="w-full text-sm sm:text-base" onClick={handleEmailSupport}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                </div>

                <div className="grid gap-2">
                  <h4 className="font-medium text-sm sm:text-base">Help Resources</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { title: "Community", href: "/community", description: "Join our community forum" },
                      { title: "Terms of Service", href: "/terms", description: "Platform rules and policies" },
                      { title: "Privacy Policy", href: "/privacy", description: "How we handle your data" },
                      { title: "Copyright Policy", href: "/copyright", description: "IP rights and takedowns" },
                      { title: "Fee Structure", href: "/fees", description: "Transparent fee breakdown" }
                    ].map((resource, index) => (
                      <Button key={index} variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                        <Link href={resource.href}>
                          <div>
                            <p className="font-medium text-sm">{resource.title}</p>
                            <p className="text-xs text-muted-foreground">{resource.description}</p>
                          </div>
                        </Link>
                      </Button>
                    ))}
                    <Button variant="outline" className="justify-start h-auto py-3 text-left" asChild>
                      <Link href="/rewards">
                        <div>
                          <p className="font-medium text-sm">AURA Rewards</p>
                          <p className="text-xs text-muted-foreground">Earn tokens for participation</p>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm sm:text-base mb-3">About Aurafloor</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Version</span>
                      <span className="text-xs sm:text-sm font-medium">0.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-xs sm:text-sm font-medium">Feb 2026</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <MobileNav />
    </div>
  )
}
