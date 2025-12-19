"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useStore } from "@/lib/store"
import { mockTracks } from "@/lib/mock-data"
import { Megaphone, Target, TrendingUp, Eye, Zap, CheckCircle2, Music2, ArrowRight, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PromotePage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const [step, setStep] = useState(1)
  const [selectedNFT, setSelectedNFT] = useState("")
  const [duration, setDuration] = useState("7")
  const [budget, setBudget] = useState("50")
  const [targetAudience, setTargetAudience] = useState("")
  const [promotionGoal, setPromotionGoal] = useState("")

  if (user?.role !== "creator") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container px-4 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Creator Access Only</h2>
              <p className="text-muted-foreground mb-6">
                Promotion features are available for creators. Switch to a creator account to promote your content.
              </p>
              <Button onClick={() => router.push("/")}>Go to Homepage</Button>
            </CardContent>
          </Card>
        </main>
        <MobileNav />
      </div>
    )
  }

  const creatorNFTs = mockTracks.filter((t) => user?.role === "creator")
  const totalSteps = 4
  const progress = (step / totalSteps) * 100
  const estimatedCost = Number.parseInt(budget) * Number.parseInt(duration)

  const handleSubmit = () => {
    // Simulate submission
    setStep(5)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Promote Your Content</h1>
          <p className="text-muted-foreground">Get your NFTs featured on the homepage and marketplace</p>
        </div>

        {step < 5 && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    Step {step} of {totalSteps}
                  </span>
                  <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music2 className="w-5 h-5" />
                Select NFT to Promote
              </CardTitle>
              <CardDescription>Choose which NFT you want to feature</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nft-select">Your NFTs</Label>
                <Select value={selectedNFT} onValueChange={setSelectedNFT}>
                  <SelectTrigger id="nft-select">
                    <SelectValue placeholder="Select an NFT" />
                  </SelectTrigger>
                  <SelectContent>
                    {creatorNFTs.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        <div className="flex items-center gap-2">
                          <Music2 className="w-4 h-4" />
                          <span>{track.title}</span>
                          <Badge variant="outline" className="ml-2">
                            {track.price}π
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedNFT && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={creatorNFTs.find((t) => t.id === selectedNFT)?.coverUrl || "/placeholder.svg"}
                        alt="NFT Cover"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{creatorNFTs.find((t) => t.id === selectedNFT)?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {creatorNFTs.find((t) => t.id === selectedNFT)?.category}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {creatorNFTs.find((t) => t.id === selectedNFT)?.price}π
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={() => setStep(2)} disabled={!selectedNFT} className="w-full">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Campaign Details
              </CardTitle>
              <CardDescription>Set your promotion duration and budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Promotion Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days (Recommended)</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Daily Budget (π)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="50"
                  min="10"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Minimum 10π per day
                </p>
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Budget:</span>
                    <span className="font-semibold">{budget}π</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration:</span>
                    <span className="font-semibold">{duration} days</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total Cost:</span>
                    <span className="text-xl font-bold text-primary">{estimatedCost}π</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Targeting & Goals
              </CardTitle>
              <CardDescription>Define your target audience and campaign goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="goal">Promotion Goal</Label>
                <Select value={promotionGoal} onValueChange={setPromotionGoal}>
                  <SelectTrigger id="goal">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Increase Sales</SelectItem>
                    <SelectItem value="awareness">Build Awareness</SelectItem>
                    <SelectItem value="engagement">Drive Engagement</SelectItem>
                    <SelectItem value="followers">Gain Followers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="collectors">Collectors</SelectItem>
                    <SelectItem value="music-lovers">Music Lovers</SelectItem>
                    <SelectItem value="podcast-fans">Podcast Fans</SelectItem>
                    <SelectItem value="genre-specific">Genre-Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Promotion Message (Optional)</Label>
                <Textarea id="message" placeholder="Add a custom message to highlight your NFT..." rows={3} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!promotionGoal || !targetAudience} className="flex-1">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Review & Confirm
              </CardTitle>
              <CardDescription>Review your promotion before launching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Selected NFT</p>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <img
                          src={creatorNFTs.find((t) => t.id === selectedNFT)?.coverUrl || "/placeholder.svg"}
                          alt="NFT"
                          className="w-16 h-16 rounded-lg"
                        />
                        <div>
                          <p className="font-semibold">{creatorNFTs.find((t) => t.id === selectedNFT)?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {creatorNFTs.find((t) => t.id === selectedNFT)?.artist}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="font-semibold">{duration} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Daily Budget</p>
                    <p className="font-semibold">{budget}π</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Goal</p>
                    <p className="font-semibold capitalize">{promotionGoal.replace("-", " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Audience</p>
                    <p className="font-semibold capitalize">{targetAudience.replace("-", " ")}</p>
                  </div>
                </div>

                <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Campaign Cost</p>
                    <p className="text-4xl font-bold text-primary mb-2">{estimatedCost}π</p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Est. 2.5k+ views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Homepage Featured</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  Launch Campaign
                  <Megaphone className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Campaign Launched!</h2>
              <p className="text-muted-foreground mb-8">
                Your NFT promotion is now live. You'll start seeing results within 24 hours.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <Eye className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">Active</p>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3 justify-center">
                <Link href="/profile">
                  <Button variant="outline">View Dashboard</Button>
                </Link>
                <Button onClick={() => setStep(1)}>Promote Another</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Why Promote?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Homepage Featured</p>
                  <p className="text-sm text-muted-foreground">
                    Get priority placement in the promoted section on homepage
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Maximum Visibility</p>
                  <p className="text-sm text-muted-foreground">
                    Reach thousands of collectors browsing the marketplace
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Boost Sales</p>
                  <p className="text-sm text-muted-foreground">
                    Increase your NFT sales with targeted promotion campaigns
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  )
}
