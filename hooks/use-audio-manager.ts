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

  // Use a ref to track if we're currently fetching/loading
  const isLoadingRef = useRef(false)

  // Initialize audio element once
  useEffect(() => {
    if (!audioElement) {
      const audio = getGlobalAudio()
      audio.volume = volume / 100
      audio.preload = 'metadata'
      setAudioElement(audio)
    }
  }, [audioElement, setAudioElement, volume])

  // Fetch stream URL when track changes
  useEffect(() => {
    if (!currentTrack || !audioElement) return

    // Mark that we're starting a new load
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
        const response = await fetch(`/api/stream/${currentTrack.id}?userId=${userId}`)

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
        
        // Load the source without auto-playing
        const loadPromise = audioElement.load()
        
        setCurrentStreamUrl(data.streamUrl, data.quality)
        
        // Wait for both load to complete and metadata to be available
        await Promise.all([
          loadPromise,
          new Promise(resolve => {
            if (audioElement.readyState >= 1) {
              resolve(true)
            } else {
              audioElement.addEventListener('loadedmetadata', resolve, { once: true })
            }
          })
        ])
        
        // Mark loading as complete
        isLoadingRef.current = false
        setStreamStatus('ready')

        // Only auto-play if isPlaying was true AND no new load has started
        if (isPlaying && !isLoadingRef.current) {
          const playPromise = audioElement.play()
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              // Only report error if it's not an abort error (which happens during normal loading)
              if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Playback failed:', err)
                setError('Playback failed')
                setStreamStatus('error')
              }
            })
          }
        }
      } catch (err) {
        isLoadingRef.current = false
        console.error('Failed to fetch stream URL:', err)
        setError(err instanceof Error ? err.message : 'Stream error')
        setStreamStatus('error')
      }
    }

    fetchStreamUrl()
    
    // Cleanup function for when component unmounts or track changes
    return () => {
      isLoadingRef.current = false
    }
  }, [currentTrack?.id, audioElement, setCurrentStreamUrl, setError, setStreamLogged, setStreamStatus])

  // Handle play/pause - only for the currently loaded track
  useEffect(() => {
    if (!audioElement || !currentStreamUrl) return
    
    // Don't try to play if we're still loading
    if (isLoadingRef.current) return

    const handlePlayPause = async () => {
      if (isPlaying) {
        try {
          const playPromise = audioElement.play()
          if (playPromise !== undefined) {
            await playPromise
          }
        } catch (err) {
          // Don't treat AbortError as a real error - it's expected during track changes
          if (err instanceof DOMException && err.name === 'AbortError') {
            console.log('Playback interrupted by track change')
          } else if (err instanceof Error) {
            console.error('Playback error:', err)
            setIsPlaying(false)
            setError('Playback failed')
          }
        }
      } else {
        audioElement.pause()
      }
    }

    handlePlayPause()
  }, [isPlaying, currentStreamUrl, audioElement, setIsPlaying, setError])

  // Update volume
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted, audioElement])

  // Audio event listeners
  useEffect(() => {
    if (!audioElement || !currentTrack) return

    const updateProgress = () => {
      if (audioElement.duration && !isNaN(audioElement.duration)) {
        const prog = (audioElement.currentTime / audioElement.duration) * 100
        setProgress(prog || 0)
      }
    }

    const handleWaiting = () => setStreamStatus('buffering')
    const handleCanPlay = () => setStreamStatus('ready')
    const handleError = () => {
      setError('Playback error')
      setStreamStatus('error')
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      // Auto-play next track if in queue
      if (queue.length > 0) {
        const nextTrack = queue[0]
        setCurrentTrack(nextTrack)
        setQueue(queue.slice(1))
      }
    }

    audioElement.addEventListener('timeupdate', updateProgress)
    audioElement.addEventListener('waiting', handleWaiting)
    audioElement.addEventListener('canplay', handleCanPlay)
    audioElement.addEventListener('error', handleError)
    audioElement.addEventListener('ended', handleEnded)

    return () => {
      audioElement.removeEventListener('timeupdate', updateProgress)
      audioElement.removeEventListener('waiting', handleWaiting)
      audioElement.removeEventListener('canplay', handleCanPlay)
      audioElement.removeEventListener('error', handleError)
      audioElement.removeEventListener('ended', handleEnded)
    }
  }, [audioElement, currentTrack?.id, setProgress, setStreamStatus, setError, setIsPlaying, queue, setCurrentTrack, setQueue])

  // Log stream for analytics after 30 seconds
  useEffect(() => {
    if (!isPlaying || !currentTrack || streamLogged) return

    const timer = setTimeout(async () => {
      try {
        await fetch('/api/analytics/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: currentTrack.id,
            userId: 'demo-user',
            quality: currentQuality,
            timestamp: Date.now(),
            owned: currentTrack.owned || false,
            duration: audioElement?.currentTime || 0,
          }),
        })
        setStreamLogged(true)
      } catch (err) {
        console.error('Failed to log stream:', err)
      }
    }, 30000)

    return () => clearTimeout(timer)
  }, [isPlaying, currentTrack?.id, streamLogged, currentQuality, audioElement, setStreamLogged])

  return {
    audioElement,
    currentTrack,
    isPlaying,
    currentStreamUrl,
  }
}
