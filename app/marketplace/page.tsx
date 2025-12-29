"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { MiniPlayer } from "@/components/mini-player"
import { FullPlayer } from "@/components/full-player"
import { NFTCard } from "@/components/nft-card"
import { TipModal } from "@/components/tip-modal"
import { mockTracks } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, SlidersHorizontal } from "lucide-react"

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<(typeof mockTracks)[0] | null>(null)

  const handleTip = (track: (typeof mockTracks)[0]) => {
    setSelectedTrack(track)
    setTipModalOpen(true)
  }

  // Filter tracks based on search and filters
  const filteredTracks = mockTracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || track.category === categoryFilter

    let matchesPrice = true
    if (priceFilter === "under5") matchesPrice = track.price < 5
    else if (priceFilter === "5to10") matchesPrice = track.price >= 5 && track.price <= 10
    else if (priceFilter === "over10") matchesPrice = track.price > 10

    return matchesSearch && matchesCategory && matchesPrice
  })

  const categories = ["all", ...new Set(mockTracks.map((t) => t.category).filter(Boolean))]

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="container px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search NFTs, artists, podcasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat!}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-[140px]">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under5">Under 5π</SelectItem>
              <SelectItem value="5to10">5π - 10π</SelectItem>
              <SelectItem value="over10">Over 10π</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredTracks.length} {filteredTracks.length === 1 ? "NFT" : "NFTs"} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map((track) => (
              <NFTCard key={track.id} track={track} onTip={() => handleTip(track)} />
            ))}
          </div>
        </div>

        {filteredTracks.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No NFTs found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </main>

      <MobileNav />
      <MiniPlayer />
      <FullPlayer />

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
