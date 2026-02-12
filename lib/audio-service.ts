/**
 * Audio Service
 * 
 * Singleton service for managing the global audio element and playback.
 * Uses the same pattern as notificationService.
 */

class AudioServiceClass {
  private audioElement: HTMLAudioElement | null = null
  private eventListeners: Map<string, Set<Function>> = new Map()

  /**
   * Initialize the global audio element (singleton)
   */
  initialize(): HTMLAudioElement {
    if (typeof window === 'undefined') {
      throw new Error('AudioService can only be initialized on the client side')
    }

    if (!this.audioElement) {
      this.audioElement = new Audio()
      this.audioElement.preload = 'metadata'
      
      // Forward native events to listeners
      this.audioElement.addEventListener('timeupdate', () => this.emit('timeupdate'))
      this.audioElement.addEventListener('play', () => this.emit('play'))
      this.audioElement.addEventListener('pause', () => this.emit('pause'))
      this.audioElement.addEventListener('ended', () => this.emit('ended'))
      this.audioElement.addEventListener('waiting', () => this.emit('buffering'))
      this.audioElement.addEventListener('canplay', () => this.emit('ready'))
      this.audioElement.addEventListener('error', (e) => this.emit('error', e))
    }

    return this.audioElement
  }

  /**
   * Get the current audio element
   */
  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement
  }

  /**
   * Load a track from URL
   */
  async loadTrack(url: string): Promise<void> {
    if (!this.audioElement) {
      this.initialize()
    }
    
    return new Promise((resolve, reject) => {
      if (!this.audioElement) {
        reject(new Error('Failed to initialize audio element'))
        return
      }

      const handleCanPlay = () => {
        this.audioElement?.removeEventListener('canplay', handleCanPlay)
        this.audioElement?.removeEventListener('error', handleError)
        resolve()
      }

      const handleError = (e: Event) => {
        this.audioElement?.removeEventListener('canplay', handleCanPlay)
        this.audioElement?.removeEventListener('error', handleError)
        reject(new Error('Failed to load audio'))
      }

      this.audioElement.addEventListener('canplay', handleCanPlay)
      this.audioElement.addEventListener('error', handleError)

      this.audioElement.src = url
      this.audioElement.load()
    })
  }

  /**
   * Play current audio
   */
  async play(): Promise<void> {
    if (!this.audioElement) {
      throw new Error('Audio not initialized')
    }
    return this.audioElement.play()
  }

  /**
   * Pause current audio
   */
  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause()
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(value: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, value))
    }
  }

  /**
   * Get current volume (0-1)
   */
  getVolume(): number {
    return this.audioElement?.volume || 0
  }

  /**
   * Mute/unmute
   */
  setMuted(muted: boolean): void {
    if (this.audioElement) {
      this.audioElement.muted = muted
    }
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.audioElement?.muted || false
  }

  /**
   * Get current playback time in seconds
   */
  getCurrentTime(): number {
    return this.audioElement?.currentTime || 0
  }

  /**
   * Seek to position in seconds
   */
  seek(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, Math.min(time, this.getDuration()))
    }
  }

  /**
   * Get duration in seconds
   */
  getDuration(): number {
    return this.audioElement?.duration || 0
  }

  /**
   * Get playback state
   */
  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false
  }

  /**
   * Get buffered ranges
   */
  getBuffered(): TimeRanges | null {
    return this.audioElement?.buffered || null
  }

  /**
   * Event emitter
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)?.add(callback)
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback)
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, ...args: any[]): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(...args)
      } catch (e) {
        console.error(`Error in audio service event listener for ${event}:`, e)
      }
    })
  }

  /**
   * Clean up and destroy audio element
   */
  destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement.load()
      this.audioElement = null
    }
    this.eventListeners.clear()
  }

  /**
   * Check if a stream is playable
   */
  async canPlay(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio()
      const timeout = setTimeout(() => {
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('error', handleError)
        resolve(false)
      }, 5000)

      const handleCanPlay = () => {
        clearTimeout(timeout)
        audio.removeEventListener('error', handleError)
        resolve(true)
      }

      const handleError = () => {
        clearTimeout(timeout)
        audio.removeEventListener('canplay', handleCanPlay)
        resolve(false)
      }

      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('error', handleError)
      audio.src = url
      audio.load()
    })
  }
}

// Singleton instance
export const audioService = new AudioServiceClass()

// Re-export getGlobalAudio for backward compatibility
export const getGlobalAudio = () => audioService.getAudioElement() || audioService.initialize()
