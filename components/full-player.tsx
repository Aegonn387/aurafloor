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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { TipModal } from "./tip-modal"
import Link from "next/link"

export function FullPlayer() {
  const { currentTrack, isPlaying, setIsPlaying, setIsMiniPlayer, isMiniPlayer, setCurrentTrack } = useStore()
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [repeat, setRepeat] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [showInfo, setShowInfo] = useState(true)
  const [tipModalOpen, setTipModalOpen] = useState(false)

  useEffect(() => {
    if (!isPlaying || !currentTrack) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + 100 / currentTrack.duration
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, currentTrack])

  if (!currentTrack || isMiniPlayer) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentTime = Math.floor((progress / 100) * currentTrack.duration)

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-b from-primary/20 via-background to-background z-50 flex flex-col overflow-auto">
        <div className="flex items-center justify-between p-4 border-b backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMiniPlayer(true)}>
              <Minimize2 className="w-5 h-5" />
            </Button>
// @ts-ignore
            <Button variant="ghost" size="icon" onClick={() => setCurrentTrack(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              HD Audio
            </Badge>
            {currentTrack.edition && currentTrack.totalEditions && (
              <Badge variant="outline" className="text-xs">
                Edition #{currentTrack.edition}/{currentTrack.totalEditions}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowInfo(!showInfo)}>
            <Info className={`w-5 h-5 ${showInfo ? "text-primary" : ""}`} />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start p-6 pb-safe overflow-auto">
          <div className="w-full max-w-md space-y-6">
            <div className="relative">
              <img
                src={currentTrack.coverUrl || "/placeholder.svg"}
                alt={currentTrack.title}
                className="w-full aspect-square rounded-2xl shadow-2xl object-cover animate-in fade-in duration-500"
              />
              {currentTrack.owned && <Badge className="absolute top-4 right-4 bg-primary shadow-lg">Owned</Badge>}
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
                onValueChange={(value) => setProgress(value[0])}
                max={100}
                step={0.1}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">{formatTime(currentTime)}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>320kbps</span>
                  <span>•</span>
                  <span>Lossless</span>
                </div>
                <span className="text-muted-foreground font-medium">{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Button variant="ghost" size="icon" className="w-10 h-10" onClick={() => setShuffle(!shuffle)}>
                  <Shuffle className={`w-5 h-5 ${shuffle ? "text-primary" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12">
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full shadow-lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-12 h-12">
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
              <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" className="rounded-full bg-transparent" onClick={() => setTipModalOpen(true)}>
                <Gift className="w-4 h-4 mr-2" />
                Tip Artist
              </Button>
              {currentTrack.owned && (
                <Button variant="outline" size="icon" className="rounded-full bg-transparent">
                  <Download className="w-5 h-5" />
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NFT ID</span>
                    <span className="font-mono text-xs font-medium">#{currentTrack.id}</span>
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
                      <br />• Platform: 10% fee
                      <br />• Ad Revenue: 40% to creator (free tier streams)
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
