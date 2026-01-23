"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { useAudioManager } from "@/hooks/use-audio-manager"
import { TipModal } from "./player/tip-modal"
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
  X,
  Loader2
} from "lucide-react"

export function FullPlayer() {
  // Initialize shared audio manager
  useAudioManager()

  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    setIsMiniPlayer,
    isMiniPlayer,
    setCurrentTrack,
    audioElement,
    currentQuality,
    queue,
    progress,
    streamStatus,
    error,
    setError,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
    showInfo,
    setShowInfo,
    isLiked,
    toggleLike,
  } = useStore()

  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Don't render if mini player is active
  if (isMiniPlayer || !currentTrack) return null

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    if (audioElement && !isNaN(audioElement.duration)) {
      audioElement.currentTime = (value[0] / 100) * audioElement.duration
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] > 0) setIsMuted(false)
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleDownload = async () => {
    if (!currentTrack) return
    // Download functionality
    console.log('Download:', currentTrack.title)
  }

  const handleNext = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0]
      setCurrentTrack(nextTrack)
    }
  }

  const handlePrevious = () => {
    if (audioElement && audioElement.currentTime > 3) {
      audioElement.currentTime = 0
    }
  }

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentTime = audioElement?.currentTime || 0
  const duration = audioElement?.duration || currentTrack.duration || 0
  const trackIsLiked = isLiked(currentTrack.id)

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-black flex flex-col">
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
            onClick={() => toggleLike(currentTrack.id)}
            className={trackIsLiked ? "text-red-500 hover:text-red-400" : "text-gray-400 hover:text-white"}
          >
            <Heart className={`w-5 h-5 ${trackIsLiked ? "fill-current" : ""}`} />
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
              src={currentTrack.coverUrl || "/placeholder.svg"}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          {streamStatus === "loading" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
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
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="cursor-pointer"
              disabled={streamStatus !== "ready"}
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
              onClick={handlePrevious}
              disabled={streamStatus !== "ready"}
            >
              <SkipBack className="w-6 h-6" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className="w-16 h-16 bg-white hover:bg-gray-200 text-black rounded-full"
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
              className="w-12 h-12 text-gray-400"
              onClick={handleNext}
              disabled={queue.length === 0 || streamStatus !== "ready"}
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
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : volume < 50 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-40 cursor-pointer"
            />
            <span className="text-sm text-gray-400 w-12 text-right">{isMuted ? 0 : volume}%</span>
          </div>

          {/* Status Indicators */}
          {streamStatus !== "ready" && (
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
          )}
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
                onClick={() => setTipModalOpen(true)}
                className="text-gray-400 hover:text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Tip Creator
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{currentTrack.likeCount || 0}</div>
                <div className="text-sm text-gray-400">Likes</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{currentTrack.streamCount || 0}</div>
                <div className="text-sm text-gray-400">Streams</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">${currentTrack.adRevenue || 0}</div>
                <div className="text-sm text-gray-400">Ad Revenue</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 border-t border-red-800/50 bg-red-900/20">
          <Alert variant="destructive" className="border-0 bg-transparent">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Tip Modal */}
      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        artistName={currentTrack.artist}
        trackTitle={currentTrack.title}
      />
    </div>
  )
}
