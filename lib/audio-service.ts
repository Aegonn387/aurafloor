class AudioService {
  private audio: HTMLAudioElement | null = null
  
  initialize(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio()
      this.audio.crossOrigin = "anonymous"
      this.audio.preload = "auto"
    }
    return this.audio
  }
  
  async loadTrack(url: string): Promise<void> {
    if (!this.audio) {
      this.initialize()
    }
    
    if (this.audio) {
      this.audio.src = url
      this.audio.load()
      
      return new Promise((resolve, reject) => {
        if (!this.audio) return reject(new Error("Audio element not initialized"))
        
        const onCanPlay = () => {
          this.audio?.removeEventListener('canplay', onCanPlay)
          this.audio?.removeEventListener('error', onError)
          resolve()
        }
        
        const onError = (e: Event) => {
          this.audio?.removeEventListener('canplay', onCanPlay)
          this.audio?.removeEventListener('error', onError)
          reject(new Error("Failed to load audio"))
        }
        
        this.audio.addEventListener('canplay', onCanPlay)
        this.audio.addEventListener('error', onError)
        
        // Timeout after 30 seconds
        setTimeout(() => {
          this.audio?.removeEventListener('canplay', onCanPlay)
          this.audio?.removeEventListener('error', onError)
          reject(new Error("Audio loading timeout"))
        }, 30000)
      })
    }
  }
  
  async play(): Promise<void> {
    if (this.audio) {
      try {
        await this.audio.play()
      } catch (error) {
        console.error("Playback failed:", error)
        throw error
      }
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
  }
}

export const audioService = new AudioService()
