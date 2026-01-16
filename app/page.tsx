"use client"
import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { MiniPlayer } from "@/components/mini-player"
import { FullPlayer } from "@/components/full-player"
import { NFTCard } from "@/components/nft-card"
import { TipModal } from "@/components/tip-modal"
import { mockTracks } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Star, Sparkles, ArrowRight, Megaphone } from "lucide-react"
import { AuthDialog } from "@/components/auth-dialog"
import { useStore } from "@/lib/store"
import Link from "next/link"
import HorizontalCarousel from "@/components/HorizontalCarousel"

export const runtime = 'nodejs';
export default function HomePage() {
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<(typeof mockTracks)[0] | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)

  // Initialize Pi SDK and check if user needs auth
  useEffect(() => {
    const checkPiSDK = () => {
      if (window.Pi) {
        window.Pi.init({ version: "2.0", sandbox: true });
        console.log("Pi SDK initialized in page");
        // Check for incomplete payments
        const onIncompletePaymentFound = (payment: any) => {
          console.log("Incomplete payment found:", payment);
          // Handle incomplete payment recovery here
        };
      } else {
        // Retry after a delay if Pi SDK not loaded yet
        setTimeout(checkPiSDK, 500);
      }
    };
    checkPiSDK();
    if (!user) {
      const timer = setTimeout(() => setShowAuth(true), 500)
      return () => clearTimeout(timer)
    }
  }, [user])

  const handleTip = (track: (typeof mockTracks)[0]) => {
    setSelectedTrack(track)
    setTipModalOpen(true)
  }

  const promoted = mockTracks.slice(0, 2)
  const featured = mockTracks.slice(2, 5)
  const trending = mockTracks.slice(3, 6)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-32">
      <Header />
      <main className="container px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8">
        {/* Hero Banner with Enhanced Carousel */}
        <Card className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border-primary/20 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <Badge className="mb-4 md:mb-6 px-3 py-1 text-xs md:text-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Pi-Powered Marketplace
            </Badge>
            {/* Enhanced Horizontal Carousel with 10+ scrollable items */}
            <HorizontalCarousel />
            {/* BUTTONS PRESERVED - Keep these exactly as they were */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center flex-wrap mt-6 md:mt-10 pt-4 md:pt-6 border-t border-gray-800/50">
              <Link href="/marketplace" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm md:text-base"
                >
                  Explore Marketplace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {user?.role === "creator" && (
                <Link href="/mint" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 text-sm md:text-base"
                  >
                    Mint Your NFT
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Promoted Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold">Promoted</h2>
              <Badge variant="secondary" className="ml-2 text-xs">
                Featured
              </Badge>
            </div>
            {user?.role === "creator" && (
              <Link href="/promote" className="self-start sm:self-auto">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  Promote Your NFT
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {promoted.map((track) => (
              <Card
                key={track.id}
                className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-colors"
              >
                <CardContent className="p-0">
                  <NFTCard track={track} onTip={() => handleTip(track)} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold">Featured</h2>
              <Badge variant="secondary" className="ml-2 text-xs">
                New
              </Badge>
            </div>
            <Link href="/marketplace" className="self-start sm:self-auto">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                View All
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {featured.map((track) => (
              <Card
                key={track.id}
                className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-colors"
              >
                <CardContent className="p-0">
                  <NFTCard track={track} onTip={() => handleTip(track)} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold">Trending</h2>
              <Badge variant="secondary" className="ml-2 text-xs">
                Hot
              </Badge>
            </div>
            <Link href="/marketplace" className="self-start sm:self-auto">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                View All
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {trending.map((track) => (
              <Card
                key={track.id}
                className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-colors"
              >
                <CardContent className="p-0">
                  <NFTCard track={track} onTip={() => handleTip(track)} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Modals */}
      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        // @ts-ignore
        track={selectedTrack}
      />
      <AuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
      />
      <MobileNav />
      <MiniPlayer />
      <FullPlayer />
    </div>
  )
}
