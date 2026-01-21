// Global audio element manager to share a single Audio instance
// between MiniPlayer and FullPlayer components

let globalAudioElement: HTMLAudioElement | null = null

export const getGlobalAudio = (): HTMLAudioElement => {
  if (!globalAudioElement) {
    globalAudioElement = new Audio()
    globalAudioElement.preload = "metadata"
    console.log("[AudioManager] Global audio element created")
  }
  return globalAudioElement
}

export const destroyGlobalAudio = (): void => {
  if (globalAudioElement) {
    globalAudioElement.pause()
    globalAudioElement.src = ""
    globalAudioElement = null
    console.log("[AudioManager] Global audio element destroyed")
  }
}

export const isGlobalAudioReady = (): boolean => {
  return globalAudioElement !== null
}
