"use client"

import { useState, useEffect } from "react"
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
import { Megaphone, Target, TrendingUp, Eye, Zap, CheckCircle2, Music2, ArrowRight, Info, Flame, Coins } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePiPayment } from "@/hooks/usePiPayment"

interface NFT {
  id: string
  title: string
  crid: string
  ownerid: string
  genre: string | null
  price: number
  cimg: string | null
}

export default function PromotePage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const { createPayment } = usePiPayment()
  const [step, setStep] = useState(1)
  const [selectedNFT, setSelectedNFT] = useState("")
  const [duration, setDuration] = useState("7")
  const [budget, setBudget] = useState("100")
  const [paymentMethod, setPaymentMethod] = useState<"pi"|"aura">("pi")
  const [targetAudience, setTargetAudience] = useState("")
  const [promotionGoal, setPromotionGoal] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [creatorNFTs, setCreatorNFTs] = useState<NFT[]>([])
  const [nftsLoading, setNftsLoading] = useState(true)

  const isSubscriber = (user as any)?.subscription?.tier !== 'free'
  const minBudget = paymentMethod === 'aura' ? (isSubscriber ? 50 : 100) : 10
  const totalCost = Number(budget) * Number(duration)

  if (user?.role !== "creator") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container px-4 py-12">
          <Card><CardContent className="p-12 text-center">
            <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Creator Access Only</h2>
            <p className="text-muted-foreground mb-6">Promotion features are available for creators.</p>
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
          </CardContent></Card>
        </main>
        <MobileNav />
      </div>
    )
  }

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setNftsLoading(true)
        const res = await fetch(`/api/nfts?uid=${user?.piuser}`)
        if (!res.ok) throw new Error("Failed to fetch NFTs")
        const data = await res.json()
        setCreatorNFTs(data.nfts || data || [])
      } catch (error) { console.error(error) }
      finally { setNftsLoading(false) }
    }
    if (user?.piuser) fetchNFTs()
  }, [user?.piuser])

  if (nftsLoading) {
    return (<div className="min-h-screen bg-background pb-20"><Header /><main className="container px-4 py-12"><Card><CardContent className="p-12 text-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /><p className="text-muted-foreground">Loading your NFTs...</p></div></CardContent></Card></main><MobileNav /></div>)
  }
  if (creatorNFTs.length === 0) {
    return (<div className="min-h-screen bg-background pb-20"><Header /><main className="container px-4 py-12"><Card><CardContent className="p-12 text-center"><Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">No NFTs Found</h2><p className="text-muted-foreground mb-6">You haven't minted any NFTs yet. Create your first NFT to start promoting.</p><Button onClick={() => router.push("/mint")}>Mint Your First NFT</Button></CardContent></Card></main><MobileNav /></div>)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Promote Your Content</h1>
          <p className="text-muted-foreground">Boost your NFT visibility. Pay with Pi or burn AURA.</p>
        </div>
        {step < 5 && (
          <Card><CardContent className="p-6"><div className="space-y-2 mb-6"><div className="flex justify-between text-sm"><span className="font-medium">Step {step} of 4</span></div><Progress value={(step/4)*100} className="h-2" /></div></CardContent></Card>
        )}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Music2 className="w-5 h-5" />Select NFT to Promote</CardTitle><CardDescription>Choose which NFT to feature</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Your NFTs</Label>
                <Select value={selectedNFT} onValueChange={setSelectedNFT}>
                  <SelectTrigger><SelectValue placeholder="Select an NFT" /></SelectTrigger>
                  <SelectContent>
                    {creatorNFTs.map((nft) => (<SelectItem key={nft.id} value={nft.id}><div className="flex items-center gap-2"><Music2 className="w-4 h-4" /><span>{nft.title}</span><Badge variant="outline" className="ml-2">{nft.price}Ï€</Badge></div></SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setStep(2)} disabled={!selectedNFT} className="w-full">Continue<ArrowRight className="w-4 h-4 ml-2" /></Button>
            </CardContent>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" />Campaign Details</CardTitle><CardDescription>Set duration, budget, and payment method</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={paymentMethod==="pi"?"default":"outline"} onClick={()=>setPaymentMethod("pi")} className="gap-2"><Coins className="w-4 h-4"/>Pay with Pi</Button>
                  <Button variant={paymentMethod==="aura"?"default":"outline"} onClick={()=>setPaymentMethod("aura")} className="gap-2"><Flame className="w-4 h-4"/>Burn AURA</Button>
                </div>
              </div>
              <div className="space-y-2"><Label>Promotion Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="3">3 days</SelectItem><SelectItem value="7">7 days (Recommended)</SelectItem><SelectItem value="14">14 days</SelectItem><SelectItem value="30">30 days</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Daily Budget ({paymentMethod==="pi"?"Ï€":"AURA"})</Label>
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="100" min={minBudget} />
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" />Minimum {minBudget} {paymentMethod==="pi"?"Ï€":"AURA"}/day {isSubscriber && paymentMethod==="aura" && <span className="text-green-600">(50% subscriber discount)</span>}</p>
              </div>
              <Card className={paymentMethod==="pi"?"bg-primary/5 border-primary/20":"bg-orange-500/10 border-orange-500/20"}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span>Daily Budget:</span><span className="font-semibold">{budget} {paymentMethod==="pi"?"Ï€":"AURA"}</span></div>
                  <div className="flex justify-between text-sm"><span>Duration:</span><span className="font-semibold">{duration} days</span></div>
                  <div className="border-t pt-2 flex justify-between"><span className="font-semibold">Total:</span><span className="text-xl font-bold">{totalCost} {paymentMethod==="pi"?"Ï€":"AURA"} {paymentMethod==="aura"&&<Flame className="w-4 h-4 inline text-orange-500"/>}</span></div>
                </CardContent>
              </Card>
              <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button><Button onClick={() => setStep(3)} className="flex-1">Continue<ArrowRight className="w-4 h-4 ml-2" /></Button></div>
            </CardContent>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Targeting & Goals</CardTitle><CardDescription>Define your audience and campaign goals</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label>Promotion Goal</Label>
                <Select value={promotionGoal} onValueChange={setPromotionGoal}>
                  <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                  <SelectContent><SelectItem value="sales">Increase Sales</SelectItem><SelectItem value="awareness">Build Awareness</SelectItem><SelectItem value="engagement">Drive Engagement</SelectItem><SelectItem value="followers">Gain Followers</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="collectors">Collectors</SelectItem><SelectItem value="music-lovers">Music Lovers</SelectItem><SelectItem value="podcast-fans">Podcast Fans</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Promotion Message (Optional)</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a custom message..." rows={3} /></div>
              <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button><Button onClick={() => setStep(4)} disabled={!promotionGoal || !targetAudience} className="flex-1">Continue<ArrowRight className="w-4 h-4 ml-2" /></Button></div>
            </CardContent>
          </Card>
        )}
        {step === 4 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />Review & Confirm</CardTitle><CardDescription>Review your promotion before launching</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground mb-1">Duration</p><p className="font-semibold">{duration} days</p></div>
                <div><p className="text-sm text-muted-foreground mb-1">Method</p><p className="font-semibold">{paymentMethod==="pi"?"Pi Payment":"AURA Burn"}</p></div>
                <div><p className="text-sm text-muted-foreground mb-1">Daily</p><p className="font-semibold">{budget} {paymentMethod==="pi"?"Ï€":"AURA"}</p></div>
                <div><p className="text-sm text-muted-foreground mb-1">Goal</p><p className="font-semibold capitalize">{promotionGoal}</p></div>
              </div>
              <Card className={paymentMethod==="pi"?"bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20":"bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20"}>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">{paymentMethod==="pi"?"Total Pi Cost":"Total AURA Burned"}</p>
                  <p className="text-4xl font-bold mb-2">{totalCost} {paymentMethod==="pi"?"Ï€":"AURA"} {paymentMethod==="aura"&&<Flame className="w-5 h-5 inline text-orange-500"/>}</p>
                  <p className="text-xs text-muted-foreground">{paymentMethod==="pi"?"Platform earns 100% of Pi payment.":"100% of AURA is permanently burned."}</p>
                </CardContent>
              </Card>
              <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                <Button onClick={async () => {
                  setLoading(true)
                  try {
                    if (paymentMethod === 'pi') {
                      const pid = await createPayment({
                        amount: totalCost,
                        memo: `Promote NFT for ${duration} days`,
                        metadata: { type: 'promotion', nftId: selectedNFT, duration, goal: promotionGoal, audience: targetAudience, message }
                      })
                      if (!pid) throw new Error('Payment failed')
                    }
                    const res = await fetch('/.netlify/functions/promote-content', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ nftId: selectedNFT, creatorWallet: user.piuser, amount: totalCost, duration: Number(duration), goal: promotionGoal, audience: targetAudience, message, token: paymentMethod })
                    })
                    const data = await res.json()
                    if (data.success) setStep(5)
                  } catch (e) { console.error(e) }
                  finally { setLoading(false) }
                }} disabled={loading} className="flex-1">
                  {loading ? "Processing..." : paymentMethod==="pi"?"Pay & Launch":"Burn AURA & Launch"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {step === 5 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-primary" /></div>
              <h2 className="text-2xl font-bold mb-2">Promotion Launched!</h2>
              <p className="text-muted-foreground mb-8">{paymentMethod==="pi"?`${totalCost}Ï€ has been paid.`:`${totalCost} AURA has been burned.`} Your NFT is now promoted for {duration} days.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/profile"><Button variant="outline">View Dashboard</Button></Link>
                <Button onClick={() => setStep(1)}>Promote Another</Button>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>How Promotion Works</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3"><div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0"><Coins className="w-5 h-5 text-primary" /></div><div><p className="font-semibold mb-1">Pay with Pi or Burn AURA</p><p className="text-sm text-muted-foreground">Choose Pi to support the platform, or burn AURA to reduce total supply.</p></div></div>
            <div className="flex gap-3"><div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0"><Eye className="w-5 h-5 text-primary" /></div><div><p className="font-semibold mb-1">Homepage Featured</p><p className="text-sm text-muted-foreground">Your NFT appears in the promoted carousel on the homepage.</p></div></div>
            <div className="flex gap-3"><div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center shrink-0"><Zap className="w-5 h-5 text-green-500" /></div><div><p className="font-semibold mb-1">Subscriber Discount</p><p className="text-sm text-muted-foreground">Subscribers pay only 50 AURA minimum when burning AURA.</p></div></div>
          </CardContent>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}
