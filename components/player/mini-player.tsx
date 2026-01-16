"use client"

import { useStore } from "@/lib/store"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  X,
  Volume2,
  ListMusic,
  Loader2,
  AlertCircle,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    setIsMiniPlayer,
    setCurrentTrack,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    queue,
    playNext,
    playPrevious,
  } = useStore()

  const { progress, streamStatus, error, currentQuality, seek, currentTime, duration } = useAudioPlayer()

  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(80)

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume(previousVolume)
    } else {
      setPreviousVolume(volume)
      setIsMuted(true)
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-30 pb-safe">
      <Slider
        value={[progress]}
        onValueChange={(value) => seek(value[0])}
        max={100}
        step={0.1}
        className="w-full h-1 cursor-pointer"
        disabled={streamStatus !== "ready"}
      />

      <div className="container px-3 py-2.5">
        {error && (
          <div className="mb-2 flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMiniPlayer(false)}
            className="shrink-0 relative group"
            aria-label="Expand player"
            disabled={streamStatus === "loading"}
          >
            <img
              src={currentTrack.coverUrl || "/placeholder.svg"}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover shadow-md group-hover:scale-105 transition-transform"
            />
            {streamStatus === "loading" && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
            {streamStatus === "buffering" && (
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{currentTrack.artist}</span>
              <span className="text-primary">•</span>
              <span className="shrink-0">
                {streamStatus === "loading"
                  ? "Loading..."
                  : streamStatus === "buffering"
                    ? "Buffering..."
                    : currentQuality || "HD"}
              </span>

              {currentTrack.edition && currentTrack.totalEditions && (
                <>
                  <span className="text-primary">•</span>
                  <span className="shrink-0">
                    #{currentTrack.edition}/{currentTrack.totalEditions}
                  </span>
                </>
              )}

              {!currentTrack.owned && (
                <>
                  <span className="text-primary">•</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    Free
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 shrink-0"
              onClick={() => playPrevious()}
              disabled={streamStatus !== "ready"}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              className="w-10 h-10 shrink-0"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={streamStatus === "loading" || streamStatus === "error"}
            >
              {streamStatus === "loading" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 shrink-0"
              onClick={() => playNext()}
              disabled={queue.length === 0 || streamStatus !== "ready"}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 300)}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>

              {showVolumeSlider && (
                <div
                  className="absolute bottom-full right-0 mb-2 p-3 bg-card border rounded-lg shadow-lg"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={(value) => {
                        setVolume(value[0])
                        if (value[0] > 0) setIsMuted(false)
                      }}
                      max={100}
                      orientation="vertical"
                      className="h-24"
                    />
                    <span className="text-xs text-muted-foreground">{isMuted ? 0 : volume}%</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 relative"
              disabled={queue.length === 0}
              title={queue.length > 0 ? `${queue.length} tracks in queue` : "No tracks in queue"}
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                  {queue.length}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setIsMiniPlayer(false)}
              aria-label="Expand player"
              disabled={streamStatus === "loading"}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setCurrentTrack(null)}
              aria-label="Close player"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile-only close button */}
          <div className="flex sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setCurrentTrack(null)}
              aria-label="Close player"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
