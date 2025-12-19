"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PiAuth } from "@/lib/pi-auth"
import { useStore } from "@/lib/store"
import { Music2, Disc3, CheckCircle2 } from "lucide-react"

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"connect" | "role">("connect")
  const setUser = useStore((state) => state.setUser)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const user = await PiAuth.authenticate()
      setStep("role")
    } catch (error) {
      console.error("Authentication failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelect = async (role: "creator" | "collector") => {
    setLoading(true)
    try {
      const user = await PiAuth.authenticate()
      setUser({ ...user, role })
      onOpenChange(false)
      // Reset step for next time
      setTimeout(() => setStep("connect"), 300)
    } catch (error) {
      console.error("Role selection failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "connect" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-balance">Welcome to Aurafloor</DialogTitle>
              <DialogDescription className="text-center pt-2 text-balance">
                Connect with Pi Network to access the audio NFT marketplace
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-6">
              <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-lg p-6 text-center border border-primary/20">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-balance">
                  Mint, collect, and trade exclusive audio NFTs using Pi cryptocurrency
                </p>
              </div>

              {/* Browser detection info */}
              <div className="bg-muted rounded-lg p-3 text-xs">
                <p className="text-muted-foreground text-center">
                  {PiAuth.isAvailable() ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Pi Browser Detected
                    </span>
                  ) : (
                    "Demo mode - Production requires Pi Browser"
                  )}
                </p>
              </div>

              <Button onClick={handleConnect} disabled={loading} size="lg" className="w-full">
                {loading ? "Connecting..." : "Connect Pi Wallet"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center text-balance">Choose Your Role</DialogTitle>
              <DialogDescription className="text-center pt-2 text-balance">
                Select how you want to experience Aurafloor
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-6">
              <button
                onClick={() => handleRoleSelect("creator")}
                disabled={loading}
                className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left hover:bg-primary/5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Disc3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Creator</h3>
                    <p className="text-sm text-muted-foreground text-balance">
                      Mint your music and podcasts as NFTs, earn royalties, and receive tips
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleRoleSelect("collector")}
                disabled={loading}
                className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-accent transition-all p-6 text-left hover:bg-accent/5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                    <Music2 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Collector</h3>
                    <p className="text-sm text-muted-foreground text-balance">
                      Discover exclusive audio content, build your NFT library, and support artists
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
