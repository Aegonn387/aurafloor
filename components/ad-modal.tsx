"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Volume2 } from "lucide-react"

interface AdModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdComplete: () => void
  nftId: string
  creatorId: string
}

export function AdModal({ open, onOpenChange, onAdComplete, nftId, creatorId }: AdModalProps) {
  const [adProgress, setAdProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [canSkip, setCanSkip] = useState(false)

  const startAd = async () => {
    setIsPlaying(true)

    // Simulate ad playback (15 seconds)
    const duration = 15000
    const interval = 100
    let elapsed = 0

    const timer = setInterval(() => {
      elapsed += interval
      const progress = (elapsed / duration) * 100
      setAdProgress(progress)

      // Allow skip after 5 seconds
      if (elapsed >= 5000) {
        setCanSkip(true)
      }

      if (elapsed >= duration) {
        clearInterval(timer)
        handleAdComplete()
      }
    }, interval)
  }

  const handleAdComplete = async () => {
    try {
      // Record ad impression and grant streaming access
      const response = await fetch("/api/stream/watch-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "current-user-id",
          nftId,
          creatorId,
        }),
      })

      if (response.ok) {
        onAdComplete()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("[v0] Ad completion failed:", error)
    }
  }

  const handleSkip = () => {
    if (canSkip) {
      handleAdComplete()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-2xl mx-2 sm:mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Watch Ad to Stream</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
            {!isPlaying ? (
              <Button 
                size="lg" 
                onClick={startAd}
                className="h-12 px-6 text-sm sm:text-base sm:h-14 sm:px-8"
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Play Ad
              </Button>
            ) : (
              <div className="text-center space-y-4 p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
                <p className="text-base sm:text-lg font-semibold">Ad Playing...</p>
                <Progress value={adProgress} className="w-48 sm:w-64 mx-auto" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {canSkip
                    ? "You can skip now"
                    : `${Math.ceil((15000 - (adProgress / 100) * 15000) / 1000)}s until skip`}
                </p>
              </div>
            )}
          </div>

          {isPlaying && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left max-w-md">
                Supporting creators through ad revenue • 40% goes to the artist
              </p>
              <Button 
                variant="outline" 
                onClick={handleSkip} 
                disabled={!canSkip}
                className="w-full sm:w-auto px-4 text-sm"
              >
                {canSkip ? "Skip Ad" : "Wait to Skip"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
