"use client"

import { useStore } from "@/lib/store"
import { Play, Pause, SkipBack, SkipForward, Maximize2, X, Volume2, ListMusic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useState, useEffect, useRef } from "react"

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    setIsMiniPlayer,
    setCurrentTrack,
    currentStreamUrl,
    setCurrentStreamUrl,
    currentQuality,
  } = useStore()
  
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!currentTrack) return

    const fetchStreamUrl = async () => {
      try {
        const response = await fetch(`/api/stream/${currentTrack.id}?userId=demo-user`)
        const data = await response.json()
        setCurrentStreamUrl(data.streamUrl, data.quality)
        
        if (audioRef.current && data.streamUrl) {
          audioRef.current.src = data.streamUrl
          if (isPlaying) {
            audioRef.current.play()
          }
        }
      } catch (error) {
        console.error("[v0] Failed to fetch stream URL:", error)
      }
    }

    fetchStreamUrl()
  }, [currentTrack, setCurrentStreamUrl])

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = volume / 100
      
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current && currentTrack) {
          const progress = (audioRef.current.currentTime / currentTrack.duration) * 100
          setProgress(progress)
        }
      })
      
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false)
        setProgress(0)
      })
    }
    
    if (isPlaying && currentStreamUrl) {
      audioRef.current.play()
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentStreamUrl, currentTrack])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  if (!currentTrack) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentTime = audioRef.current?.currentTime || 0

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-30 pb-safe">
      <Slider
        value={[progress]}
        onValueChange={(value) => {
          setProgress(value[0])
          if (audioRef.current && currentTrack) {
            audioRef.current.currentTime = (value[0] / 100) * currentTrack.duration
          }
        }}
        max={100}
        step={0.1}
        className="w-full h-1 cursor-pointer"
      />
      
      <div className="container px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setIsMiniPlayer(false)} className="shrink-0 relative group" aria-label="Expand player">
            <img
              src={currentTrack.coverUrl || "/placeholder.svg"}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{currentTrack.artist}</span>
              <span className="text-primary">•</span>
              <span className="shrink-0">{currentQuality || "Loading..."}</span>
              
              {currentTrack.edition && currentTrack.totalEditions && (
                <>
                  <span className="text-primary">•</span>
                  <span className="shrink-0">
                    #{currentTrack.edition}/{currentTrack.totalEditions}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0">
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              className="w-10 h-10 shrink-0"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(currentTrack.duration)}
            </span>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              
              {showVolumeSlider && (
                <div className="absolute bottom-full right-0 mb-2 p-2 bg-card border rounded-lg shadow-lg">
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={100}
                    className="w-24 h-2"
                  />
                </div>
              )}
            </div>
            
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <ListMusic className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setIsMiniPlayer(false)}
              aria-label="Expand player"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => {
                setCurrentTrack(null)
                if (audioRef.current) {
                  audioRef.current.pause()
                  audioRef.current.src = ""
                }
              }}
              aria-label="Close player"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
