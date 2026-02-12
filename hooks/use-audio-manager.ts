import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { getGlobalAudio } from '@/lib/audio-manager'

export function useAudioManager() {
  const {
    currentTrack,
    isPlaying,
    audioElement,
    setAudioElement,
    setIsPlaying,
    setProgress,
    setStreamStatus,
    setError,
    currentStreamUrl,
    setCurrentStreamUrl,
    currentQuality,
    volume,
    isMuted,
    streamLogged,
    setStreamLogged,
    queue,
    setCurrentTrack,
    setQueue,
  } = useStore()

  const isLoadingRef = useRef(false)

  // Initialize audio element once
  useEffect(() => {
    if (!audioElement) {
      const audio = getGlobalAudio()
      if (!audio) return
      audio.volume = volume / 100
      audio.preload = 'metadata'
      setAudioElement(audio)
    }
  }, [audioElement, setAudioElement, volume])

  // Fetch stream URL when track changes
  useEffect(() => {
    if (!currentTrack || !audioElement) return

    isLoadingRef.current = true
    setStreamStatus('loading')
    setError(null)
    setStreamLogged(false)

    const fetchStreamUrl = async () => {
      try {
        // Clear current source first to prevent conflicts
        audioElement.pause()
        audioElement.currentTime = 0

        const userId = 'demo-user'

        // FIXED: Proper fetch with POST method
        const response = await fetch(`/api/stream/${currentTrack.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access denied')
          } else if (response.status === 429) {
            throw new Error('Rate limit reached')
          }
          throw new Error('Stream failed')
        }

        const data = await response.json()

        if (!data.streamUrl) {
          throw new Error('No stream available')
        }

        // Set the new source and wait for it to load
        audioElement.src = data.streamUrl
        audioElement.load()
        
        setCurrentStreamUrl(data.streamUrl, data.quality)
        setStreamStatus('ready')

        // Log stream analytics
        if (!streamLogged) {
          await fetch('/api/analytics/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackId: currentTrack.id,
              userId: userId,
              quality: data.quality,
              timestamp: new Date().toISOString(),
              owned: data.owned || false,
              duration: currentTrack.duration || 0,
            })
          }).catch(err => console.warn('Analytics failed:', err))
          
          setStreamLogged(true)
        }

        // If should be playing, start playback
        if (isPlaying) {
          await audioElement.play()
        }

      } catch (error) {
        console.error('[AudioManager] Error:', error)
        setError(error instanceof Error ? error.message : 'Failed to load stream')
        setStreamStatus('error')
        isLoadingRef.current = false
      }
    }

    fetchStreamUrl()
  }, [currentTrack?.id, audioElement])

  // Handle play/pause changes
  useEffect(() => {
    if (!audioElement) return

    if (isPlaying) {
      audioElement.play().catch(err => {
        console.error('[AudioManager] Play failed:', err)
        setIsPlaying(false)
      })
    } else {
      audioElement.pause()
    }
  }, [isPlaying, audioElement, setIsPlaying])

  // Handle volume changes
  useEffect(() => {
    if (!audioElement) return
    audioElement.volume = isMuted ? 0 : volume / 100
  }, [volume, isMuted, audioElement])

  // Track progress
  useEffect(() => {
    if (!audioElement) return

    const handleTimeUpdate = () => {
      if (audioElement.duration) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100
        setProgress(progress)
      }
    }

    const handleEnded = () => {
      // Play next track in queue if available
      const currentIndex = queue.findIndex(t => t.id === currentTrack?.id)
      if (currentIndex >= 0 && currentIndex < queue.length - 1) {
        setCurrentTrack(queue[currentIndex + 1])
      } else {
        setIsPlaying(false)
        setProgress(0)
      }
    }

    const handleError = (e: ErrorEvent) => {
      console.error('[AudioManager] Playback error:', e)
      setError('Playback error occurred')
      setStreamStatus('error')
      setIsPlaying(false)
    }

    audioElement.addEventListener('timeupdate', handleTimeUpdate)
    audioElement.addEventListener('ended', handleEnded)
    audioElement.addEventListener('error', handleError as any)

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate)
      audioElement.removeEventListener('ended', handleEnded)
      audioElement.removeEventListener('error', handleError as any)
    }
  }, [audioElement, currentTrack, queue, setProgress, setIsPlaying, setCurrentTrack, setError, setStreamStatus])

  return {
    audioElement,
  }
}