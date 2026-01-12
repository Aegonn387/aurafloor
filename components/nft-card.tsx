"use client"

import type React from "react"
import { Play, Heart, ShoppingCart, Gift, Headphones, Flag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AudioTrack } from "@/lib/store"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"
import { PurchaseModal } from "@/components/purchase-modal"
import { TipModal } from "@/components/tip-modal"
import { ReportModal } from "@/components/report-modal"

interface NFTCardProps {
  track: AudioTrack
  onTip?: () => void
}

export function NFTCard({ track, onTip }: NFTCardProps) {
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying } = useStore()
  const isCurrentTrack = currentTrack?.id === track.id
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (isCurrentTrack) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentTrack(track)
    }
  }

  const handleBuyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setPurchaseModalOpen(true)
  }

  const handleTipClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (onTip) {
      onTip()
    } else {
      setTipModalOpen(true)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      <Card className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
        <Link href={`/nft/${track.id}`} className="block flex-1">
          <div className="relative aspect-square">
            <img 
              src={track.coverUrl || "/placeholder.svg"} 
              alt={track.title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <Button
                size="icon"
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full shadow-lg bg-primary/90 hover:bg-primary hover:scale-110 transition-all"
                onClick={handlePlayClick}
              >
                <Play className={cn("w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", isCurrentTrack && isPlaying && "hidden")} />
                {isCurrentTrack && isPlaying && (
                  <div className="flex gap-1">
                    <div className="w-1 h-3 sm:h-4 md:h-5 bg-primary-foreground animate-pulse" />
                    <div className="w-1 h-3 sm:h-4 md:h-5 bg-primary-foreground animate-pulse delay-75" />
                    <div className="w-1 h-3 sm:h-4 md:h-5 bg-primary-foreground animate-pulse delay-150" />
                  </div>
                )}
              </Button>
            </div>
            
            {/* Badges */}
            {track.owned && (
              <Badge className="absolute top-2 right-2 bg-primary text-xs sm:text-sm">
                Owned
              </Badge>
            )}
            
            <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
              {formatDuration(track.duration)}
            </Badge>
            
            {/* Report button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-black/40 hover:bg-black/60 text-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setReportModalOpen(true)
              }}
            >
              <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            </Button>
          </div>
        </Link>
        
        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          {/* Title and artist */}
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <Link href={`/nft/${track.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate mb-0.5 sm:mb-1 hover:text-primary transition-colors">
                {track.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {track.artist}
              </p>
            </Link>
            <Button variant="ghost" size="icon" className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            </Button>
          </div>
          
          {/* Price */}
          <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Price</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                {track.price}π
              </span>
            </div>
            
            {/* Edition info - only show if exists */}
            {track.edition && track.totalEditions && (
              <div className="mt-1 sm:mt-2 text-xs text-muted-foreground">
                Edition {track.edition} of {track.totalEditions}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-auto">
            {/* Stream button */}
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col h-auto py-1.5 sm:py-2 px-0.5 sm:px-1 bg-transparent text-xs sm:text-sm"
              onClick={handlePlayClick}
            >
              <Headphones className="w-3 h-3 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
              <span>Stream</span>
            </Button>
            
            {/* Buy/Owned button */}
            {!track.owned ? (
              <Button 
                variant="default" 
                size="sm"
                className="flex flex-col h-auto py-1.5 sm:py-2 px-0.5 sm:px-1 text-xs sm:text-sm"
                onClick={handleBuyClick}
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
                <span>Buy</span>
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                size="sm"
                className="flex flex-col h-auto py-1.5 sm:py-2 px-0.5 sm:px-1 text-xs sm:text-sm"
                disabled
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
                <span>Owned</span>
              </Button>
            )}
            
            {/* Tip button */}
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col h-auto py-1.5 sm:py-2 px-0.5 sm:px-1 bg-transparent text-xs sm:text-sm"
              onClick={handleTipClick}
            >
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
              <span>Tip</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Modals */}
      <PurchaseModal open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen} track={track} />
      <TipModal open={tipModalOpen} onOpenChange={setTipModalOpen} artistName={track.artist} trackTitle={track.title} />
      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        contentType="nft"
        contentId={track.id}
        contentTitle={track.title}
      />
    </>
  )
}
