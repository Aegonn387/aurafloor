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

export const runtime = 'nodejs';
export default function HomePage() {
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<(typeof mockTracks)[0] | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const user = useStore((state) => state.user)

  useEffect(() => {
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
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="container px-4 py-6 space-y-8">
        {/* Hero Banner */}
        <Card className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border-primary/20 overflow-hidden">
          <CardContent className="p-8 text-center">
            <Badge className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Pi-Powered Marketplace
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">Discover Exclusive Audio NFTs</h1>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-balance">
              Stream, collect, and trade music and podcasts as NFTs. Support artists directly with Pi cryptocurrency.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/marketplace">
                <Button size="lg">
                  Explore Marketplace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {user?.role === "creator" && (
                <Link href="/mint">
                  <Button size="lg" variant="outline">
                    Mint Your NFT
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-accent" />
              <h2 className="text-2xl font-bold">Promoted</h2>
              <Badge variant="secondary" className="ml-2">
                Featured
              </Badge>
            </div>
            {user?.role === "creator" && (
              <Link href="/promote">
                <Button variant="outline" size="sm">
                  Promote Your NFT
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promoted.map((track) => (
              <Card key={track.id} className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-0">
                  <NFTCard track={track} onTip={() => handleTip(track)} />
                </CardContent>
              </Card>
            ))}
          </div>
          {user?.role === "creator" && (
            <Card className="mt-4 bg-muted/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Megaphone className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Want to see your NFT here?</p>
                  <p className="text-xs text-muted-foreground">Promote your content to reach thousands of collectors</p>
                </div>
                <Link href="/promote">
                  <Button size="sm">Start Campaign</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Featured Drops */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent" />
              <h2 className="text-2xl font-bold">Featured Drops</h2>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((track) => (
              <NFTCard key={track.id} track={track} onTip={() => handleTip(track)} />
            ))}
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Trending Now</h2>
            </div>
            <Link href="/search">
              <Button variant="ghost" size="sm">
                Discover More
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.map((track) => (
              <NFTCard key={track.id} track={track} onTip={() => handleTip(track)} />
            ))}
          </div>
        </section>

        {/* Premium CTA */}
        <Card className="bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 border-accent/20">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Upgrade to Premium</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-balance">
              Get ad-free listening, offline downloads, and exclusive features
            </p>
            <Link href="/subscribe">
              <Button size="lg" variant="default">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
      <MiniPlayer />
      <FullPlayer />
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />

      {selectedTrack && (
        <TipModal
          open={tipModalOpen}
          onOpenChange={setTipModalOpen}
          artistName={selectedTrack.artist}
          trackTitle={selectedTrack.title}
        />
      )}
    </div>
  )
}
