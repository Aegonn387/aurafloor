"use client"

import { useState, useEffect, useCallback } from "react"
import { getGlobalAudio } from "@/lib/audio-manager"
import { TipModal } from "./tip-modal"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Repeat,
  Shuffle,
  ChevronDown,
  Heart,
  Share2,
  Info,
  ExternalLink,
  Copy,
  Check,
  Download,
  X
} from "lucide-react"
import { useStore } from "@/lib/store"

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
      const audio = getGlobalAudio()
      audio.volume = volume / 100
      audio.preload = "metadata"
      setAudioElement(audio)
    }

    // Don't destroy audio element, it's shared
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
            throw new Error("You don't have access to this track. Please purchase it first.")
          }
          throw new Error("Failed to fetch stream URL")
        }

        const data = await response.json()

        if (!data.streamUrl) {
          throw new Error("No stream available")
        }

        setCurrentStreamUrl(data.streamUrl, data.quality)
        setStreamStatus("ready")
      } catch (err) {
        console.error("Stream fetch failed:", err)
        setError(err instanceof Error ? err.message : "Stream error")
        setStreamStatus("error")
      }
    }

    fetchStreamUrl()
  }, [currentTrack, setCurrentStreamUrl])

  // Handle audio playback
  useEffect(() => {
    if (!audioElement || !currentStreamUrl) return

    const handleCanPlay = () => {
      setStreamStatus("ready")
      if (isPlaying) {
        audioElement.play().catch((err) => {
          console.error("Playback failed:", err)
          setStreamStatus("error")
        })
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      // TODO: Implement track ended logic
      console.log("Track ended")
    }

    const handleTimeUpdate = () => {
      if (audioElement.duration) {
        const newProgress = (audioElement.currentTime / audioElement.duration) * 100
        setProgress(newProgress)
      }
    }

    const handleError = () => {
      setStreamStatus("error")
      setError("Playback error occurred")
    }

    audioElement.src = currentStreamUrl
    audioElement.addEventListener("canplay", handleCanPlay)
    audioElement.addEventListener("play", handlePlay)
    audioElement.addEventListener("pause", handlePause)
    audioElement.addEventListener("ended", handleEnded)
    audioElement.addEventListener("timeupdate", handleTimeUpdate)
    audioElement.addEventListener("error", handleError)

    // Log stream analytics
    const logStream = async () => {
      if (!streamLogged && currentTrack) {
        try {
          await fetch("/api/analytics/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackId: currentTrack.id,
              userId: "demo-user", // TODO: Replace with actual user ID
              timestamp: Date.now(),
              quality: currentQuality
            })
          })
          setStreamLogged(true)
        } catch (err) {
          console.error("Failed to log stream:", err)
        }
      }
    }

    logStream()

    return () => {
      audioElement.removeEventListener("canplay", handleCanPlay)
      audioElement.removeEventListener("play", handlePlay)
      audioElement.removeEventListener("pause", handlePause)
      audioElement.removeEventListener("ended", handleEnded)
      audioElement.removeEventListener("timeupdate", handleTimeUpdate)
      audioElement.removeEventListener("error", handleError)
    }
  }, [audioElement, currentStreamUrl, isPlaying, setIsPlaying, currentTrack, currentQuality, streamLogged])

  // Handle ads
  useEffect(() => {
    if (!currentTrack || adPlaying) return

    const checkAd = () => {
      const currentTime = audioElement?.currentTime || 0
      const adTime = Math.floor(currentTime)

      // Play ad every 60 seconds (for demo)
      if (adTime > 0 && adTime % 60 === 0 && !playedAds.includes(adTime)) {
        setAdPlaying(true)
        setPlayedAds([...playedAds, adTime])

        // Simulate ad playback
        setTimeout(() => {
          setAdPlaying(false)
        }, 5000) // 5-second ad
      }
    }

    const interval = setInterval(checkAd, 1000)
    return () => clearInterval(interval)
  }, [currentTrack, audioElement, adPlaying, playedAds])

  // Update volume when changed
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume / 100
    }
  }, [volume, audioElement])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentTrack) return

      switch (e.key) {
        case " ":
          e.preventDefault()
          setIsPlaying(!isPlaying)
          break
        case "ArrowRight":
          if (e.ctrlKey) {
            e.preventDefault()
            // Next track
            const currentIndex = queue.findIndex(t => t.id === currentTrack?.id)
            if (currentIndex < queue.length - 1) {
              setCurrentTrack(queue[currentIndex + 1])
            }
          }
          break
        case "ArrowLeft":
          if (e.ctrlKey) {
            e.preventDefault()
            // Previous track
            const currentIndex = queue.findIndex(t => t.id === currentTrack?.id)
            if (currentIndex > 0) {
              setCurrentTrack(queue[currentIndex - 1])
            }
          }
          break
        case "m":
          e.preventDefault()
          setVolume(volume === 0 ? 80 : 0)
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentTrack, isPlaying, setIsPlaying, queue, setCurrentTrack, volume])

  const handlePlayPause = useCallback(() => {
    if (!audioElement) return

    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play().catch((err) => {
        console.error("Playback failed:", err)
        setStreamStatus("error")
      })
    }
  }, [audioElement, isPlaying])

  const handleSeek = (value: number[]) => {
    const newProgress = value[0]
    setProgress(newProgress)

    if (audioElement && !isNaN(audioElement.duration)) {
      audioElement.currentTime = (newProgress / 100) * audioElement.duration
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
  }

  const handleToggleMute = () => {
    setVolume(volume === 0 ? 80 : 0)
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleDownload = async () => {
    if (!currentStreamUrl || !currentTrack) return

    try {
      const response = await fetch(currentStreamUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${currentTrack.title} - ${currentTrack.artist}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Download failed:", err)
      setError("Download failed")
    }
  }

  const handleTip = () => {
    setTipModalOpen(true)
  }

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-900 to-black p-8">
        <div className="text-center text-gray-400">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
            <Play className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Track Selected</h3>
          <p className="text-gray-500">Select a track to start listening</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMiniPlayer(true)}
            className="text-gray-400 hover:text-white"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">Now Playing</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLiked(!isLiked)}
            className={isLiked ? "text-red-500 hover:text-red-400" : "text-gray-400 hover:text-white"}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(window.location.href, "share")}
            className="text-gray-400 hover:text-white"
          >
            {copiedField === "share" ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-400 hover:text-white"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Album Art */}
        <div className="relative mb-8">
          <div className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          {adPlaying && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl">
              <div className="text-center p-8">
                <div className="text-amber-500 font-bold text-lg mb-2">Advertisement</div>
                <p className="text-gray-300">Your support helps creators</p>
              </div>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{currentTrack.title}</h1>
          <p className="text-xl text-gray-300 mb-4">{currentTrack.artist}</p>

          <div className="flex items-center justify-center gap-4 mb-6">
            {currentQuality && (
              <Badge variant="secondary" className="px-3 py-1">
                {currentQuality}
              </Badge>
            )}
            {currentTrack.edition && (
              <Badge variant="outline" className="px-3 py-1">
                Edition {currentTrack.edition}/{currentTrack.totalEditions}
              </Badge>
            )}
            {currentTrack.streamCount && (
              <Badge variant="outline" className="px-3 py-1">
                {currentTrack.streamCount.toLocaleString()} streams
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{formatTime((progress / 100) * (currentTrack.duration || 0))}</span>
              <span>{formatTime(currentTrack.duration || 0)}</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="cursor-pointer"
            />
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShuffle(!shuffle)}
              className={`w-12 h-12 ${shuffle ? "text-purple-500" : "text-gray-400"}`}
            >
              <Shuffle className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 text-gray-400"
              // Previous track functionality
            >
              <SkipBack className="w-6 h-6" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className="w-16 h-16 bg-white hover:bg-gray-200 text-black rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 text-gray-400"
              // Next track functionality
            >
              <SkipForward className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRepeat(!repeat)}
              className={`w-12 h-12 ${repeat ? "text-purple-500" : "text-gray-400"}`}
            >
              <Repeat className="w-6 h-6" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
              className="text-gray-400 hover:text-white"
            >
              {volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : volume < 50 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-40 cursor-pointer"
            />
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {streamStatus === "loading" && (
              <div className="flex items-center gap-2 text-amber-500">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
            {streamStatus === "buffering" && (
              <div className="flex items-center gap-2 text-blue-500">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm">Buffering...</span>
              </div>
            )}
            {streamStatus === "error" && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm">Playback Error</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {showInfo && (
          <div className="mt-8 pt-8 border-t border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Track Details</h3>
            {currentTrack.description && (
              <p className="text-gray-300 mb-4">{currentTrack.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Category</div>
                <div className="font-medium">{currentTrack.category || "Uncategorized"}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Resale Fee</div>
                <div className="font-medium">{currentTrack.resaleFee || 0}%</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(currentTrack.id, "id")}
                className="text-gray-400 hover:text-white"
              >
                {copiedField === "id" ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy ID
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-gray-400 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTip}
                className="text-gray-400 hover:text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Tip Creator
              </Button>
            </div>

            {/* Stats */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="font-medium mb-3">Stats</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{currentTrack.likeCount || 0}</div>
                  <div className="text-sm text-gray-400">Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{currentTrack.streamCount || 0}</div>
                  <div className="text-sm text-gray-400">Streams</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${currentTrack.adRevenue || 0}</div>
                  <div className="text-sm text-gray-400">Ad Revenue</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 border-t border-red-800/50 bg-red-900/20">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </Alert>
        </div>
      )}

      {/* Tip Modal - FIXED: Changed props to match TipModalProps interface */}
      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        artistName={currentTrack.artist}
        trackTitle={currentTrack.title}
      />
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
