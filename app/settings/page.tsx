"use client"

import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Mail, 
  Bell, 
  Shield, 
  CreditCard, 
  User, 
  Palette,
  Moon,
  Sun,
  Globe,
  Download,
  Smartphone,
  Lock,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle
} from "lucide-react"
import { useStore } from "@/lib/store"
import Link from "next/link"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function SettingsPage() {
  const user = useStore((state) => state.user)
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const { theme, setTheme } = useTheme()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Mock subscription data - in real app, this would come from an API
  const subscriptionData = {
    plan: "Collector Elite",
    status: "active",
    price: 10,
    period: "month",
    nextBilling: "Jan 15, 2024",
    startDate: "Dec 1, 2023",
    features: [
      "Ad-free streaming",
      "Offline downloads",
      "HD audio quality",
      "Early access to new drops",
      "Exclusive collector badge",
      "Priority access to limited editions"
    ],
    history: [
      { id: "1", date: "Dec 1, 2023", plan: "Collector Elite", amount: 10, status: "completed" },
      { id: "2", date: "Nov 1, 2023", plan: "Collector Premium", amount: 5, status: "completed" },
      { id: "3", date: "Oct 1, 2023", plan: "Free", amount: 0, status: "completed" },
    ]
  }

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    // Simulate API call
    setTimeout(() => {
      setIsCancelling(false)
      setCancelDialogOpen(false)
      // In real app, update subscription status here
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Subscription Management - Now First Tab */}
          <TabsContent value="subscription" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your premium plan and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{subscriptionData.plan}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={subscriptionData.status === "active" ? "default" : "secondary"}>
                            {subscriptionData.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {subscriptionData.price}π per {subscriptionData.period}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Next billing</p>
                      <p className="font-semibold">{subscriptionData.nextBilling}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Subscription Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Started</span>
                          <span>{subscriptionData.startDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Billing Cycle</span>
                          <span>Monthly</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method</span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            Pi Wallet
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Plan Features</h4>
                      <div className="space-y-1">
                        {subscriptionData.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {subscriptionData.features.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{subscriptionData.features.length - 3} more features
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/subscribe" className="flex-1">
                      <Button className="w-full">Change Plan</Button>
                    </Link>
                    
                    <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          Cancel Subscription
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Subscription</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel your subscription? You'll lose access to premium features immediately.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">What happens when you cancel:</p>
                              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                                <li>Immediate loss of premium features</li>
                                <li>No further charges</li>
                                <li>Can resubscribe anytime</li>
                                <li>Downloaded content remains accessible</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Keep Subscription
                          </Button>
                          <Button variant="destructive" onClick={handleCancelSubscription} disabled={isCancelling}>
                            {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Billing History</h4>
                    <div className="space-y-3">
                      {subscriptionData.history.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{item.plan}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{item.amount > 0 ? `${item.amount}π` : "Free"}</p>
                            <Badge variant="secondary" className="text-xs">
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Payment Methods</h4>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Pi Wallet</p>
                              <p className="text-xs text-muted-foreground">Primary payment method</p>
                            </div>
                          </div>
                          <Badge variant="outline">Default</Badge>
                        </div>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Add Payment Method
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Download className="w-4 h-4 mr-2" />
                            Download Invoices
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Need Help with Your Subscription?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Contact our support team for billing issues, plan changes, or any questions.
                  </p>
                  <a href="mailto:Aegon23@icloud.com">
                    <Button variant="outline" className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Billing Support
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{user?.username || "Guest"}</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="role">Account Type</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium capitalize">{user?.role || "Collector"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">Edit Profile</Button>
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
                    <Label htmlFor="notifications" className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">Receive notifications about new content</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-updates" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">Get updates about platform news</p>
                  </div>
                  <Switch
                    id="email-updates"
                    checked={emailUpdates}
                    onCheckedChange={setEmailUpdates}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Manage your privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Data & Privacy</Label>
                  <p className="text-sm text-muted-foreground">
                    Control how your data is used and stored
                  </p>
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Privacy Settings
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Label>Download Your Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Request a copy of your personal data
                  </p>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Request Data Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>Customize how Aurafloor looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode" className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Theme Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark theme
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className={`w-4 h-4 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
                    <Switch
                      id="dark-mode"
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                    <Moon className={`w-4 h-4 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                </div>

                <div className="grid gap-4">
                  <h4 className="font-medium">Theme Preview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        theme === "light" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setTheme("light")}
                    >
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

                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        theme === "dark" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setTheme("dark")}
                    >
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

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Display Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="font-size">Font Size</Label>
                        <p className="text-sm text-muted-foreground">Adjust text size</p>
                      </div>
                      <select className="border rounded-lg px-3 py-1 text-sm">
                        <option>Default</option>
                        <option>Large</option>
                        <option>Larger</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="animations">Animations</Label>
                        <p className="text-sm text-muted-foreground">Enable interface animations</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Settings */}
          <TabsContent value="support" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Help & Support</CardTitle>
                <CardDescription>Get help and contact us</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <h4 className="font-medium">Contact Us</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Have questions or need help? Reach out to our support team.
                  </p>
                  <a href="mailto:Aegon23@icloud.com">
                    <Button className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Support: Aegon23@icloud.com
                    </Button>
                  </a>
                </div>

                <div className="grid gap-2">
                  <h4 className="font-medium">Help Resources</h4>
                  <div className="grid gap-2">
                    {[
                      { title: "FAQs", description: "Frequently asked questions" },
                      { title: "User Guide", description: "How to use Aurafloor" },
                      { title: "Community", description: "Join our community forum" },
                      { title: "Terms of Service", description: "Platform rules and policies" },
                    ].map((resource, index) => (
                      <Button key={index} variant="outline" className="justify-start h-auto py-3">
                        <div className="text-left">
                          <p className="font-medium">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">{resource.description}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">About Aurafloor</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Version</span>
                      <span className="text-sm font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm font-medium">Dec 2023</span>
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
