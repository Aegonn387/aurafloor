"use client"

import { useStore } from "@/lib/store"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Minimize2,
  Heart,
  Share2,
  Volume2,
  Repeat,
  Shuffle,
  ListMusic,
  Info,
  Download,
  Gift,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { TipModal } from "./tip-modal"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function FullPlayer() {
  // Global state
  const {
    currentTrack,
    isMiniPlayer,
    setIsMiniPlayer,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
    showInfo,
    setShowInfo,
    queue,
    isLiked,
    toggleLike,
    playNext,
    playPrevious,
  } = useStore()

  // Audio player hook
  const { progress, streamStatus, error, currentQuality, seek, currentTime, duration } = useAudioPlayer()

  // Local UI state
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)

  // Prevent background scrolling when FullPlayer is open
  useEffect(() => {
    if (currentTrack && !isMiniPlayer) {
      // Save the current scroll position
      const scrollY = window.scrollY
      // Save the current body overflow
      const bodyStyle = document.body.style
      const originalOverflow = bodyStyle.overflow
      const originalPosition = bodyStyle.position
      const originalTop = bodyStyle.top
      const originalWidth = bodyStyle.width
      
      // Lock the body scroll
      bodyStyle.overflow = 'hidden'
      bodyStyle.position = 'fixed'
      bodyStyle.top = `-${scrollY}px`
      bodyStyle.width = '100%'
      
      // Restore when component unmounts or mini player opens
      return () => {
        bodyStyle.overflow = originalOverflow
        bodyStyle.position = originalPosition
        bodyStyle.top = originalTop
        bodyStyle.width = originalWidth
        
        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [currentTrack, isMiniPlayer])

  const handleDownload = async () => {
    if (!currentTrack?.owned) return

    try {
      setDownloadProgress(0)
      const response = await fetch(`/api/download/${currentTrack.id}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${currentTrack.artist} - ${currentTrack.title}.flac`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setDownloadProgress(null)
    } catch (err) {
      console.error("Download failed:", err)
      setDownloadProgress(null)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!currentTrack || isMiniPlayer) return null

  const trackIsLiked = isLiked(currentTrack.id)

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-primary/20 via-background to-background z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMiniPlayer(true)}>
              <Minimize2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentTrack(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {currentQuality || "HD Audio"}
            </Badge>
            {currentTrack.edition && currentTrack.totalEditions && (
              <Badge variant="outline" className="text-xs">
                Edition #{currentTrack.edition}/{currentTrack.totalEditions}
              </Badge>
            )}
            {streamStatus === "buffering" && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Buffering
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowInfo(!showInfo)}>
            <Info className={`w-5 h-5 ${showInfo ? "text-primary" : ""}`} />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start p-6 pb-safe overflow-y-auto">
          <div className="w-full max-w-md space-y-6">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="relative">
              {streamStatus === "loading" && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
              )}
              <img
                src={currentTrack.coverUrl || "/placeholder.svg"}
                alt={currentTrack.title}
                className="w-full aspect-square rounded-2xl shadow-2xl object-cover animate-in fade-in duration-500"
              />
              {currentTrack.owned && <Badge className="absolute top-4 right-4 bg-primary shadow-lg">Owned</Badge>}
              {!currentTrack.owned && (
                <Badge className="absolute top-4 right-4 bg-yellow-500 shadow-lg">Free Tier</Badge>
              )}
              {currentTrack.edition && currentTrack.totalEditions && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-2">
                  <p className="text-white text-xs font-medium">
                    {currentTrack.totalEditions === 1
                      ? "1 of 1 Edition"
                      : `Edition ${currentTrack.edition} of ${currentTrack.totalEditions}`}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-balance">{currentTrack.title}</h2>
              <p className="text-lg text-muted-foreground">{currentTrack.artist}</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {currentTrack.category && (
                  <Badge variant="secondary" className="text-xs">
                    {currentTrack.category}
                  </Badge>
                )}
                {currentTrack.price && (
                  <Badge variant="outline" className="text-xs">
                    {currentTrack.price}π
                  </Badge>
                )}
              </div>
              {currentTrack.streamCount && (
                <p className="text-sm text-muted-foreground">
                  {currentTrack.streamCount.toLocaleString()} streams
                  {currentTrack.adRevenue && (
                    <span className="text-primary ml-2">• {currentTrack.adRevenue}π earned from ads</span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Slider
                value={[progress]}
                onValueChange={(value) => seek(value[0])}
                max={100}
                step={0.1}
                className="w-full cursor-pointer"
                disabled={streamStatus !== "ready"}
              />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">{formatTime(currentTime)}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{currentQuality || "Loading..."}</span>
                  {!currentTrack.owned && (
                    <>
                      <span>•</span>
                      <span>Ad-supported</span>
                    </>
                  )}
                </div>
                <span className="text-muted-foreground font-medium">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10"
                  onClick={() => setShuffle(!shuffle)}
                  disabled={queue.length === 0}
                >
                  <Shuffle className={`w-5 h-5 ${shuffle ? "text-primary" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12"
                  onClick={() => playPrevious()}
                  disabled={streamStatus !== "ready"}
                >
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full shadow-lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={streamStatus === "loading" || streamStatus === "error"}
                >
                  {streamStatus === "loading" ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12"
                  onClick={() => playNext()}
                  disabled={queue.length === 0 || streamStatus !== "ready"}
                >
                  <SkipForward className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => setRepeat(!repeat)}>
                  <Repeat className={`w-5 h-5 ${repeat ? "text-primary" : ""}`} />
                </Button>
              </div>

              <div className="flex items-center gap-3 px-4">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Slider value={[volume]} onValueChange={(value) => setVolume(value[0])} max={100} className="flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">{volume}%</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full bg-transparent ${trackIsLiked ? "text-red-500" : ""}`}
                onClick={() => toggleLike(currentTrack.id)}
              >
                <Heart className={`w-5 h-5 ${trackIsLiked ? "fill-current" : ""}`} />
              </Button>
              <Button variant="outline" className="rounded-full bg-transparent" onClick={() => setTipModalOpen(true)}>
                <Gift className="w-4 h-4 mr-2" />
                Tip Artist
              </Button>
              {currentTrack.owned && (
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-transparent"
                  onClick={handleDownload}
                  disabled={downloadProgress !== null}
                >
                  {downloadProgress !== null ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </Button>
              )}
              <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                <ListMusic className="w-5 h-5" />
              </Button>
            </div>

            {showInfo && (
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 space-y-3 border animate-in slide-in-from-top duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">NFT Details & Metadata</h3>
                  <Link href={`/nft/${currentTrack.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      View Full Page
                    </Button>
                  </Link>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">NFT ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">#{currentTrack.id}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(currentTrack.id, "nftId")}
                      >
                        {copiedField === "nftId" ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator</span>
                    <span className="font-medium">{currentTrack.artist}</span>
                  </div>
                  {currentTrack.category && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{currentTrack.category}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Wallet Address</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">GBXF...7K9M</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard("GBXF7A8N2M4P5Q6R8S9T1U2V3W4X5Y6Z7K9M", "wallet")}
                      >
                        {copiedField === "wallet" ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => window.open("https://pichain.network", "_blank")}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Token Standard</span>
                    <span className="font-medium">Protocol 23+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Blockchain</span>
                    <span className="font-medium">Pi Network</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audio Format</span>
                    <span className="font-medium">FLAC 24-bit/96kHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size</span>
                    <span className="font-medium">45.3 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatTime(currentTrack.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">IPFS Hash</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">Qm...7x9a</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard("QmHash", "ipfs")}
                      >
                        {copiedField === "ipfs" ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {currentTrack.resaleFee && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Creator Royalty</span>
                        <span className="font-medium text-primary">{currentTrack.resaleFee}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Creator earns {currentTrack.resaleFee}% on all secondary sales
                      </p>
                    </>
                  )}
                  {currentTrack.edition && currentTrack.totalEditions && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Edition Type</span>
                        <span className="font-medium">
                          {currentTrack.totalEditions === 1 ? "1 of 1" : `Limited (${currentTrack.totalEditions})`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">This Edition</span>
                        <span className="font-medium">#{currentTrack.edition}</span>
                      </div>
                    </>
                  )}
                  {currentTrack.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Description</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">{currentTrack.description}</p>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="bg-primary/10 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium">Revenue Split</p>
                    <p className="text-xs text-muted-foreground">
                      • Creator: 90% of sales
                      <br />
                      • Platform: 10% fee
                      <br />
                      {currentTrack.owned
                        ? "• No ads (owned NFT)"
                        : "• Ad Revenue: 40% to creator (free tier streams)"}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium">License Terms</p>
                    <p className="text-xs text-muted-foreground">
                      • Personal streaming & download rights
                      <br />
                      • Resale rights included
                      <br />• No commercial use without license
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        artistName={currentTrack.artist}
        trackTitle={currentTrack.title}
      />
    </>
  )
}
