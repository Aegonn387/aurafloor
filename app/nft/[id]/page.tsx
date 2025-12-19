"use client"

import { use } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { MiniPlayer } from "@/components/mini-player"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { mockTracks } from "@/lib/mock-data"
import { useStore } from "@/lib/store"
import { Pause, Heart, Share2, ShoppingCart, Gift, TrendingUp, Headphones, Flag } from "lucide-react"
import { useState } from "react"
import { TipModal } from "@/components/tip-modal"
import { PurchaseModal } from "@/components/purchase-modal"
import { ReportModal } from "@/components/report-modal"

export default function NFTDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const track = mockTracks.find((t) => t.id === id)
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying } = useStore()

  if (!track) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">NFT not found</p>
      </div>
    )
  }

  const isCurrentTrack = currentTrack?.id === track.id

  const handlePlayClick = () => {
    if (isCurrentTrack) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentTrack(track)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="relative">
            <img
              src={track.coverUrl || "/placeholder.svg"}
              alt={track.title}
              className="w-full aspect-square rounded-2xl shadow-xl object-cover"
            />
            {track.owned && <Badge className="absolute top-4 right-4 bg-primary">Owned</Badge>}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 text-white"
              onClick={() => setReportModalOpen(true)}
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3">
                {track.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{track.title}</h1>
              <p className="text-xl text-muted-foreground">{track.artist}</p>
            </div>

            <div className="space-y-3">
              <Button size="lg" className="w-full" onClick={handlePlayClick}>
                {isCurrentTrack && isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause Stream
                  </>
                ) : (
                  <>
                    <Headphones className="w-5 h-5 mr-2" />
                    Stream Now
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg">
                  <Heart className="w-5 h-5 mr-2" />
                  Like
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-2xl font-bold text-primary">{track.price}π</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Creator Royalty</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {!track.owned ? (
                <Button size="lg" className="w-full" variant="default" onClick={() => setPurchaseModalOpen(true)}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy NFT for {track.price}π
                </Button>
              ) : (
                <Button size="lg" className="w-full" variant="secondary" disabled>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Already Owned
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setTipModalOpen(true)}
              >
                <Gift className="w-5 h-5 mr-2" />
                Tip Creator
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed">{track.description || "No description available."}</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">{track.artist[0]}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{track.artist}</h3>
                  <p className="text-sm text-muted-foreground">Creator</p>
                </div>
                <Button variant="outline">Follow</Button>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">NFTs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">1.2k</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">340π</div>
                  <div className="text-sm text-muted-foreground">Volume</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">More from {track.artist}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mockTracks
                .filter((t) => t.artist === track.artist && t.id !== track.id)
                .slice(0, 3)
                .map((relatedTrack) => (
                  <a key={relatedTrack.id} href={`/nft/${relatedTrack.id}`} className="group">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                      <img
                        src={relatedTrack.coverUrl || "/placeholder.svg"}
                        alt={relatedTrack.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="font-medium truncate">{relatedTrack.title}</p>
                    <p className="text-sm text-primary">{relatedTrack.price}π</p>
                  </a>
                ))}
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
      <MiniPlayer />

      <TipModal open={tipModalOpen} onOpenChange={setTipModalOpen} artistName={track.artist} trackTitle={track.title} />

      <PurchaseModal open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen} track={track} />

      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        contentType="nft"
        contentId={track.id}
        contentTitle={track.title}
      />
    </div>
  )
}
