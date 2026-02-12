"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gift, Send, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artistName: string
  trackTitle: string
}

const TIP_AMOUNTS = [1, 5, 10, 20, 50]

export function TipModal({ open, onOpenChange, artistName, trackTitle }: TipModalProps) {
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [piSDKLoaded, setPiSDKLoaded] = useState(false)

  useEffect(() => {
    // Check if Pi SDK is loaded
    if (typeof window !== 'undefined' && window.Pi) {
      setPiSDKLoaded(true)
    }
  }, [])

  const handleTip = async () => {
    if (!amount && !customAmount) return
    
    const tipAmount = parseFloat(customAmount || amount)
    if (isNaN(tipAmount) || tipAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!piSDKLoaded || !window.Pi) {
        throw new Error("Pi Network SDK not loaded. Please ensure you're accessing this from the Pi Browser.")
      }

      // Initialize Pi SDK payment
      const payment = await window.Pi.createPayment({
        amount: tipAmount,
        memo: `Tip for "${trackTitle}" by ${artistName}${message ? ` - ${message}` : ''}`,
        metadata: {
          type: 'artist_tip',
          artistName,
          trackTitle,
          message,
          timestamp: new Date().toISOString()
        }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('Payment ready for approval:', paymentId)
          
          // Call your backend to approve the payment
          const response = await fetch('/api/pi/approve-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId,
              artistName,
              trackTitle,
              amount: tipAmount,
              message
            })
          })

          if (!response.ok) {
            throw new Error('Payment approval failed')
          }

          return response.json()
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('Payment ready for completion:', paymentId, txid)
          
          // Call your backend to complete the payment
          const response = await fetch('/api/pi/complete-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId,
              txid,
              artistName,
              trackTitle,
              amount: tipAmount,
              message
            })
          })

          if (!response.ok) {
            throw new Error('Payment completion failed')
          }

          return response.json()
        },
        onCancel: (paymentId: string) => {
          console.log('Payment cancelled:', paymentId)
          setError('Payment was cancelled')
          setIsLoading(false)
        },
        onError: (error: Error, payment: any) => {
          console.error('Payment error:', error, payment)
          setError(error.message || 'Payment failed')
          setIsLoading(false)
        }
      })

      // Payment successful
      console.log('Payment completed:', payment)

      // Reset form
      setAmount("")
      setCustomAmount("")
      setMessage("")
      onOpenChange(false)

      // Show success message

    } catch (error: any) {
      console.error("Tip failed:", error)
      setError(error.message || "Tip failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString())
    setCustomAmount("")
    setError(null)
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    if (value) setAmount("")
    setError(null)
  }

  const totalAmount = customAmount || amount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Support {artistName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!piSDKLoaded && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pi Network SDK not detected. Please open this app in the Pi Browser to send tips.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tip {artistName} for creating &quot;{trackTitle}&quot;
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tip Amount (p)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TIP_AMOUNTS.map((tip) => (
                    <Button
                      key={tip}
                      type="button"
                      variant={amount === tip.toString() ? "default" : "outline"}
                      className="h-10"
                      onClick={() => handleAmountSelect(tip)}
                      disabled={!piSDKLoaded}
                    >
                      {tip}p
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customAmount">Custom Amount</Label>
                <div className="relative">
                  <Input
                    id="customAmount"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-8"
                    disabled={!piSDKLoaded}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    p
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Input
                  id="message"
                  placeholder="Add a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!piSDKLoaded}
                />
              </div>

              {totalAmount && (
                <div className="rounded-lg bg-primary/10 p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-lg font-bold">{totalAmount}p</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                onClick={handleTip}
                disabled={!totalAmount || isLoading || !piSDKLoaded}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Tip with Pi
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                100% of your tip goes directly to the artist. No platform fees.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
