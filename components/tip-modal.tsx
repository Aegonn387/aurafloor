"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

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

  const presets = [1, 5, 10, 25]

  const handleTip = async () => {
    const amount = selectedPreset || Number.parseFloat(customAmount)

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid tip amount",
        variant: "destructive",
      })
      return
    }

    // Check if Pi SDK is available
    if (!window.Pi) {
      toast({
        title: "Pi SDK not loaded",
        description: "Please refresh the page and try again",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      // Note: User should already be authenticated via AuthDialog with 'payments' scope
      // We'll proceed directly to createPayment
      
      const paymentData = {
        amount: amount,
        memo: `Tip for ${trackTitle} by ${artistName}`,
        metadata: { 
          type: "tip", 
          artist: artistName, 
          track: trackTitle,
          timestamp: new Date().toISOString()
        }
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("Payment ready for approval:", paymentId);
          
          // Call backend to approve the payment
          const response = await fetch('/.netlify/functions/approve-payment.cjs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
          
          if (!response.ok) {
            throw new Error('Payment approval failed');
          }
          
          console.log("Payment approved on server");
        },
        
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("Payment ready for completion:", paymentId, txid);
          
          // Call backend to complete the payment
          const response = await fetch('/.netlify/functions/complete-payment.cjs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          });
          
          if (!response.ok) {
            throw new Error('Payment completion failed');
          }
          
          console.log("Payment completed on server");
        },
        
        onCancel: (paymentId: string) => {
          console.log("Payment cancelled:", paymentId);
          toast({
            title: "Payment cancelled",
            description: "The payment was cancelled",
          });
        },
        
        onError: (error: Error, paymentId: string) => {
          console.error("Payment error:", error, paymentId);
          toast({
            title: "Payment failed",
            description: error.message || "An error occurred during payment",
            variant: "destructive",
          });
        }
      };

      // Create the payment using Pi SDK
      const payment = await window.Pi.createPayment(paymentData, callbacks);
      console.log("Payment created:", payment);

      toast({
        title: "Tip sent!",
        description: `You tipped ${amount}π to ${artistName}`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unable to process tip. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Tip {artistName}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Support the artist for {trackTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Preset buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((amount) => (
              <Button
                key={amount}
                variant={selectedPreset === amount ? "default" : "outline"}
                onClick={() => {
                  setSelectedPreset(amount)
                  setCustomAmount("")
                }}
                className="h-12 sm:h-14 flex flex-col min-h-[48px]"
              >
                <span className="text-base sm:text-lg font-bold">{amount}π</span>
              </Button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or custom amount</span>
            </div>
          </div>

          {/* Custom amount input */}
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Enter custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedPreset(null)
              }}
              min="0.01"
              step="0.01"
              className="text-base sm:text-sm h-11 sm:h-10"
            />
          </div>

          {/* Submit button */}
          <Button
            onClick={handleTip}
            disabled={loading}
            className="w-full text-sm sm:text-base min-h-[44px]"
            size="lg"
          >
            {loading ? "Processing..." : `Send Tip`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
