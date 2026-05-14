"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { usePiPayment } from "@/hooks/usePiPayment"
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
  const { createPayment } = usePiPayment()

  const platformFee = track.price * 0.1
  const creatorEarnings = track.price * 0.9
  const total = track.price || 0

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const paymentId = await createPayment({
        amount: total,
        memo: `Purchase ${track.title}`,
        metadata: {
          type: "purchase",
          nftId: track.id,
          artist: track.artist,
          track: track.title,
          creatorEarnings,
          platformFee,
        },
      })
      if (!paymentId) throw new Error("Payment failed")
      setSuccess(true)
      setTimeout(() => {
        toast({ title: "NFT Purchased!", description: `You now own ${track.title}` })
        onOpenChange(false)
        setSuccess(false)
      }, 2000)
    } catch (error: any) {
      toast({ title: "Purchase failed", description: error.message || "Try again", variant: "destructive" })
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Purchase Successful!</h3>
            <p className="text-muted-foreground">You now own {track.title}</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Purchase Audio NFT</DialogTitle>
              <DialogDescription>Complete your purchase with Pi Network</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-3">
                <img src={track.coverUrl || "/placeholder.svg"} alt={track.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{track.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">NFT Price</span><span className="font-medium">{track.price}π</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Platform Fee (10%)</span><span className="font-medium">{platformFee.toFixed(2)}π</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Creator Earnings (90%)</span><span className="font-medium text-green-600">{creatorEarnings.toFixed(2)}π</span></div>
                {track.resaleFee && (<div className="flex justify-between text-sm"><span className="text-muted-foreground">Resale Royalty</span><span className="font-medium">{track.resaleFee}%</span></div>)}
                <Separator />
                <div className="flex justify-between"><span className="font-semibold">Total</span><span className="text-xl font-bold text-primary">{total.toFixed(2)}π</span></div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" />What you get:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Unlimited HD streaming</li><li>• Downloadable lossless file</li><li>• Resale rights</li><li>• Support the artist</li>
                </ul>
              </div>
            </div>
            <Button onClick={handlePurchase} disabled={loading} className="w-full" size="lg">
              {loading ? "Processing..." : <><ShoppingCart className="w-4 h-4 mr-2" /> Confirm Purchase • {total.toFixed(2)}π</>}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
