import { useEffect, useCallback, useRef } from "react"
import { useStore } from "@/lib/store"
import { getGlobalAudio } from "@/lib/audio-manager"

export function useAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    progress,
    setProgress,
    volume,
    isMuted,
    streamStatus,
    setStreamStatus,
    setError,
    error,
    currentStreamUrl,
    setCurrentStreamUrl,
    currentQuality,
    audioElement,
    setAudioElement,
    streamLogged,
    setStreamLogged,
    adPlaying,
    setAdPlaying,
    playedAds,
    addPlayedAd,
    repeat,
    playNext,
    seekTo,
    setCurrentTrack,
    queue,
    shuffle,
  } = useStore()

  const streamLoggedRef = useRef(false)
  const adScheduleRef = useRef<number[]>([])
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  // Initialize audio element (singleton)
  useEffect(() => {
    if (!audioElement) {
      const audio = getGlobalAudio()
      setAudioElement(audio)
    }
  }, [audioElement, setAudioElement])

  // Fetch stream URL when track changes
  useEffect(() => {
    if (!currentTrack) return

    setStreamStatus("loading")
    setError(null)
    streamLoggedRef.current = false
    adScheduleRef.current = []

    const fetchStream = async () => {
      try {
        const userId = "demo-user" // TODO: Get from auth context
        const response = await fetch(`/api/stream/${currentTrack.id}?userId=${userId}`)

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Access denied. Purchase to listen.")
          } else if (response.status === 429) {
            throw new Error("Rate limit reached.")
          }
          throw new Error("Failed to load stream")
        }

        const data = await response.json()

        if (!data.streamUrl) {
          throw new Error("No stream URL received")
        }

        setCurrentStreamUrl(data.streamUrl, data.quality)

        if (audioElement) {
          audioElement.src = data.streamUrl
          setStreamStatus("ready")

          // Set up ad schedule for free tier
          if (!currentTrack.owned) {
            adScheduleRef.current = [
              currentTrack.duration * 0.25,
              currentTrack.duration * 0.5,
              currentTrack.duration * 0.75,
            ]
          }

          if (isPlaying) {
            await audioElement.play()
          }
        }
      } catch (err) {
        console.error("[useAudioPlayer] Stream fetch failed:", err)
        setError(err instanceof Error ? err.message : "Stream error")
        setStreamStatus("error")
      }
    }

    fetchStream()

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [currentTrack, setCurrentStreamUrl, setStreamStatus, setError, audioElement, isPlaying])

  // Update progress periodically
  useEffect(() => {
    if (!audioElement || !currentTrack || !isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      return
    }

    const updateProgress = () => {
      const duration = audioElement.duration
      const currentTime = audioElement.currentTime

      if (duration && !isNaN(duration) && currentTime > 0) {
        const prog = (currentTime / duration) * 100
        setProgress(prog)

        // Check for ad triggers
        if (!currentTrack.owned && !adPlaying) {
          const shouldPlayAd = adScheduleRef.current.find(
            (adTime) => Math.abs(currentTime - adTime) < 0.5 && !playedAds.includes(adTime)
          )
          if (shouldPlayAd) {
            playAd(shouldPlayAd)
          }
        }
      }
    }

    progressIntervalRef.current = setInterval(updateProgress, 100)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [audioElement, currentTrack, isPlaying, adPlaying, playedAds, setProgress])

  // Handle play/pause
  useEffect(() => {
    if (!audioElement || streamStatus !== "ready") return

    const handlePlayPause = async () => {
      try {
        if (isPlaying && !adPlaying) {
          await audioElement.play()
        } else if (!adPlaying) {
          audioElement.pause()
        }
      } catch (err) {
        console.error("[useAudioPlayer] Playback error:", err)
        setIsPlaying(false)
      }
    }

    handlePlayPause()
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

      // Auto-play next or repeat
      if (repeat) {
        audioElement.currentTime = 0
        setIsPlaying(true)
      } else {
        if (shuffle && queue.length > 0) {
          // Play random track from queue
          const randomIndex = Math.floor(Math.random() * queue.length)
          const randomTrack = queue[randomIndex]
          setCurrentTrack(randomTrack)
        } else {
          playNext()
        }
      }
    }

    audioElement.addEventListener("waiting", handleWaiting)
    audioElement.addEventListener("canplay", handleCanPlay)
    audioElement.addEventListener("error", handleError)
    audioElement.addEventListener("ended", handleEnded)

    return () => {
      audioElement.removeEventListener("waiting", handleWaiting)
      audioElement.removeEventListener("canplay", handleCanPlay)
      audioElement.removeEventListener("error", handleError)
      audioElement.removeEventListener("ended", handleEnded)
    }
  }, [
    audioElement,
    currentTrack,
    repeat,
    shuffle,
    setIsPlaying,
    setProgress,
    setStreamStatus,
    setError,
    playNext,
    queue,
    setCurrentTrack,
  ])

  // Stream analytics (30-second mark)
  useEffect(() => {
    if (!isPlaying || !currentTrack || streamLoggedRef.current || adPlaying) return

    const timer = setTimeout(async () => {
      try {
        await fetch("/api/analytics/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackId: currentTrack.id,
            userId: "demo-user",
            quality: currentQuality,
            timestamp: Date.now(),
            owned: currentTrack.owned || false,
            duration: audioElement?.currentTime || 0,
          }),
        })
        streamLoggedRef.current = true
        setStreamLogged(true)
      } catch (err) {
        console.error("[useAudioPlayer] Stream logging failed:", err)
      }
    }, 30000)

    return () => clearTimeout(timer)
  }, [isPlaying, currentTrack, currentQuality, adPlaying, setStreamLogged, audioElement])

  const playAd = useCallback(
    async (adTime: number) => {
      if (!audioElement || !currentTrack) return

      const trackPosition = audioElement.currentTime
      setAdPlaying(true)
      setIsPlaying(false)
      audioElement.pause()

      try {
        const adResponse = await fetch("/api/ads/get-ad")
        const adData = await adResponse.json()

        if (adData.adUrl) {
          const adAudio = new Audio(adData.adUrl)
          adAudio.volume = volume / 100

          await new Promise<void>((resolve) => {
            adAudio.onended = () => resolve()
            adAudio.play()
          })

          // Log ad impression
          await fetch("/api/ads/log-impression", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackId: currentTrack.id,
              adId: adData.adId,
              userId: "demo-user",
              timestamp: Date.now(),
            }),
          })
        }
      } catch (err) {
        console.error("[useAudioPlayer] Ad playback failed:", err)
      }

      addPlayedAd(adTime)
      audioElement.currentTime = trackPosition
      setAdPlaying(false)
      setIsPlaying(true)
    },
    [audioElement, currentTrack, volume, setAdPlaying, setIsPlaying, addPlayedAd]
  )

  return {
    // State
    currentTrack,
    isPlaying,
    progress,
    volume,
    streamStatus,
    error,
    currentQuality,

    // Audio info
    currentTime: audioElement?.currentTime || 0,
    duration: audioElement?.duration || 0,

    // Actions
    seek: seekTo,
  }
}
