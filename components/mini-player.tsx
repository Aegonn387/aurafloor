"use client"

import { useEffect, useRef } from "react"
import { useStore } from "@/lib/store"
import { useAudioManager } from "@/hooks/use-audio-manager"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Expand } from "lucide-react"

export function MiniPlayer() {
  useAudioManager()

  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    setIsMiniPlayer,
    audioElement,
    progress,
    streamStatus,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
  } = useStore()

  const streamSentRef = useRef(false)

  useEffect(() => {
    streamSentRef.current = false
  }, [currentTrack?.id])

  useEffect(() => {
    if (!currentTrack || !isPlaying || streamSentRef.current) return
    const threshold = currentTrack.category === "Podcast" ? 240 : 60
    const check = setInterval(() => {
      if (audioElement && audioElement.currentTime >= threshold) {
        streamSentRef.current = true
        clearInterval(check)
        fetch("/.netlify/functions/nft-indexer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "stream",
            payload: {
              user_id: useStore.getState().user?.uid || "anonymous",
              track_id: currentTrack.id,
              quality: "standard",
              duration: Math.floor(audioElement.currentTime),
              owned: currentTrack.owned || false,
            },
          }),
        }).catch(() => {})
      }
    }, 1000)
    return () => clearInterval(check)
  }, [isPlaying, currentTrack?.id])

  if (!currentTrack) return null

  const handlePlayPause = () => setIsPlaying(!isPlaying)
  const handleSeek = (value: number[]) => {
    if (audioElement && !isNaN(audioElement.duration)) {
      audioElement.currentTime = (value[0] / 100) * audioElement.duration
    }
  }
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] > 0) setIsMuted(false)
  }
  const handleToggleMute = () => setIsMuted(!isMuted)

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentTime = audioElement?.currentTime || 0
  const duration = audioElement?.duration || currentTrack.duration || 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      <div className="flex items-center gap-3 p-2 md:p-3">
        {/* Album art */}
        <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
          <img
            src={currentTrack.coverUrl || "/placeholder.svg"}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Track info + progress slider */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{currentTrack.title}</p>
            <p className="text-sm text-muted-foreground truncate hidden sm:block">
              {currentTrack.artist}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-32 md:w-48"
              disabled={streamStatus !== "ready"}
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
            className="h-8 w-8 rounded-full"
            disabled={streamStatus === "loading"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume controls (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleToggleMute} className="h-8 w-8">
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-24"
          />
        </div>

        {/* Expand to full player */}
        <Button variant="ghost" size="icon" onClick={() => setIsMiniPlayer(false)} className="h-8 w-8">
          <Expand className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}