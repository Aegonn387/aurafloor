"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Send, Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { PiAuth } from "@/lib/pi-auth"
import { useToast } from "@/hooks/use-toast"

interface WalletModalProps {
  currentBalance: number
  children: React.ReactNode
}

export function WalletModal({ currentBalance, children }: WalletModalProps) {
  const [open, setOpen] = useState(false)
  const [addAmount, setAddAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Mock transaction history
  const transactions = [
    { id: "1", type: "deposit", amount: 50, status: "completed", date: "2024-01-15", hash: "0x123...abc" },
    { id: "2", type: "withdrawal", amount: 20, status: "completed", date: "2024-01-14", hash: "0x456...def" },
    { id: "3", type: "purchase", amount: 15, status: "completed", date: "2024-01-13", hash: "0x789...ghi" },
    { id: "4", type: "deposit", amount: 100, status: "pending", date: "2024-01-12", hash: "0xabc...xyz" },
  ]

  const handleAddFunds = async () => {
    const amount = Number.parseFloat(addAmount)

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to add",
        variant: "destructive",
      })
      return
    }

    if (amount < 1) {
      toast({
        title: "Minimum Amount",
        description: "Minimum deposit is 1π",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create Pi payment
      const paymentId = await PiAuth.createPayment({
        amount,
        memo: `Add funds to Aurafloor wallet`,
        metadata: {
          type: "deposit",
          userId: "demo_user",
        },
      })

      toast({
        title: "Payment Initiated",
        description: `Adding ${amount}π to your wallet`,
      })

      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false)
        setAddAmount("")
        toast({
          title: "Funds Added",
          description: `${amount}π has been added to your wallet`,
        })
      }, 2000)
    } catch (error) {
      console.error("[v0] Add funds error:", error)
      toast({
        title: "Payment Failed",
        description: "Could not process your payment. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawAmount)

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      })
      return
    }

    if (amount > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough π to withdraw",
        variant: "destructive",
      })
      return
    }

    if (!withdrawAddress) {
      toast({
        title: "Address Required",
        description: "Please enter a Pi wallet address",
        variant: "destructive",
      })
      return
    }

    // Basic address validation (Pi addresses typically start with G)
    if (!withdrawAddress.startsWith("G") || withdrawAddress.length < 40) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Pi wallet address",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // In production, call backend API to process withdrawal
      console.log("[v0] Processing withdrawal:", { amount, address: withdrawAddress })

      // Simulate withdrawal processing
      setTimeout(() => {
        setIsProcessing(false)
        setWithdrawAmount("")
        setWithdrawAddress("")
        toast({
          title: "Withdrawal Initiated",
          description: `${amount}π will be sent to your wallet within 24 hours`,
        })
      }, 2000)
    } catch (error) {
      console.error("[v0] Withdrawal error:", error)
      toast({
        title: "Withdrawal Failed",
        description: "Could not process your withdrawal. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const quickAmounts = [10, 25, 50, 100]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pi Wallet</DialogTitle>
          <DialogDescription>Manage your Pi funds and transactions</DialogDescription>
        </DialogHeader>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
              <div className="text-4xl font-bold mb-1">{currentBalance.toFixed(1)}π</div>
              <p className="text-xs text-muted-foreground">Connected to Pi Network</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="add-amount">Amount (π)</Label>
              <Input
                id="add-amount"
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                min="1"
                step="0.1"
              />
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button key={amount} variant="outline" size="sm" onClick={() => setAddAmount(amount.toString())}>
                    {amount}π
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You'll receive:</span>
                <span className="font-semibold">{addAmount || "0"}π</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction fee:</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleAddFunds} disabled={isProcessing || !addAmount}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Add Funds
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">Minimum deposit: 1π • Funds are instant</p>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="withdraw-amount">Amount (π)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="1"
                  max={currentBalance}
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">Available: {currentBalance.toFixed(1)}π</p>
              </div>

              <div>
                <Label htmlFor="withdraw-address">Pi Wallet Address</Label>
                <Input
                  id="withdraw-address"
                  type="text"
                  placeholder="G... (Your Pi wallet address)"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Enter your external Pi wallet address</p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">{withdrawAmount || "0"}π</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network fee:</span>
                <span className="font-semibold">~0.01π</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-muted-foreground">You'll receive:</span>
                <span className="font-semibold">
                  {withdrawAmount ? (Number.parseFloat(withdrawAmount) - 0.01).toFixed(2) : "0"}π
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={isProcessing || !withdrawAmount || !withdrawAddress}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Withdraw Funds
                </>
              )}
            </Button>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Withdrawals are processed within 24 hours. Double-check your wallet address before confirming.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "deposit"
                        ? "bg-green-500/10"
                        : tx.type === "withdrawal"
                          ? "bg-blue-500/10"
                          : "bg-amber-500/10"
                    }`}
                  >
                    {tx.type === "deposit" && <ArrowDownRight className="w-5 h-5 text-green-600" />}
                    {tx.type === "withdrawal" && <ArrowUpRight className="w-5 h-5 text-blue-600" />}
                    {tx.type === "purchase" && <DollarSign className="w-5 h-5 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm capitalize">{tx.type}</p>
                      <p className="font-semibold text-sm">
                        {tx.type === "withdrawal" ? "-" : "+"}
                        {tx.amount}π
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                      <div className="flex items-center gap-1">
                        {tx.status === "completed" && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                        {tx.status === "pending" && <Clock className="w-3 h-3 text-amber-600" />}
                        {tx.status === "failed" && <XCircle className="w-3 h-3 text-red-600" />}
                        <span
                          className={`text-xs ${
                            tx.status === "completed"
                              ? "text-green-600"
                              : tx.status === "pending"
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
