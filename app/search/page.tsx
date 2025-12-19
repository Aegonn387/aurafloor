"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { MiniPlayer } from "@/components/mini-player"
import { NFTCard } from "@/components/nft-card"
import { TipModal } from "@/components/tip-modal"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockTracks } from "@/lib/mock-data"
import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<(typeof mockTracks)[0] | null>(null)

  const categories = ["All", "Electronic", "Hip Hop", "Acoustic", "Podcast", "Jazz", "EDM"]

  const filteredTracks = mockTracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || selectedCategory === "All" || track.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleTip = (track: (typeof mockTracks)[0]) => {
    setSelectedTrack(track)
    setTipModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-6 space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Discover</h1>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks, artists, podcasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={
                  selectedCategory === category || (!selectedCategory && category === "All") ? "default" : "outline"
                }
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(category === "All" ? null : category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredTracks.length} {filteredTracks.length === 1 ? "result" : "results"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map((track) => (
              <NFTCard key={track.id} track={track} onTip={() => handleTip(track)} />
            ))}
          </div>
        </div>
      </main>

      <MobileNav />
      <MiniPlayer />

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
