import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { subscriptionService } from "@/lib/subscription-service"
import type { AudioTrack } from "@/lib/store"

export function useSubscriptionAudio(track: AudioTrack | null) {
  const user = useStore((state) => state.user)
  const setCurrentStreamUrl = useStore((state) => state.setCurrentStreamUrl)
  const setError = useStore((state) => state.setError)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!track) return

    const loadAudio = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get user's subscription tier audio quality
        const quality = subscriptionService.getAudioQuality(user)

        // If track has multiple quality URLs, use them
        if (track.audioUrls) {
          let selectedUrl: string

          switch (quality) {
            case "320kbps":
              selectedUrl = track.audioUrls.hq || track.audioUrls.standard
              break
            case "256kbps":
              selectedUrl = track.audioUrls.standard || track.audioUrls.preview
              break
            case "128kbps":
            default:
              selectedUrl = track.audioUrls.preview
              break
          }

          setCurrentStreamUrl(selectedUrl, quality)
        } else {
          // Fallback to single audioUrl - request appropriate quality from backend
          const response = await fetch(`/api/stream/${track.id}?quality=${quality}`, {
            headers: {
              Authorization: user ? `Bearer ${user.accessToken}` : ""
            }
          })

          if (!response.ok) {
            throw new Error("Failed to load audio stream")
          }

          const data = await response.json()
          setCurrentStreamUrl(data.streamUrl, quality)
        }
      } catch (error) {
        console.error("Audio loading error:", error)
        setError("Failed to load audio. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadAudio()
  }, [
    track?.id,
    // user.subscription is a string ("free" | "premium") in your store
    user?.subscription,
    user?.accessToken,
    setCurrentStreamUrl,
    setError
  ])

  return { loading }
}
