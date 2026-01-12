"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { PiAuth } from "@/lib/pi-auth"
import { useToast } from "@/hooks/use-toast"
import type { AudioTrack } from "@/lib/store"
import { ShoppingCart, CheckCircle2, Info } from "lucide-react"

interface PurchaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  track: AudioTrack
}

export function PurchaseModal({ open, onOpenChange, track }: PurchaseModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const platformFee = track.price * 0.1
  const creatorEarnings = track.price * 0.9
  const total = track.price

  const handlePurchase = async () => {
    setLoading(true)
    try {
      await PiAuth.createPayment({
        amount: total,
        memo: `Purchase ${track.title}`,
        metadata: {
          type: "purchase",
          nftId: track.id,
          artist: track.artist,
          track: track.title,
          creatorEarnings: creatorEarnings,
          platformFee: platformFee,
        },
      })

      setSuccess(true)
      setTimeout(() => {
        toast({
          title: "NFT Purchased!",
          description: `You now own ${track.title}`,
        })
        onOpenChange(false)
        setSuccess(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: "Unable to complete purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md mx-auto max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
        {!success ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">Purchase Audio NFT</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Complete your purchase with Pi Network
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              {/* Track Info */}
              <div className="flex gap-3 sm:gap-4">
                <img
                  src={track.coverUrl || "/placeholder.svg"}
                  alt={track.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg truncate">{track.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {track.category && (
                      <Badge variant="secondary" className="text-xs">
                        {track.category}
                      </Badge>
                    )}
                    {track.edition && track.totalEditions && (
                      <Badge variant="outline" className="text-xs">
                        #{track.edition}/{track.totalEditions}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NFT Price</span>
                  <span className="font-medium">{track.price}π</span>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 sm:p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        • Creator receives <span className="font-medium text-foreground">90%</span> (
                        {creatorEarnings.toFixed(2)}π)
                      </p>
                      <p>
                        • Platform fee <span className="font-medium text-foreground">10%</span> (
                        {platformFee.toFixed(2)}π)
                      </p>
                      {track.resaleFee && (
                        <p>
                          • Resale royalty:{" "}
                          <span className="font-medium text-primary">{track.resaleFee}% to creator</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm sm:text-base">Total Amount</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">{total.toFixed(2)}π</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  What you get:
                </h4>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Unlimited HD streaming access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Downloadable lossless audio file
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Resale rights on secondary market
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Support artist with {((creatorEarnings / track.price) * 100).toFixed(0)}% of sale
                  </li>
                </ul>
              </div>
            </div>

            {/* Purchase Button */}
            <Button 
              onClick={handlePurchase} 
              disabled={loading} 
              className="w-full text-sm sm:text-base min-h-[44px]"
              size="lg"
            >
              {loading ? (
                "Processing Payment..."
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Confirm Purchase • {total.toFixed(2)}π
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="py-6 sm:py-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Purchase Successful!</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-1">You now own {track.title}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Start streaming in HD quality</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
