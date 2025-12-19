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
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <Link href={`/nft/${track.id}`} className="block">
          <div className="relative aspect-square">
            <img src={track.coverUrl || "/placeholder.svg"} alt={track.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="icon"
                className="w-14 h-14 rounded-full shadow-lg bg-primary/90 hover:bg-primary hover:scale-110 transition-all"
                onClick={handlePlayClick}
              >
                <Play className={cn("w-6 h-6", isCurrentTrack && isPlaying && "hidden")} />
                {isCurrentTrack && isPlaying && (
                  <div className="flex gap-1">
                    <div className="w-1 h-5 bg-primary-foreground animate-pulse" />
                    <div className="w-1 h-5 bg-primary-foreground animate-pulse delay-75" />
                    <div className="w-1 h-5 bg-primary-foreground animate-pulse delay-150" />
                  </div>
                )}
              </Button>
            </div>
            {track.owned && <Badge className="absolute top-2 right-2 bg-primary">Owned</Badge>}
            <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
              {formatDuration(track.duration)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setReportModalOpen(true)
              }}
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </Link>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <Link href={`/nft/${track.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold truncate mb-1 hover:text-primary transition-colors">{track.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
            </Link>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Heart className="w-4 h-4" />
            </Button>
          </div>

          <div className="mb-3 pb-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-xl font-bold text-primary">{track.price}π</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col h-auto py-2 px-1 bg-transparent"
              onClick={handlePlayClick}
            >
              <Headphones className="w-4 h-4 mb-1" />
              <span className="text-xs">Stream</span>
            </Button>

            {!track.owned ? (
              <Button variant="default" size="sm" className="flex flex-col h-auto py-2 px-1" onClick={handleBuyClick}>
                <ShoppingCart className="w-4 h-4 mb-1" />
                <span className="text-xs">Buy</span>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="flex flex-col h-auto py-2 px-1" disabled>
                <ShoppingCart className="w-4 h-4 mb-1" />
                <span className="text-xs">Owned</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="flex flex-col h-auto py-2 px-1 bg-transparent"
              onClick={handleTipClick}
            >
              <Gift className="w-4 h-4 mb-1" />
              <span className="text-xs">Tip</span>
            </Button>
          </div>
        </CardContent>
      </Card>

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
