"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Upload, Music2, CheckCircle2, Info } from "lucide-react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { PiAuth } from "@/lib/pi-auth"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function MintPage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form state
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [resaleFee, setResaleFee] = useState("10")
  const [editionType, setEditionType] = useState("limited")
  const [totalEditions, setTotalEditions] = useState("100")
  const [moderationStatus, setModerationStatus] = useState<"pending" | "approved" | "rejected" | null>(null)
  const [moderationFeedback, setModerationFeedback] = useState("")

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAudioFile(e.target.files[0])
    }
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCoverFile(e.target.files[0])
    }
  }

  const handleContentModeration = async () => {
    if (!audioFile) return

    setLoading(true)
    setModerationStatus("pending")

    try {
      // Simulate AI content moderation check
      // In production, this would call an AI service to analyze audio content
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock moderation results - in production, use actual AI analysis
      const isAppropriate = Math.random() > 0.1 // 90% approval rate for demo

      if (isAppropriate) {
        setModerationStatus("approved")
        setModerationFeedback("Content approved! Your audio meets community guidelines.")
        setTimeout(() => setStep(2), 1500)
      } else {
        setModerationStatus("rejected")
        setModerationFeedback(
          "Content flagged: Please review community guidelines. Your audio may contain inappropriate content.",
        )
      }
    } catch (error) {
      console.error("Moderation failed:", error)
      setModerationStatus("rejected")
      setModerationFeedback("Moderation check failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async () => {
    if (!audioFile || !title || !price) return

    setLoading(true)
    try {
      const mintingFee = Number.parseFloat(price) * 0.05

      await PiAuth.createPayment({
        amount: mintingFee,
        memo: `Mint ${title} on Aurafloor (5% fee)`,
        metadata: {
          type: "mint",
          title,
          price: Number.parseFloat(price),
          resaleFee: Number.parseInt(resaleFee),
          editionType,
          totalEditions: editionType === "limited" ? Number.parseInt(totalEditions) : 0,
        },
      })

      console.log("[v0] NFT minted successfully")
      setStep(4)
      setTimeout(() => router.push("/marketplace"), 2000)
    } catch (error) {
      console.error("Minting failed:", error)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== "creator") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Music2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Creator Access Required</h1>
            <p className="text-muted-foreground mb-6">You need a creator account to mint NFTs</p>
            <Button onClick={() => router.push("/")}>Go to Home</Button>
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container px-4 py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mint Audio NFT</h1>
          <p className="text-muted-foreground">Create your exclusive audio NFT in 3 simple steps</p>
        </div>

        <div className="mb-8">
          <Progress value={(step / 4) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>Upload</span>
            <span className={step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>Details</span>
            <span className={step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>Pricing</span>
            <span className={step >= 4 ? "text-primary font-medium" : "text-muted-foreground"}>Complete</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Audio File</CardTitle>
              <CardDescription>Upload your music, podcast, or audio content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                htmlFor="audio-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Click to upload audio</p>
                <p className="text-xs text-muted-foreground">MP3, WAV, or FLAC (max 100MB)</p>
                <input id="audio-upload" type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
              </label>
              {audioFile && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{audioFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
              {moderationStatus && (
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    moderationStatus === "approved" && "bg-green-500/10 border-green-500/20",
                    moderationStatus === "rejected" && "bg-red-500/10 border-red-500/20",
                    moderationStatus === "pending" && "bg-yellow-500/10 border-yellow-500/20",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {moderationStatus === "approved" && <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />}
                    {moderationStatus === "rejected" && <Info className="w-5 h-5 text-red-500 mt-0.5" />}
                    {moderationStatus === "pending" && (
                      <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">
                        {moderationStatus === "pending" && "Moderating Content..."}
                        {moderationStatus === "approved" && "Content Approved"}
                        {moderationStatus === "rejected" && "Content Rejected"}
                      </h4>
                      <p className="text-sm text-muted-foreground">{moderationFeedback}</p>
                    </div>
                  </div>
                </div>
              )}
              <Button
                className="w-full"
                onClick={handleContentModeration}
                disabled={!audioFile || loading || moderationStatus === "approved"}
                size="lg"
              >
                {loading
                  ? "Moderating Content..."
                  : moderationStatus === "approved"
                    ? "Proceeding..."
                    : "Next: Moderate & Continue"}
              </Button>
              {moderationStatus === "rejected" && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setAudioFile(null)
                    setModerationStatus(null)
                    setModerationFeedback("")
                  }}
                  size="lg"
                >
                  Upload Different File
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>NFT Details</CardTitle>
              <CardDescription>Add information about your NFT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cover">Cover Art</Label>
                <label
                  htmlFor="cover-upload"
                  className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {coverFile ? (
                    <img
                      src={URL.createObjectURL(coverFile) || "/placeholder.svg"}
                      alt="Cover"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Upload cover art</p>
                    </div>
                  )}
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter NFT title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your audio NFT..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronic">Electronic</SelectItem>
                    <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                    <SelectItem value="Acoustic">Acoustic</SelectItem>
                    <SelectItem value="Jazz">Jazz</SelectItem>
                    <SelectItem value="EDM">EDM</SelectItem>
                    <SelectItem value="Podcast">Podcast</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} size="lg">
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={!title} size="lg">
                  Next: Set Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Royalties</CardTitle>
              <CardDescription>Set your NFT price, royalty terms, and edition details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price (π) *</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">π</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Edition Type</Label>
                <Select value={editionType} onValueChange={setEditionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limited">Limited Edition</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="unique">1 of 1 (Unique)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editionType === "limited" && (
                <div className="space-y-2">
                  <Label htmlFor="editions">Number of Copies</Label>
                  <Input
                    id="editions"
                    type="number"
                    placeholder="100"
                    value={totalEditions}
                    onChange={(e) => setTotalEditions(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Total number of NFT copies that will be available for sale
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="resale-fee">Secondary Sale Royalty (%)</Label>
                <Select value={resaleFee} onValueChange={setResaleFee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="7">7.5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="12">12.5%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You'll earn {resaleFee}% royalty on every secondary market sale (5-15% range)
                </p>
              </div>

              <Separator />

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-2">Revenue Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Primary Sale (your earnings)</span>
                        <span className="font-medium text-primary">
                          90% ({(Number.parseFloat(price || "0") * 0.9).toFixed(2)}π)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee (Primary)</span>
                        <span className="font-medium">10% ({(Number.parseFloat(price || "0") * 0.1).toFixed(2)}π)</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resale Platform Fee</span>
                        <span className="font-medium">7.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Resale Royalty</span>
                        <span className="font-medium text-primary">{resaleFee}%</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ad Revenue Share (free tier streams)</span>
                        <span className="font-medium text-primary">40%</span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2">
                        Ad revenue distributed twice monthly based on stream count
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minting Fee (5%)</span>
                  <span className="font-medium">{(Number.parseFloat(price || "0") * 0.05).toFixed(2)}π</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NFT Price</span>
                  <span className="font-medium">{price || "0"}π</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Edition Type</span>
                  <span className="font-medium capitalize">
                    {editionType === "unique"
                      ? "1 of 1"
                      : editionType === "limited"
                        ? `${totalEditions} copies`
                        : "Unlimited"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} size="lg">
                  Back
                </Button>
                <Button className="flex-1" onClick={handleMint} disabled={loading || !price} size="lg">
                  {loading ? "Minting..." : `Mint NFT • ${(Number.parseFloat(price || "0") * 0.05).toFixed(2)}π`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardContent className="py-16 text-center">
              <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">NFT Minted Successfully!</h2>
              <p className="text-muted-foreground mb-2">Your audio NFT is now live on Aurafloor</p>
              <p className="text-sm text-muted-foreground mb-6">
                You'll earn 90% on sales + {resaleFee}% on resales + 40% of ad revenue
              </p>
              <Button onClick={() => router.push("/marketplace")} size="lg">
                View Marketplace
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  )
}
