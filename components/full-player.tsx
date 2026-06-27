"use client"

import { useState, useEffect, useRef } from "react"
import { useStore } from "@/lib/store"
import { useAudioManager } from "@/hooks/use-audio-manager"
import { TipModal } from "./player/tip-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
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
  Loader2,
  Link as LinkIcon
} from "lucide-react"

export function FullPlayer() {
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
  const streamSentRef = useRef(false)

  useEffect(() => { streamSentRef.current = false }, [currentTrack?.id])

  useEffect(() => {
    if (!currentTrack || !isPlaying || streamSentRef.current) return
    const threshold = (currentTrack.category === 'Podcast' || currentTrack.category?.toLowerCase() === 'podcast') ? 240 : 60
    const check = setInterval(() => {
      if (audioElement && audioElement.currentTime >= threshold) {
        streamSentRef.current = true
        clearInterval(check)
        fetch('/.netlify/functions/nft-indexer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'stream',
            payload: {
              user_id: useStore.getState().user?.piuser || 'anonymous',
              track_id: currentTrack.id,
              quality: currentQuality || 'standard',
              duration: Math.floor(audioElement.currentTime),
              owned: currentTrack.owned || false
            }
          })
        }).catch(() => {})
      }
    }, 1000)
    return () => { clearInterval(check) }
  }, [isPlaying, currentTrack?.id])

  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

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

  const truncateHash = (hash: string, startChars = 6, endChars = 4) => {
    if (!hash || hash.length <= startChars + endChars) return hash
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`
  }

  const currentTime = audioElement?.currentTime || 0
  const duration = audioElement?.duration || currentTrack.duration || 0
  const trackIsLiked = isLiked(currentTrack.id)

  const blockchainData = {
    network: currentTrack.blockchain || "Pi Network",
    contractAddress: currentTrack.contractAddress || "GCDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    tokenId: currentTrack.tokenId || "1234567890",
    transactionHash: currentTrack.txHash || "GTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    mintDate: currentTrack.mintDate || "2024-01-15T10:30:00Z",
    creatorWallet: currentTrack.creatorWallet || "GAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    ipfsHash: currentTrack.ipfsHash || "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXX",
    blockchainExplorer: currentTrack.explorerUrl || "https://pi-blockchain.net"
  }

  const isDark = mounted ? (resolvedTheme === 'dark' || theme === 'dark') : true

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${
      isDark
        ? 'bg-gradient-to-b from-gray-900 to-black'
        : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <div className={`flex items-center justify-between p-6 border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMiniPlayer(true)}
            className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Now Playing
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleLike(currentTrack.id)}
            className={trackIsLiked ? "text-red-500 hover:text-red-400" : (isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900")}
          >
            <Heart className={`w-5 h-5 ${trackIsLiked ? "fill-current" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(window.location.href, "share")}
            className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          >
            {copiedField === "share" ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo(!showInfo)}
            className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="relative mb-8">
          <div className={`aspect-square max-w-md mx-auto rounded-2xl overflow-hidden ${
            isDark ? 'shadow-2xl' : 'shadow-xl border border-gray-200'
          }`}>
            <img
              src={currentTrack.coverUrl || "/placeholder.svg"}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          {streamStatus === "loading" && (
            <div className={`absolute inset-0 flex items-center justify-center rounded-2xl ${
              isDark ? 'bg-black/80' : 'bg-white/90'
            }`}>
              <Loader2 className={`w-12 h-12 animate-spin ${
                isDark ? 'text-white' : 'text-gray-900'
              }`} />
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {currentTrack.title}
          </h1>
          <p className={`text-xl mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentTrack.artist}
          </p>

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

          <div className="mb-8">
            <div className={`flex justify-between text-sm mb-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
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

          <div className="flex items-center justify-center gap-6 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShuffle(!shuffle)}
              className={`w-12 h-12 ${shuffle ? "text-purple-500" : (isDark ? "text-gray-400" : "text-gray-600")}`}
            >
              <Shuffle className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              onClick={handlePrevious}
              disabled={streamStatus !== "ready"}
            >
              <SkipBack className="w-6 h-6" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className={`w-16 h-16 rounded-full ${
                isDark
                  ? 'bg-white hover:bg-gray-200 text-black'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
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
              className={`w-12 h-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              onClick={handleNext}
              disabled={queue.length === 0 || streamStatus !== "ready"}
            >
              <SkipForward className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRepeat(!repeat)}
              className={`w-12 h-12 ${repeat ? "text-purple-500" : (isDark ? "text-gray-400" : "text-gray-600")}`}
            >
              <Repeat className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
              className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
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
            <span className={`text-sm w-12 text-right ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {isMuted ? 0 : volume}%
            </span>
          </div>

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

        {showInfo && (
          <div className={`mt-8 pt-8 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Track Details
            </h3>
            {currentTrack.description && (
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTrack.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`rounded-lg p-4 ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-100'
              }`}>
                <div className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Category
                </div>
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentTrack.category || "Uncategorized"}
                </div>
              </div>
              <div className={`rounded-lg p-4 ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-100'
              }`}>
                <div className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Resale Fee
                </div>
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentTrack.resaleFee || 0}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(currentTrack.id, "id")}
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
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
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTipModalOpen(true)}
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Tip Creator
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`rounded-lg p-4 text-center ${
                isDark ? 'bg-gray-800/30' : 'bg-gray-100/50'
              }`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentTrack.likeCount || 0}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Likes
                </div>
              </div>
              <div className={`rounded-lg p-4 text-center ${
                isDark ? 'bg-gray-800/30' : 'bg-gray-100/50'
              }`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentTrack.streamCount || 0}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Streams
                </div>
              </div>
            </div>

            <div className={`mt-6 rounded-lg p-6 border ${
              isDark ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Blockchain Details
                </h4>
                <Badge variant="outline" className="px-2 py-1">
                  {blockchainData.network}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Creator Wallet
                  </div>
                  <div className={`flex items-center justify-between gap-2 p-3 rounded-md ${
                    isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-200'
                  }`}>
                    <code className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {truncateHash(blockchainData.creatorWallet, 8, 6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(blockchainData.creatorWallet, "wallet")}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === "wallet" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Contract Address
                  </div>
                  <div className={`flex items-center justify-between gap-2 p-3 rounded-md ${
                    isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-200'
                  }`}>
                    <code className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {truncateHash(blockchainData.contractAddress, 8, 6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(blockchainData.contractAddress, "contract")}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === "contract" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Transaction Hash
                  </div>
                  <div className={`flex items-center justify-between gap-2 p-3 rounded-md ${
                    isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-200'
                  }`}>
                    <code className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {truncateHash(blockchainData.transactionHash, 10, 8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(blockchainData.transactionHash, "txhash")}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === "txhash" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Token ID
                    </div>
                    <div className={`p-3 rounded-md ${isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-200'}`}>
                      <code className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {blockchainData.tokenId}
                      </code>
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Mint Date
                    </div>
                    <div className={`p-3 rounded-md ${isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-200'}`}>
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(blockchainData.mintDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    IPFS Hash
                  </div>
                  <div className={`flex items-center justify-between gap-2 p-3 rounded-md ${
                    isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-200'
                  }`}>
                    <code className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {truncateHash(blockchainData.ipfsHash, 8, 6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(blockchainData.ipfsHash, "ipfs")}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === "ipfs" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => window.open(blockchainData.blockchainExplorer, '_blank')}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  View on Pi Network Explorer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className={`p-4 border-t ${
          isDark ? 'border-red-800/50 bg-red-900/20' : 'border-red-200 bg-red-50'
        }`}>
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

      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        artistName={currentTrack.artist}
        trackTitle={currentTrack.title}
      />
    </div>
  )
}