"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Music2, Disc3, CheckCircle2 } from "lucide-react"

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"connect" | "role">("connect")
  const setUser = useStore((state) => state.setUser)
  const [piInitialized, setPiInitialized] = useState(false)

  // Initialize Pi SDK
  useEffect(() => {
    const initializePi = () => {
      if (typeof window !== 'undefined' && window.Pi) {
        setPiInitialized(true)
      } else {
        // Load Pi SDK dynamically
        const script = document.createElement('script')
        script.src = 'https://sdk.minepi.com/pi-sdk.js'
        script.async = true
        script.onload = () => {
          setPiInitialized(true)
          console.log('Pi SDK loaded')
        }
        script.onerror = () => {
          console.error('Failed to load Pi SDK')
        }
        document.head.appendChild(script)
      }
    }

    if (open) {
      initializePi()
    }
  }, [open])

  const verifyPiUser = async (accessToken: string) => {
    // For development: Check if we're in localhost
    const isLocalhost = window.location.hostname === 'localhost'
    const baseUrl = isLocalhost ? 'http://localhost:8888' : ''
    // REMOVED .cjs EXTENSION - Netlify functions don't use file extensions in routes
    const functionUrl = `${baseUrl}/.netlify/functions/verify-pi-user`

    console.log('[DEBUG] Calling Netlify function:', functionUrl)

    try {
      const verificationResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ accessToken })
      })

      console.log('[DEBUG] Response status:', verificationResponse.status)

      // Get response as text first
      const responseText = await verificationResponse.text()
      console.log('[DEBUG] Raw response:', responseText.substring(0, 200))

      if (!verificationResponse.ok) {
        console.error('[DEBUG] Response not OK:', responseText)
        throw new Error(`Server error: ${verificationResponse.status}`)
      }

      // Try to parse as JSON
      try {
        return JSON.parse(responseText)
      } catch (parseError) {
        console.error('[DEBUG] JSON parse failed:', parseError, 'Text was:', responseText)
        throw new Error('Invalid JSON response from server')
      }
    } catch (error) {
      console.error('[DEBUG] Fetch error:', error)
      throw error
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      if (!window.Pi || !piInitialized) {
        throw new Error("Pi SDK not loaded")
      }

      const scopes = ['username', 'payments']
      const onIncompletePaymentFound = (payment: any) => {
        console.log("Incomplete payment found during auth:", payment)
      }

      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound)
      console.log("Pi authentication successful:", authResult.user)

      // Send the accessToken to your backend for verification
      const verifiedData = await verifyPiUser(authResult.accessToken)
      console.log("Pi user verified:", verifiedData.user)

      setStep("role")
    } catch (error: any) {
      console.error("Authentication failed:", error.message || error)
      alert(`Authentication failed: ${error.message || 'Please try again'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelect = async (role: "creator" | "collector") => {
    setLoading(true)
    try {
      if (!window.Pi || !piInitialized) {
        throw new Error("Pi SDK not loaded")
      }

      const scopes = ['username', 'payments']
      const onIncompletePaymentFound = (payment: any) => {
        console.log("Incomplete payment found during auth:", payment)
      }

      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound)
      console.log("Pi authentication successful:", authResult.user)

      // Send the accessToken to your backend for verification
      const verifiedData = await verifyPiUser(authResult.accessToken)
      console.log("Pi user verified:", verifiedData.user)

      setUser({
        uid: verifiedData.user.uid,
        username: verifiedData.user.username,
        accessToken: authResult.accessToken,
        role: role
      })
      onOpenChange(false)
      setTimeout(() => setStep("connect"), 300)
    } catch (error: any) {
      console.error("Role selection failed:", error.message || error)
      alert(`Role selection failed: ${error.message || 'Please try again'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
        {step === "connect" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl text-center text-balance">
                Welcome to Aurafloor
              </DialogTitle>
              <DialogDescription className="text-center pt-1 sm:pt-2 text-balance text-sm sm:text-base">
                Connect with Pi Network to access the audio NFT marketplace
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 sm:gap-4 py-4 sm:py-6">
              <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-lg p-4 sm:p-6 text-center border border-primary/20">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Music2 className="w-5 h-5 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground text-balance">
                  Mint, collect, and trade exclusive audio NFTs using Pi cryptocurrency
                </p>
              </div>

              {/* Browser detection info */}
              <div className="bg-muted rounded-lg p-2.5 sm:p-3 text-xs">
                <p className="text-muted-foreground text-center">
                  {piInitialized ? (
                    <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      Pi Browser Detected
                    </span>
                  ) : (
                    <span>
                      Loading Pi SDK... {typeof window !== 'undefined' && window.Pi ? "Ready" : "Please use Pi Browser"}
                    </span>
                  )}
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={loading || !piInitialized}
                size="lg"
                className="w-full text-sm sm:text-base min-h-[44px]"
              >
                {loading ? "Connecting..." : piInitialized ? "Connect Pi Wallet" : "Initializing..."}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl text-center text-balance">
                Choose Your Role
              </DialogTitle>
              <DialogDescription className="text-center pt-1 sm:pt-2 text-balance text-sm sm:text-base">
                Select how you want to experience Aurafloor
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 py-4 sm:py-6">
              <button
                onClick={() => handleRoleSelect("creator")}
                disabled={loading || !piInitialized}
                className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-4 sm:p-6 text-left hover:bg-primary/5 min-h-[100px] sm:min-h-0"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Disc3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Creator</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground text-balance">
                      Mint your music and podcasts as NFTs, earn royalties, and receive tips
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("collector")}
                disabled={loading || !piInitialized}
                className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-accent transition-all p-4 sm:p-6 text-left hover:bg-accent/5 min-h-[100px] sm:min-h-0"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                    <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-1">Collector</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground text-balance">
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
