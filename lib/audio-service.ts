class AudioService {
  private audio: HTMLAudioElement | null = null
  private isCurrentlyLoading: boolean = false
  private currentLoadReject: ((reason?: any) => void) | null = null

  initialize(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio()
      this.audio.crossOrigin = "anonymous"
      this.audio.preload = "auto"
    }
    return this.audio
  }

  async loadTrack(url: string): Promise<void> {
    // If a track is currently loading, reject the previous load
    if (this.isCurrentlyLoading && this.currentLoadReject) {
      this.currentLoadReject(new Error("Load interrupted by new track"))
      this.currentLoadReject = null
      
      // Clean up any existing event listeners
      if (this.audio) {
        this.audio.onerror = null
        this.audio.oncanplay = null
        this.audio.oncanplaythrough = null
        this.audio.onloadeddata = null
      }
    }

    this.isCurrentlyLoading = true

    if (!this.audio) {
      this.initialize()
    }

    if (this.audio) {
      // Pause any current playback and reset
      this.audio.pause()
      this.audio.currentTime = 0

      // FIX: Check if URL is an API route and needs to be resolved
      let audioUrl = url
      if (url.includes('/api/')) {
        try {
          // Fetch the API to get the actual stream URL
          const response = await fetch(url)
          if (!response.ok) {
            this.isCurrentlyLoading = false
            throw new Error(`API request failed with status ${response.status}`)
          }
          const data = await response.json()
          if (!data.streamUrl) {
            this.isCurrentlyLoading = false
            throw new Error('API response does not contain streamUrl')
          }
          audioUrl = data.streamUrl
        } catch (error) {
          this.isCurrentlyLoading = false
          throw new Error(`Failed to get stream URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      this.audio.src = audioUrl
      this.audio.load()

      return new Promise((resolve, reject) => {
        if (!this.audio) {
          this.isCurrentlyLoading = false
          return reject(new Error("Audio element not initialized"))
        }

        // Store the reject function to allow interruption
        this.currentLoadReject = reject

        let cleanupDone = false
        let timeoutId: ReturnType<typeof setTimeout> | null = null

        const cleanup = () => {
          if (cleanupDone) return
          cleanupDone = true
          this.isCurrentlyLoading = false
          this.currentLoadReject = null

          this.audio?.removeEventListener('canplay', onCanPlay)
          this.audio?.removeEventListener('canplaythrough', onCanPlay)
          this.audio?.removeEventListener('error', onError)
          this.audio?.removeEventListener('loadeddata', onLoadedData)

          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }

        const onCanPlay = () => {
          cleanup()
          console.log(`[AudioService] Track ready to play: ${audioUrl}`)
          resolve()
        }

        const onLoadedData = () => {
          console.log(`[AudioService] Audio data loaded: ${audioUrl}`)
        }

        const onError = (e: Event) => {
          cleanup()

          // Get detailed error information
          let errorMessage = "Failed to load audio"
          let errorDetails = ""

          if (this.audio && this.audio.error) {
            const errorCode = this.audio.error.code
            errorDetails = `Error code: ${errorCode}`

            switch (errorCode) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = "Audio loading was aborted by the user"
                break
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = "Network error - failed to load audio file"
                break
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = "Audio decoding failed - file may be corrupted or unsupported format"
                break
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = "Audio format not supported by this browser or CORS issue"
                break
              default:
                errorMessage = `Audio error (code ${errorCode})`
            }
          } else {
            errorDetails = "No specific error code available"
          }

          console.error(`[AudioService] ${errorMessage} - URL: ${audioUrl}`)
          if (errorDetails) console.error(`[AudioService] ${errorDetails}`)

          reject(new Error(errorMessage))
        }

        // Add event listeners
        this.audio.addEventListener('canplay', onCanPlay)
        this.audio.addEventListener('canplaythrough', onCanPlay)
        this.audio.addEventListener('error', onError)
        this.audio.addEventListener('loadeddata', onLoadedData)

        // Timeout after 30 seconds
        timeoutId = setTimeout(() => {
          cleanup()
          console.error(`[AudioService] Audio loading timeout after 30s: ${audioUrl}`)
          reject(new Error("Audio loading timeout - server may be unresponsive"))
        }, 30000)
      })
    } else {
      this.isCurrentlyLoading = false
      throw new Error("Failed to initialize audio element")
    }
  }

  async play(): Promise<void> {
    if (this.audio) {
      // Ensure audio is not currently loading
      if (this.isCurrentlyLoading) {
        throw new Error("Cannot play while audio is loading")
      }

      // Check if audio has a valid source
      if (!this.audio.src) {
        throw new Error("No audio source loaded")
      }

      try {
        await this.audio.play()
      } catch (error) {
        console.error("[AudioService] Playback failed:", error)
        throw error
      }
    } else {
      throw new Error("Audio element not initialized")
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause()
    }
  }

  seek(time: number): void {
    if (this.audio && !isNaN(this.audio.duration)) {
      this.audio.currentTime = time
    }
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0
  }

  getDuration(): number {
    return this.audio?.duration || 0
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audio
  }

  destroy(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    this.isCurrentlyLoading = false
    this.currentLoadReject = null
  }

  isLoading(): boolean {
    return this.isCurrentlyLoading
  }
}

export const audioService = new AudioService()
