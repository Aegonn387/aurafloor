
"use client"

import { useStore } from "@/lib/store"
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
import { useState, useEffect, useCallback } from "react"
import { TipModal } from "./tip-modal"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

type StreamStatus = "loading" | "ready" | "error" | "buffering"

export function FullPlayer() {
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    setIsMiniPlayer,
    isMiniPlayer,
    setCurrentTrack,
    audioElement,
    setAudioElement,
    currentStreamUrl,
    setCurrentStreamUrl,
    currentQuality,
    queue,
    setQueue,
  } = useStore()

  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [repeat, setRepeat] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [streamLogged, setStreamLogged] = useState(false)
  const [adPlaying, setAdPlaying] = useState(false)
  const [playedAds, setPlayedAds] = useState<number[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (!audioElement) {
      const audio = new Audio()
      audio.volume = volume / 100
      audio.preload = "metadata"
      setAudioElement(audio)
    }

    return () => {
      // Don't destroy audio element, just pause it
      if (audioElement && !isMiniPlayer) {
        audioElement.pause()
      }
    }
  }, [audioElement, setAudioElement, volume, isMiniPlayer])

  // Fetch stream URL with ownership verification
  useEffect(() => {
    if (!currentTrack) return

    setStreamStatus("loading")
    setError(null)
    setStreamLogged(false)
    setPlayedAds([])

    const fetchStreamUrl = async () => {
      try {
        // TODO: Replace 'demo-user' with actual authenticated user ID
        const userId = "demo-user"
        const response = await fetch(`/api/stream/${currentTrack.id}?userId=${userId}`)

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("You don't have access to this track. Purchase to listen.")
          } else if (response.status === 429) {
            throw new Error("Free tier limit reached. Please wait or upgrade to Pro.")
          }
          throw new Error("Failed to load stream")
        }

        const data = await response.json()

        if (!data.streamUrl) {
          throw new Error("No stream URL received")
        }

        setCurrentStreamUrl(data.streamUrl, data.quality)

        if (audioElement && data.streamUrl) {
          audioElement.src = data.streamUrl
          audioElement.load()
          setStreamStatus("ready")

          if (isPlaying) {
            const playPromise = audioElement.play()
            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                console.error("Playback failed:", err)
                setError("Playback failed. Please try again.")
                setStreamStatus("error")
              })
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch stream URL:", err)
        setError(err instanceof Error ? err.message : "Failed to load audio")
        setStreamStatus("error")
      }
    }

    fetchStreamUrl()
  }, [currentTrack, setCurrentStreamUrl, audioElement, isPlaying])

  // Handle play/pause
  useEffect(() => {
    if (!audioElement || streamStatus !== "ready") return

    if (isPlaying && !adPlaying) {
      const playPromise = audioElement.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Playback error:", err)
          setIsPlaying(false)
        })
      }
    } else if (!adPlaying) {
      audioElement.pause()
    }
  }, [isPlaying, audioElement, streamStatus, adPlaying])

  // Update volume
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume / 100
    }
  }, [volume, audioElement])

  // Audio event listeners
  useEffect(() => {
    if (!audioElement || !currentTrack) return

    const updateProgress = () => {
      if (audioElement.duration && !isNaN(audioElement.duration)) {
        const prog = (audioElement.currentTime / audioElement.duration) * 100
        setProgress(prog || 0)
      }
    }

    const handleWaiting = () => setStreamStatus("buffering")
    const handleCanPlay = () => setStreamStatus("ready")
    const handleError = () => {
      setError("Audio playback error")
      setStreamStatus("error")
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)

      // Auto-play next track if in queue
      if (queue.length > 0 && !repeat) {
        handleNext()
      } else if (repeat) {
        audioElement.currentTime = 0
        setIsPlaying(true)
      }
    }

    audioElement.addEventListener("timeupdate", updateProgress)
    audioElement.addEventListener("waiting", handleWaiting)
    audioElement.addEventListener("canplay", handleCanPlay)
    audioElement.addEventListener("error", handleError)
    audioElement.addEventListener("ended", handleEnded)

    return () => {
      audioElement.removeEventListener("timeupdate", updateProgress)
      audioElement.removeEventListener("waiting", handleWaiting)
      audioElement.removeEventListener("canplay", handleCanPlay)
      audioElement.removeEventListener("error", handleError)
      audioElement.removeEventListener("ended", handleEnded)
    }
  }, [audioElement, currentTrack, queue, repeat, setIsPlaying])

  // Log stream for analytics after 30 seconds
  useEffect(() => {
    if (!isPlaying || !currentTrack || streamLogged || adPlaying) return

    const timer = setTimeout(async () => {
      try {
        await fetch("/api/analytics/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackId: currentTrack.id,
            userId: "demo-user", // TODO: Replace with actual user ID
            quality: currentQuality,
            timestamp: Date.now(),
            owned: currentTrack.owned || false,
            duration: audioElement?.currentTime || 0,
          }),
        })
        setStreamLogged(true)
      } catch (err) {
        console.error("Failed to log stream:", err)
      }
    }, 30000)

    return () => clearTimeout(timer)
  }, [isPlaying, currentTrack, streamLogged, currentQuality, audioElement, adPlaying])

  // Ad insertion for free tier (non-owned tracks)
  useEffect(() => {
    if (!audioElement || !currentTrack || currentTrack.owned || adPlaying) return

    const adSchedule = [
      currentTrack.duration * 0.25,
      currentTrack.duration * 0.5,
      currentTrack.duration * 0.75,
    ]

    const checkForAd = () => {
      const currentTime = audioElement.currentTime
      const shouldPlayAd = adSchedule.find(
        (adTime) => Math.abs(currentTime - adTime) < 0.5 && !playedAds.includes(adTime)
      )

      if (shouldPlayAd && isPlaying) {
        playAd(shouldPlayAd)
      }
    }

    audioElement.addEventListener("timeupdate", checkForAd)
    return () => audioElement.removeEventListener("timeupdate", checkForAd)
  }, [audioElement, currentTrack, playedAds, isPlaying, adPlaying])

  const playAd = async (adTime: number) => {
    if (!audioElement) return

    const trackPosition = audioElement.currentTime
    setAdPlaying(true)
    setIsPlaying(false)
    audioElement.pause()

    try {
      // Fetch ad URL from your ad server
      const adResponse = await fetch("/api/ads/get-ad")
      const adData = await adResponse.json()

      if (adData.adUrl) {
        const adAudio = new Audio(adData.adUrl)
        adAudio.volume = volume / 100

        await new Promise<void>((resolve) => {
          adAudio.onended = () => resolve()
          adAudio.play()
        })

        // Log ad impression for revenue tracking
        await fetch("/api/ads/log-impression", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackId: currentTrack?.id,
            adId: adData.adId,
            userId: "demo-user",
            timestamp: Date.now(),
          }),
        })
      }
    } catch (err) {
      console.error("Ad playback failed:", err)
    }

    setPlayedAds([...playedAds, adTime])
    audioElement.currentTime = trackPosition
    setAdPlaying(false)
    setIsPlaying(true)
  }

  const handleNext = useCallback(() => {
    if (queue.length > 0) {
      const nextTrack = shuffle ? queue[Math.floor(Math.random() * queue.length)] : queue[0]
      setCurrentTrack(nextTrack)
      setQueue(queue.filter((t) => t.id !== nextTrack.id))
    }
  }, [queue, shuffle, setCurrentTrack, setQueue])

  const handlePrevious = useCallback(() => {
    if (audioElement && audioElement.currentTime > 3) {
      audioElement.currentTime = 0
    } else {
      // TODO: Implement previous track from history
    }
  }, [audioElement])

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
      setError("Download failed. Please try again.")
      setDownloadProgress(null)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (!currentTrack || isMiniPlayer) return null

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentTime = audioElement?.currentTime || 0
  const duration = audioElement?.duration || currentTrack.duration

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-primary/20 via-background to-background z-50 flex flex-col overflow-auto">
        <div className="flex items-center justify-between p-4 border-b backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMiniPlayer(true)}>
              <Minimize2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentTrack(null)
                if (audioElement) {
                  audioElement.pause()
                  audioElement.src = ""
                }
              }}
            >
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

        <div className="flex-1 flex flex-col items-center justify-start p-6 pb-safe overflow-auto">
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
                onValueChange={(value) => {
                  setProgress(value[0])
                  if (audioElement && duration) {
                    audioElement.currentTime = (value[0] / 100) * duration
                  }
                }}
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
                  onClick={handlePrevious}
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
                  onClick={handleNext}
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
                className={`rounded-full bg-transparent ${isLiked ? "text-red-500" : ""}`}
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
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
