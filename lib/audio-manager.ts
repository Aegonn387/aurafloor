export class AudioManager {
  private audio: HTMLAudioElement | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio()
    }
  }

  play(url: string) {
    if (this.audio) {
      this.audio.src = url
      this.audio.play()
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause()
    }
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = volume / 100
    }
  }

  seek(time: number) {
    if (this.audio) {
      this.audio.currentTime = time
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
}

export const audioManager = new AudioManager()
export const getGlobalAudio = () => audioManager.getAudioElement()
