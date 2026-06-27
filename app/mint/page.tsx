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
import { Upload, Music2, CheckCircle2, Info, Image as ImageIcon, Package, Brain, Radio, Copy, Check, Loader2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { usePiPayment } from "@/hooks/usePiPayment"
import { getTierConfig } from "@/lib/subscription-config"
import { mintAudioNFT } from "@/lib/contracts"
import { signTransaction } from "@/lib/wallet"

interface MintingProgress {
  stage: 'payment' | 'uploading' | 'metadata' | 'minting' | 'complete'
  message: string
  nextTokenId?: number
  audioUrl?: string
  metadataCid?: string
  transactionHash?: string
}

export default function MintPage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const { createPayment } = usePiPayment()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mintedNFT, setMintedNFT] = useState<any>(null)
  const [mintingProgress, setMintingProgress] = useState<MintingProgress | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
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
  const [monetization, setMonetization] = useState<string[]>([])
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [mintingError, setMintingError] = useState<string | null>(null)

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setAudioFile(e.target.files[0]) }
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setCoverFile(e.target.files[0]) }
  const copyToClipboard = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000) } catch (err) { console.error('Failed to copy:', err) }
  }

  // Placeholder signer Ã¢â‚¬â€œ replace with actual wallet integration (e.g., Freighter)
  

  const handleContentModeration = async () => {
    if (!audioFile) return
    setLoading(true); setModerationStatus("pending")
    try {
      const contentId = user?.piuser + '_' + Date.now()
      const res = await fetch('/.netlify/functions/moderate-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'screen', contentId, creatorWallet: user?.piuser, title, audioUrl: '' })
      })
      const data = await res.json()
      if (data.success) {
        setModerationStatus(data.status)
        setModerationFeedback(data.status === 'approved' ? 'Content approved!' : 'Content flagged for review.')
        if (data.status === 'approved') setTimeout(() => setStep(2), 1500)
      } else { setModerationStatus('rejected'); setModerationFeedback('Moderation failed.') }
    } catch (e) { setModerationStatus('rejected'); setModerationFeedback('Moderation error.') }
    finally { setLoading(false) }
  }

  const handleMint = async () => {
    if (!audioFile || !title || !price || !user?.piuser) {
      setMintingError("Please fill all required fields and ensure you are logged in")
      return
    }
    setLoading(true); setMintingError(null); setStep(3.5)
    try {
      const tierKey = (user?.role === 'creator' ? 'creator_' : 'collector_') + (user?.subscription?.tier || 'free')
      const tierConfig = getTierConfig(tierKey as any)
      const feePercent = tierConfig?.mintingFeePercent ?? 10
      const mintingFee = parseFloat(price) * (feePercent / 100)
      setMintingProgress({ stage: 'payment', message: 'Processing minting fee...' })
      const pid = await createPayment({
        amount: mintingFee,
        memo: `Mint NFT: ${title}`, 
        metadata: { type: 'nft_mint', title, creator: user.piuser }
      })
      if (!pid) throw new Error('Payment failed or cancelled')
      setPaymentId(pid)
      setMintingProgress({ stage: 'uploading', message: 'Uploading audio to R2...' })
      const audioFd = new FormData(); audioFd.append('file', audioFile); audioFd.append('paymentId', pid); audioFd.append('type', 'audio')
      const r2Res = await fetch('/api/upload-to-r2', { method: 'POST', body: audioFd })
      if (!r2Res.ok) { const e = await r2Res.json(); throw new Error(e.error || 'R2 upload failed') }
      const r2Data = await r2Res.json(); const audioUrl = r2Data.url
      let coverCid = '', coverIpfsUrl = ''
      if (coverFile) {
        const covFd = new FormData(); covFd.append('file', coverFile); covFd.append('paymentId', pid); covFd.append('type', 'cover')
        const ipfsRes = await fetch('/api/upload-to-ipfs', { method: 'POST', body: covFd })
        if (ipfsRes.ok) { const d = await ipfsRes.json(); coverCid = d.cid; coverIpfsUrl = d.ipfsUrl }
      }
      setMintingProgress({ stage: 'metadata', message: 'Minting on Pi blockchain...' })

      // --- Replace backend mint with contract call ---
      const royaltyBps = parseInt(resaleFee) * 100; // convert % to basis points
      // Use the user's wallet address as both the mint recipient and royalty receiver.
      // The 	o parameter expects a Stellar address (G...).  user.piuser might be that address.
      const recipientAddress = user.piuser; // or user.walletAddress if available
      const metadataCid = coverCid || ""; // use coverCid from IPFS upload, or empty if no cover

      // Call the deployed contract
      const result = await mintAudioNFT(
        signTransaction,
        recipientAddress,
        metadataCid,
        audioUrl,
        recipientAddress, // royalty receiver (same as creator)
        royaltyBps
      );

      // The result contains transaction info; we simulate the NFT data for the UI.
      // In a real integration, you would query the contract to get the token ID and other details.
      const tokenId = 0;
const txHash = result;

      setMintingProgress({
        stage: 'complete',
        message: 'NFT minted!',
        nextTokenId: typeof tokenId === 'number' ? tokenId : 0,
        audioUrl,
        metadataCid: metadataCid || 'Qm...',
        transactionHash: txHash
      });
      setMintedNFT({
        title,
        tokenId: typeof tokenId === 'number' ? tokenId : 0,
        royalty: resaleFee,
        transactionHash: txHash
      });
      setTimeout(() => setStep(4), 2000);
    } catch (error: any) {
      console.error('[Mint] Error:', error)
      setMintingError(error.message || 'Minting failed')
      setStep(3)
    } finally { setLoading(false) }
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
        {mintingError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1"><h4 className="font-semibold text-sm mb-1">Minting Error</h4><p className="text-sm text-muted-foreground">{mintingError}</p></div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Mint Audio NFT</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Create your exclusive audio NFT on Pi Network</p>
        </div>
        <div className="mb-8">
          <Progress value={(Math.floor(step) / 4) * 100} className="h-2" />
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
              <label htmlFor="audio-upload" className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm font-medium mb-1">Click to upload audio</p>
                <p className="text-xs text-muted-foreground">MP3, WAV, or FLAC (max 100MB)</p>
                <input id="audio-upload" type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
              </label>
              {audioFile && (<div className="mt-4 p-3 sm:p-4 bg-muted rounded-lg"><p className="text-sm font-medium truncate">{audioFile.name}</p><p className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p></div>)}
              {moderationStatus && (
                <div className={cn("p-3 sm:p-4 rounded-lg border", moderationStatus === "approved" && "bg-green-500/10 border-green-500/20", moderationStatus === "rejected" && "bg-red-500/10 border-red-500/20", moderationStatus === "pending" && "bg-yellow-500/10 border-yellow-500/20")}>
                  <div className="flex items-start gap-3">
                    {moderationStatus === "approved" && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5" />}
                    {moderationStatus === "rejected" && <Info className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5" />}
                    {moderationStatus === "pending" && <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mt-0.5" />}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{moderationStatus === "pending" ? "Moderating..." : moderationStatus === "approved" ? "Content Approved" : "Content Rejected"}</h4>
                      <p className="text-sm text-muted-foreground">{moderationFeedback}</p>
                    </div>
                  </div>
                </div>
              )}
              <Button className="w-full h-11 sm:h-12 text-sm sm:text-base" onClick={handleContentModeration} disabled={!audioFile || loading || moderationStatus === "approved"}>
                {loading ? "Moderating..." : moderationStatus === "approved" ? "Proceed" : "Next: Moderate"}
              </Button>
              {moderationStatus === "rejected" && (
                <Button variant="outline" className="w-full h-11 sm:h-12 bg-transparent text-sm sm:text-base" onClick={() => { setAudioFile(null); setModerationStatus(null); setModerationFeedback("") }}>Upload Different File</Button>
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
                <label htmlFor="cover-upload" className="flex items-center justify-center w-full h-36 sm:h-40 md:h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  {coverFile ? <img src={URL.createObjectURL(coverFile)} alt="Cover" className="w-full h-full object-cover rounded-lg" /> : <div className="text-center"><Upload className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Upload cover art</p></div>}
                  <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </label>
              </div>
              <div className="space-y-2"><Label htmlFor="title" className="text-sm sm:text-base">Title *</Label><Input id="title" placeholder="Enter NFT title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 sm:h-12 text-sm sm:text-base" /></div>
              <div className="space-y-2"><Label htmlFor="description" className="text-sm sm:text-base">Description</Label><Textarea id="description" placeholder="Describe your audio NFT..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm sm:text-base" /></div>
              <div className="space-y-2"><Label htmlFor="category" className="text-sm sm:text-base">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent><SelectItem value="Electronic">Electronic</SelectItem><SelectItem value="Hip Hop">Hip Hop</SelectItem><SelectItem value="Acoustic">Acoustic</SelectItem><SelectItem value="Jazz">Jazz</SelectItem><SelectItem value="EDM">EDM</SelectItem><SelectItem value="Podcast">Podcast</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="edition-type" className="text-sm sm:text-base">Edition Type *</Label>
                <Select value={editionType} onValueChange={setEditionType}>
                  <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="one_of_one">1/1 (Unique)</SelectItem><SelectItem value="limited">Limited Edition</SelectItem><SelectItem value="unlimited">Unlimited</SelectItem></SelectContent>
                </Select>
              </div>
              {editionType === "limited" && (<div className="space-y-2"><Label htmlFor="total-editions" className="text-sm sm:text-base">Total Editions *</Label><Input id="total-editions" type="number" min="1" max="10000" placeholder="e.g., 100" value={totalEditions} onChange={(e) => setTotalEditions(e.target.value)} className="h-11 sm:h-12 text-sm sm:text-base" /><p className="text-xs text-muted-foreground">Maximum {totalEditions} copies will be minted. Each gets a unique token ID.</p></div>)}
              {editionType === "one_of_one" && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">This will be a unique 1/1 NFT. Only one copy will ever exist.</p></div>}
              {editionType === "unlimited" && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Unlimited editions can be minted. No maximum limit.</p></div>}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="h-11 sm:h-12 flex-1">Back</Button>
                <Button className="flex-1 h-11 sm:h-12 text-sm sm:text-base" onClick={() => setStep(3)} disabled={!title}>Next: Set Pricing</Button>
              </div>
            </CardContent>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Pricing & Royalties</CardTitle>
              <CardDescription className="text-sm sm:text-base">Set your NFT price and royalty terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label htmlFor="price" className="text-sm sm:text-base">Price (ÃƒÂÃ¢â€šÂ¬) *</Label>
                <div className="relative">
                  <Input id="price" type="number" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 sm:h-12 pr-8 text-sm sm:text-base" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ÃƒÂÃ¢â€šÂ¬</span>
                </div>
              </div>
              <div className="space-y-2"><Label htmlFor="resale-fee" className="text-sm sm:text-base">Resale Royalty (%) *</Label>
                <Select value={resaleFee} onValueChange={setResaleFee}>
                  <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="5">5%</SelectItem><SelectItem value="7">7.5%</SelectItem><SelectItem value="10">10%</SelectItem><SelectItem value="12">12.5%</SelectItem><SelectItem value="15">15%</SelectItem></SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">You'll earn {resaleFee}% royalty on every resale</p>
              </div>
              <Separator />
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex items-start gap-2"><Info className="w-4 h-4 text-muted-foreground mt-0.5" /><div className="flex-1"><h3 className="font-semibold text-sm mb-2">Revenue Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Your Earnings (90%)</span><span className="font-medium text-primary">{(Number.parseFloat(price || "0") * 0.9).toFixed(2)}ÃƒÂÃ¢â€šÂ¬</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee (10%)</span><span className="font-medium">{(Number.parseFloat(price || "0") * 0.1).toFixed(2)}ÃƒÂÃ¢â€šÂ¬</span></div>
                    <Separator />
                    <div className="flex justify-between"><span className="text-muted-foreground">Resale Royalty</span><span className="font-medium text-primary">{resaleFee}%</span></div>
                  </div></div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="h-11 sm:h-12 flex-1">Back</Button>
                <Button className="flex-1 h-11 sm:h-12 text-sm sm:text-base" onClick={handleMint} disabled={loading || !price}>{loading ? "Processing..." : "Mint NFT ÃƒÂÃ¢â€šÂ¬"}</Button>
              </div>
            </CardContent>
          </Card>
        )}
        {step === 3.5 && mintingProgress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Minting Your NFT</CardTitle>
              <CardDescription className="text-sm sm:text-base">Please wait while we securely create your NFT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium mb-2">{mintingProgress.message}</p>
                <div className="w-full max-w-md mt-6 space-y-3">
                  <div className={cn("flex items-center gap-3 p-3 rounded-lg", mintingProgress.stage !== 'payment' ? "bg-green-500/10" : "bg-muted")}>{mintingProgress.stage !== 'payment' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />}<span className="text-sm">Payment Confirmed</span></div>
                  <div className={cn("flex items-center gap-3 p-3 rounded-lg", mintingProgress.stage === 'uploading' || mintingProgress.stage === 'metadata' || mintingProgress.stage === 'minting' || mintingProgress.stage === 'complete' ? "bg-green-500/10" : mintingProgress.stage === 'payment' ? "bg-yellow-500/10" : "bg-muted")}>{(mintingProgress.stage !== 'payment' && mintingProgress.stage !== 'uploading') ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : mintingProgress.stage === 'payment' ? <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />}<span className="text-sm">Audio Uploaded to R2</span></div>
                  <div className={cn("flex items-center gap-3 p-3 rounded-lg", mintingProgress.stage === 'metadata' || mintingProgress.stage === 'minting' || mintingProgress.stage === 'complete' ? "bg-green-500/10" : mintingProgress.stage === 'uploading' ? "bg-yellow-500/10" : "bg-muted")}>{(mintingProgress.stage !== 'payment' && mintingProgress.stage !== 'uploading' && mintingProgress.stage !== 'metadata') ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : mintingProgress.stage === 'uploading' ? <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />}<span className="text-sm">Metadata Created on IPFS</span></div>
                  <div className={cn("flex items-center gap-3 p-3 rounded-lg", mintingProgress.stage === 'minting' || mintingProgress.stage === 'complete' ? "bg-green-500/10" : mintingProgress.stage === 'metadata' ? "bg-yellow-500/10" : "bg-muted")}>{(mintingProgress.stage === 'minting' || mintingProgress.stage === 'complete') ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : mintingProgress.stage === 'metadata' ? <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />}<span className="text-sm">Minting on Pi Blockchain</span></div>
                </div>
                {mintingProgress.nextTokenId && (
                  <div className="w-full max-w-md mt-6 p-4 bg-muted rounded-lg space-y-3"><h4 className="font-semibold text-sm">Minting Details:</h4>
                    {mintingProgress.nextTokenId && <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Token ID:</span><div className="flex items-center gap-2"><code className="text-xs bg-background px-2 py-1 rounded">{mintingProgress.nextTokenId}</code><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(String(mintingProgress.nextTokenId), 'tokenId')}>{copiedField==='tokenId' ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}</Button></div></div>}
                    {mintingProgress.audioUrl && <div className="flex items-start justify-between"><span className="text-xs text-muted-foreground">Audio URL:</span><div className="flex items-center gap-2"><code className="text-xs bg-background px-2 py-1 rounded max-w-[200px] truncate">{mintingProgress.audioUrl}</code><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(mintingProgress.audioUrl!, 'audioUrl')}>{copiedField==='audioUrl' ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}</Button></div></div>}
                    {mintingProgress.transactionHash && <div className="flex items-start justify-between"><span className="text-xs text-muted-foreground">TX Hash:</span><div className="flex items-center gap-2"><code className="text-xs bg-background px-2 py-1 rounded max-w-[200px] truncate">{mintingProgress.transactionHash}</code><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(mintingProgress.transactionHash!, 'txHash')}>{copiedField==='txHash' ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}</Button></div></div>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {step === 4 && (
          <Card>
            <CardContent className="py-12 sm:py-16">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto mb-4 sm:mb-6" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">NFT Minted Successfully!</h2>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">Your audio NFT is now live on Pi blockchain</p>
                {mintedNFT && (
                  <div className="max-w-md mx-auto mb-6 p-4 bg-muted/50 rounded-lg text-left space-y-3">
                    <h3 className="font-semibold text-center mb-3">NFT Details</h3>
                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Title:</span><span className="text-sm font-medium">{mintedNFT.title}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Token ID:</span><div className="flex items-center gap-2"><code className="text-sm bg-background px-2 py-1 rounded">{mintedNFT.tokenId}</code><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(mintedNFT.tokenId, 'successTokenId')}>{copiedField==='successTokenId' ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}</Button></div></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Royalty:</span><span className="text-sm font-medium">{mintedNFT.royalty}%</span></div>
                    {mintedNFT.transactionHash && <div className="flex justify-between items-start"><span className="text-sm text-muted-foreground">TX Hash:</span><div className="flex items-center gap-2"><code className="text-xs bg-background px-2 py-1 rounded max-w-[180px] truncate">{mintedNFT.transactionHash}</code><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(mintedNFT.transactionHash, 'successTxHash')}>{copiedField==='successTxHash' ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}</Button></div></div>}
                    <Separator />
                    <div className="text-center pt-2"><p className="text-xs text-muted-foreground mb-2">View on Pi Explorer:</p><a href="https://piscan.io" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Pi Explorer (coming soon) ?</a></div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => router.push("/marketplace")} className="h-11 sm:h-12 px-8">View Marketplace</Button>
                  <Button variant="outline" onClick={() => router.push("/profile")} className="h-11 sm:h-12 px-8">View Profile</Button>
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



