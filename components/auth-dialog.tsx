"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Music2, Disc3, CheckCircle2, AlertCircle } from "lucide-react";
import { PiAuth } from "@/lib/pi-auth";

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"connect" | "role">("connect");
  const setUser = useStore((state) => state.setUser);
  const [piInitialized, setPiInitialized] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [storedAuth, setStoredAuth] = useState<{ accessToken: string; user: any } | null>(null);

  useEffect(() => {
    if (!open) return;

    // Check if we are inside Pi Browser – DO NOT manually load the SDK script
    const checkPiBrowser = async () => {
      setSdkError(null);

      // Pi SDK is injected by the browser, never load it manually
      if (typeof window === "undefined") return;

      if (!window.Pi) {
        setSdkError("Please open this app in Pi Browser to authenticate");
        setPiInitialized(false);
        return;
      }

      // Initialize the SDK (sandbox: false for Testnet)
      const initialized = PiAuth.initialize(false); // false = Testnet
      setPiInitialized(initialized);
      if (!initialized) {
        setSdkError("Failed to initialize Pi SDK");
      }
    };

    checkPiBrowser();
  }, [open]);

  const verifyPiUser = async (accessToken: string) => {
    // Adjust base URL for local vs production
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const baseUrl = isLocalhost ? "http://localhost:8888" : "";
    const functionUrl = `${baseUrl}/.netlify/functions/verify-pi-user`;

    console.log("[Verify] Calling:", functionUrl);
    try {
      const verificationResponse = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      console.log("[Verify] Status:", verificationResponse.status);
      const responseText = await verificationResponse.text();
      console.log("[Verify] Response:", responseText.substring(0, 200));

      if (!verificationResponse.ok) {
        console.error("[Verify] Error response:", responseText);
        throw new Error(`Server error: ${verificationResponse.status}`);
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("[Verify] JSON parse failed:", parseError);
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      console.error("[Verify] Fetch error:", error);
      throw error;
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setSdkError(null);

    try {
      if (!PiAuth.isAvailable()) {
        throw new Error("Pi SDK not available. Please use Pi Browser.");
      }

      if (!piInitialized) {
        throw new Error("Pi SDK not initialized yet. Please wait.");
      }

      console.log("[Auth] Starting Pi authentication...");
      const authResult = await PiAuth.authenticate();
      console.log("[Auth] Success:", authResult);

      // Verify with backend
      const verifiedData = await verifyPiUser(authResult.accessToken);
      console.log("[Auth] User verified:", verifiedData.user);

      // Store auth data for role selection (avoid re-authenticating)
      setStoredAuth({
        accessToken: authResult.accessToken,
        user: verifiedData.user,
      });

      setStep("role");
    } catch (error: any) {
      console.error("[Auth] Failed:", error);
      const errorMessage = error.message || error.toString();
      setSdkError(errorMessage);
      alert(`Authentication failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: "creator" | "collector") => {
    setLoading(true);
    setSdkError(null);

    try {
      if (!storedAuth) {
        throw new Error("Please connect your wallet first");
      }

      // Use stored authentication data – no second Pi.authenticate() call
      setUser({
        uid: storedAuth.user.uid,
        username: storedAuth.user.username,
        accessToken: storedAuth.accessToken,
        role: role,
      });

      // Clear stored auth and close dialog
      setStoredAuth(null);
      onOpenChange(false);
      setTimeout(() => setStep("connect"), 300);
    } catch (error: any) {
      console.error("[Role] Failed:", error);
      const errorMessage = error.message || error.toString();
      setSdkError(errorMessage);
      alert(`Role selection failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

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

              <div
                className={`rounded-lg p-2.5 sm:p-3 text-xs ${
                  sdkError ? "bg-destructive/10 border border-destructive/20" : "bg-muted"
                }`}
              >
                <p className={`text-center ${sdkError ? "text-destructive" : "text-muted-foreground"}`}>
                  {sdkError ? (
                    <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {sdkError}
                    </span>
                  ) : piInitialized ? (
                    <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      Pi SDK Ready
                    </span>
                  ) : (
                    <span>Checking Pi Browser...</span>
                  )}
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={loading || !piInitialized || !!sdkError}
                size="lg"
                className="w-full text-sm sm:text-base min-h-[44px]"
              >
                {loading ? "Connecting..." : piInitialized ? "Connect Pi Wallet" : "Waiting for Pi Browser..."}
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
                disabled={loading || !storedAuth}
                className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-4 sm:p-6 text-left hover:bg-primary/5 min-h-[100px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={loading || !storedAuth}
                className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-accent transition-all p-4 sm:p-6 text-left hover:bg-accent/5 min-h-[100px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
