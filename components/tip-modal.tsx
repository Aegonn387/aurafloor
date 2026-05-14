"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/lib/store"
import { usePiPayment } from "@/hooks/usePiPayment"

interface TipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artistName: string
  trackTitle: string
}

export function TipModal({ open, onOpenChange, artistName, trackTitle }: TipModalProps) {
  const [loading, setLoading] = useState(false)
  const [customAmount, setCustomAmount] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const { toast } = useToast()
  const user = useStore((state) => state.user)
  const { createPayment } = usePiPayment()
  const presets = [1, 5, 10, 25]

  const handleTip = async () => {
    if (!user) { toast({ title: "Authentication required", description: "Please sign in to tip", variant: "destructive" }); return }
    const amount = selectedPreset || parseFloat(customAmount)
    if (!amount || amount <= 0) { toast({ title: "Invalid amount", description: "Enter a valid tip amount", variant: "destructive" }); return }
    if (!window.Pi) { toast({ title: "Pi SDK not loaded", description: "Refresh and try again", variant: "destructive" }); return }
    setLoading(true)
    try {
      const paymentId = await createPayment({
        amount,
        memo: `Tip for ${trackTitle} by ${artistName}`,
        metadata: { type: "tip", artist: artistName, track: trackTitle, timestamp: new Date().toISOString() }
      })
      if (!paymentId) throw new Error("Tip failed")
      toast({ title: "Tip sent!", description: `You tipped ${amount}π to ${artistName}` })
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: "Payment failed", description: error.message || "Try again", variant: "destructive" })
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Tip {artistName}</DialogTitle>
          <DialogDescription>Support the artist for {trackTitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-2">
            {presets.map((amount) => (
              <Button key={amount} variant={selectedPreset === amount ? "default" : "outline"}
                onClick={() => { setSelectedPreset(amount); setCustomAmount("") }}
                className="h-12 flex flex-col">
                <span className="text-lg font-bold">{amount}π</span>
              </Button>
            ))}
          </div>
          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or custom amount</span></div>
          </div>
          <Input type="number" placeholder="Enter custom amount" value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null) }}
            min="0.01" step="0.01" className="h-11" />
          <Button onClick={handleTip} disabled={loading} className="w-full" size="lg">
            {loading ? "Processing..." : "Send Tip"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
