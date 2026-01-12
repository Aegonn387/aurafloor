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
import { Upload, Music2, CheckCircle2, Info, Image as ImageIcon, Package, Brain, Radio, HelpCircle } from "lucide-react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { PiAuth } from "@/lib/pi-auth"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

  // New state for NFT type and monetization
  const [nftType, setNftType] = useState("audio")
  const [monetization, setMonetization] = useState<string[]>([])

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
          nftType,
          monetization,
          title,
          price: Number.parseFloat(price),
          resaleFee: monetization.includes("secondary") ? Number.parseInt(resaleFee) : 0,
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
      <div className="min-h-screen bg-background pb-20 sm:pb-24">
        <Header />
        <main className="container px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Music2 className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Creator Access Required</h1>
            <p className="text-muted-foreground mb-6">You need a creator account to mint NFTs</p>
            <Button onClick={() => router.push("/")} className="px-8">Go to Home</Button>
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-20">
      <Header />
      <main className="container px-4 py-6 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Mint Audio NFT</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Create your exclusive audio NFT in 3 simple steps</p>
        </div>

        <div className="mb-8">
          <Progress value={(step / 4) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-sm sm:text-base">
            <span className={step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>Upload</span>
            <span className={step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>Details</span>
            <span className={step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>Pricing</span>
            <span className={step >= 4 ? "text-primary font-medium" : "text-muted-foreground"}>Complete</span>
          </div>
        </div>
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Upload Audio File</CardTitle>
              <CardDescription className="text-sm sm:text-base">Upload your music, podcast, or audio content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* NFT Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm sm:text-base">NFT Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                  {/* Audio - Enabled */}
                  <button
                    type="button"
                    onClick={() => setNftType("audio")}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg transition-colors",
                      nftType === "audio" ? "border-primary bg-primary/10" : "border-muted bg-muted/50",
                      "cursor-pointer hover:bg-muted"
                    )}
                  >
                    <Music2 className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />
                    <span className="text-xs font-medium">Audio</span>
                  </button>

                  {/* Digital Arts - Disabled */}
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center p-3 sm:p-4 border border-muted rounded-lg bg-muted/50 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />
                    <span className="text-xs font-medium">Digital Arts</span>
                  </button>

                  {/* Collectibles - Disabled */}
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center p-3 sm:p-4 border border-muted rounded-lg bg-muted/50 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />
                    <span className="text-xs font-medium">Collectibles</span>
                  </button>

                  {/* Intellectual Property - Disabled */}
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center p-3 sm:p-4 border border-muted rounded-lg bg-muted/50 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />
                    <span className="text-xs font-medium">IP</span>
                  </button>

                  {/* Live Rooms - Disabled */}
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center p-3 sm:p-4 border border-muted rounded-lg bg-muted/50 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Radio className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />
                    <span className="text-xs font-medium">Live Rooms</span>
                  </button>
                </div>
              </div>

              {/* Upload Section */}
              <label
                htmlFor="audio-upload"
                className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm font-medium mb-1">Click to upload audio</p>
                <p className="text-xs text-muted-foreground">MP3, WAV, or FLAC (max 100MB)</p>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
              </label>

              {audioFile && (
                <div className="mt-4 p-3 sm:p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium truncate">{audioFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {/* Monetization Options */}
              <div className="space-y-3">
                <Label className="text-sm sm:text-base">Monetization Options</Label>
                <div className="space-y-2">
                  {/* Free Content */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="free-content"
                          checked={monetization.includes("free")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMonetization([...monetization, "free"])
                            } else {
                              setMonetization(monetization.filter((item) => item !== "free"))
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="free-content" className="ml-2 text-sm font-medium">
                          Free Content
                        </label>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-sm">
                          <p>
                            Free content allows users to stream your audio for free. You earn 40% of ad revenue generated from user engagement with your content.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Streaming */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="streaming"
                          checked={monetization.includes("streaming")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMonetization([...monetization, "streaming"])
                            } else {
                              setMonetization(monetization.filter((item) => item !== "streaming"))
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="streaming" className="ml-2 text-sm font-medium">
                          Streaming
                        </label>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-sm">
                          <p>
                            Streaming allows users to stream your audio. You earn 40% of ad revenue generated from user engagement with your content.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Secondary Market - Removed auctions from label */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="secondary"
                          checked={monetization.includes("secondary")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMonetization([...monetization, "secondary"])
                            } else {
                              setMonetization(monetization.filter((item) => item !== "secondary"))
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="secondary" className="ml-2 text-sm font-medium">
                          Secondary Market
                        </label>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-sm">
                          <p>
                            Enable secondary market sales. You can set a royalty fee (5-15%) on every resale.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {moderationStatus && (
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-lg border",
                    moderationStatus === "approved" && "bg-green-500/10 border-green-500/20",
                    moderationStatus === "rejected" && "bg-red-500/10 border-red-500/20",
                    moderationStatus === "pending" && "bg-yellow-500/10 border-yellow-500/20",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {moderationStatus === "approved" && (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5" />
                    )}
                    {moderationStatus === "rejected" && (
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5" />
                    )}
                    {moderationStatus === "pending" && (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mt-0.5" />
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
                className="w-full h-11 sm:h-12 text-sm sm:text-base"
                onClick={handleContentModeration}
                disabled={!audioFile || loading || moderationStatus === "approved"}
              >
                {loading ? "Moderating Content..." : moderationStatus === "approved" ? "Proceeding..." : "Next: Moderate & Continue"}
              </Button>

              {moderationStatus === "rejected" && (
                <Button
                  variant="outline"
                  className="w-full h-11 sm:h-12 bg-transparent text-sm sm:text-base"
                  onClick={() => {
                    setAudioFile(null)
                    setModerationStatus(null)
                    setModerationFeedback("")
                  }}
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
              <CardTitle className="text-lg sm:text-xl">NFT Details</CardTitle>
              <CardDescription className="text-sm sm:text-base">Add information about your NFT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cover" className="text-sm sm:text-base">Cover Art</Label>
                <label
                  htmlFor="cover-upload"
                  className="flex items-center justify-center w-full h-36 sm:h-40 md:h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {coverFile ? (
                    <img
                      src={URL.createObjectURL(coverFile) || "/placeholder.svg"}
                      alt="Cover"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2" />
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
                <Label htmlFor="title" className="text-sm sm:text-base">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter NFT title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 sm:h-12 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your audio NFT..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm sm:text-base">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
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
                <Button variant="outline" onClick={() => setStep(1)} className="h-11 sm:h-12 flex-1">
                  Back
                </Button>
                <Button
                  className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
                  onClick={() => setStep(3)}
                  disabled={!title}
                >
                  Next: Set Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Pricing & Royalties</CardTitle>
              <CardDescription className="text-sm sm:text-base">Set your NFT price, royalty terms, and edition details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm sm:text-base">Price (π) *</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-11 sm:h-12 pr-8 text-sm sm:text-base"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    π
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Edition Type</Label>
                <Select value={editionType} onValueChange={setEditionType}>
                  <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
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
                  <Label htmlFor="editions" className="text-sm sm:text-base">Number of Copies</Label>
                  <Input
                    id="editions"
                    type="number"
                    placeholder="100"
                    value={totalEditions}
                    onChange={(e) => setTotalEditions(e.target.value)}
                    className="h-11 sm:h-12 text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total number of NFT copies that will be available for sale
                  </p>
                </div>
              )}

              {/* Secondary Market Royalty - Only show if selected in monetization */}
              {monetization.includes("secondary") && (
                <div className="space-y-2">
                  <Label htmlFor="resale-fee" className="text-sm sm:text-base">Secondary Sale Royalty (%)</Label>
                  <Select value={resaleFee} onValueChange={setResaleFee}>
                    <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
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
              )}

              <Separator />

              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
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
                        <span className="font-medium">
                          10% ({(Number.parseFloat(price || "0") * 0.1).toFixed(2)}π)
                        </span>
                      </div>

                      {monetization.includes("secondary") && (
                        <>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Resale Platform Fee</span>
                            <span className="font-medium">7.5%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Your Resale Royalty</span>
                            <span className="font-medium text-primary">{resaleFee}%</span>
                          </div>
                        </>
                      )}

                      {(monetization.includes("free") || monetization.includes("streaming")) && (
                        <>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Ad Revenue Share (free tier streams)
                            </span>
                            <span className="font-medium text-primary">40%</span>
                          </div>
                          <p className="text-xs text-muted-foreground pt-2">
                            Ad revenue distributed twice monthly based on stream count
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-3 sm:p-4 space-y-2">
                <h3 className="font-semibold text-sm">Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minting Fee (5%)</span>
                  <span className="font-medium">
                    {(Number.parseFloat(price || "0") * 0.05).toFixed(2)}π
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NFT Price</span>
                  <span className="font-medium">{price || "0"}π</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Edition Type</span>
                  <span className="font-medium capitalize">
                    {editionType === "unique" ? "1 of 1" : editionType === "limited" ? `${totalEditions} copies` : "Unlimited"}
                  </span>
                </div>
                {monetization.includes("secondary") && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Resale Royalty</span>
                    <span className="font-medium">{resaleFee}%</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="h-11 sm:h-12 flex-1">
                  Back
                </Button>
                <Button
                  className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
                  onClick={handleMint}
                  disabled={loading || !price}
                >
                  {loading ? "Minting..." : `Mint NFT • ${(Number.parseFloat(price || "0") * 0.05).toFixed(2)}π`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardContent className="py-12 sm:py-16 text-center">
              <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">NFT Minted Successfully!</h2>
              <p className="text-muted-foreground mb-2 text-sm sm:text-base">
                Your audio NFT is now live on Aurafloor
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You'll earn 90% on sales
                {monetization.includes("secondary") && ` + ${resaleFee}% on resales`}
                {(monetization.includes("free") || monetization.includes("streaming")) && " + 40% of ad revenue"}
              </p>
              <Button 
                onClick={() => router.push("/marketplace")} 
                className="h-11 sm:h-12 px-8 text-sm sm:text-base"
              >
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
