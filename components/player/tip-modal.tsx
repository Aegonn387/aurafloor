"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gift, Send, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePiPayment } from "@/hooks/usePiPayment"

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

  const { createPayment, loading: paymentLoading, error: paymentError } = usePiPayment()

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
      const paymentId = await createPayment({
        amount: tipAmount,
        memo: `Tip for "${trackTitle}" by ${artistName}${message ? ` - ${message}` : ''}`,
        metadata: {
          type: 'artist_tip',
          artistName,
          trackTitle,
          message,
          timestamp: new Date().toISOString()
        }
      })

      if (!paymentId) {
        throw new Error(paymentError || 'Payment failed or was cancelled')
      }

      // Reset form
      setAmount("")
      setCustomAmount("")
      setMessage("")
      onOpenChange(false)

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
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tip {artistName} for creating "{trackTitle}"
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
                disabled={!totalAmount || isLoading || paymentLoading}
              >
                {isLoading || paymentLoading ? (
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