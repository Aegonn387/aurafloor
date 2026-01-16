
"use client"

import { useStore } from "@/lib/store"
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
import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"

type StreamStatus = "loading" | "ready" | "error" | "buffering"

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    setIsMiniPlayer,
    setCurrentTrack,
    currentStreamUrl,
    setCurrentStreamUrl,
    currentQuality,
    audioElement,
    setAudioElement,
    queue,
    setQueue,
  } = useStore()

  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [streamLogged, setStreamLogged] = useState(false)
  const [adPlaying, setAdPlaying] = useState(false)
  const [playedAds, setPlayedAds] = useState<number[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(80)

  // Initialize audio element (shared with FullPlayer)
  useEffect(() => {
    if (!audioElement) {
      const audio = new Audio()
      audio.volume = volume / 100
      audio.preload = "metadata"
      setAudioElement(audio)
    }

    return () => {
      // Don't destroy audio element, it's shared
    }
  }, [audioElement, setAudioElement, volume])

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
            throw new Error("Access denied")
          } else if (response.status === 429) {
            throw new Error("Rate limit reached")
          }
          throw new Error("Stream failed")
        }

        const data = await response.json()

        if (!data.streamUrl) {
          throw new Error("No stream available")
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
                setError("Playback failed")
                setStreamStatus("error")
              })
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch stream URL:", err)
        setError(err instanceof Error ? err.message : "Stream error")
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
  }, [isPlaying, audioElement, streamStatus, adPlaying, setIsPlaying])

  // Update volume
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, audioElement, isMuted])

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
      setError("Playback error")
      setStreamStatus("error")
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)

      // Auto-play next track if in queue
      if (queue.length > 0) {
        handleNext()
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
  }, [audioElement, currentTrack, queue, setIsPlaying])

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
      const nextTrack = queue[0]
      setCurrentTrack(nextTrack)
      setQueue(queue.slice(1))
    }
  }, [queue, setCurrentTrack, setQueue])

  const handlePrevious = useCallback(() => {
    if (audioElement && audioElement.currentTime > 3) {
      audioElement.currentTime = 0
    } else {
      // TODO: Implement previous track from history
    }
  }, [audioElement])

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume(previousVolume)
    } else {
      setPreviousVolume(volume)
      setIsMuted(true)
    }
  }

  if (!currentTrack) return null

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentTime = audioElement?.currentTime || 0
  const duration = audioElement?.duration || currentTrack.duration

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-30 pb-safe">
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
              onClick={handlePrevious}
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
              onClick={handleNext}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={toggleMute}
                    >
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
              className="w-8 h-8"
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
              onClick={() => {
                setCurrentTrack(null)
                if (audioElement) {
                  audioElement.pause()
                  audioElement.src = ""
                }
              }}
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
              onClick={() => {
                setCurrentTrack(null)
                if (audioElement) {
                  audioElement.pause()
                  audioElement.src = ""
                }
              }}
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
