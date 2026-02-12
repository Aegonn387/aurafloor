"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Filter, Music, User, DollarSign, Play, Headphones } from 'lucide-react'
import { useStore } from "@/lib/store"
import { Header } from "@/components/header"
import { PurchaseModal } from "@/components/purchase-modal"
import { TipModal } from "@/components/tip-modal"

interface NFT {
  id: string
  tokenId: string
  title: string
  description: string
  price: string
  owner: string
  seller: string
  royaltyInfo: {
    receiver: string
    royaltyBps: number
  }
  metadata?: {
    name?: string
    description?: string
    image?: string
    duration?: number
  }
  audioUrls?: {
    preview: string
    standard: string
    hq: string
  }
}

interface DBData {
  title?: string
  description?: string
  price?: string
  cimg?: string
  dur?: number
  aprev?: string
  astd?: string
  ahq?: string
}

export default function MarketplacePage() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)

  const {
    setCurrentTrack,
    setIsPlaying,
    setIsMiniPlayer
  } = useStore()

  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {
    try {
      setLoading(true)
      const response = await fetch('/api/stellar/get-listing/?getAll=true')

      if (response.ok) {
        const data = await response.json()

        const transformedNFTs = data.listings?.map((listing: any, index: number) => {
          let dbData: DBData = {}

          return {
            id: listing.tokenId || `nft-${index}`,
            tokenId: listing.tokenId || index.toString(),
            title: listing.metadata?.name || dbData.title || `Audio NFT #${listing.tokenId || index}`,
            description: listing.metadata?.description || dbData.description || 'An exclusive audio NFT',
            price: listing.price || dbData.price || '0.5',
            owner: listing.owner || '',
            seller: listing.seller || listing.owner || '',
            royaltyInfo: listing.royaltyInfo || { receiver: '', royaltyBps: 0 },
            metadata: listing.metadata || {
              name: `Audio NFT #${listing.tokenId || index}`,
              description: 'An exclusive audio NFT on Aurafloor',
              image: dbData.cimg || '/placeholder-audio.jpg',
              duration: dbData.dur || 180
            },
            audioUrls: {
              preview: dbData.aprev || `/api/audio/preview/${listing.tokenId}`,
              standard: dbData.astd || `/api/audio/standard/${listing.tokenId}`,
              hq: dbData.ahq || `/api/audio/hq/${listing.tokenId}`
            }
          }
        }) || []

        setNfts(transformedNFTs)
      } else {
        console.error('Failed to fetch NFTs:', response.status)
        setNfts([])
      }
    } catch (error) {
      console.error('Error loading NFTs:', error)
      setNfts([])
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = (nft: NFT) => {
    setSelectedNFT(nft)
    setPurchaseModalOpen(true)
  }

  const handleTipCreator = (nft: NFT) => {
    setSelectedNFT(nft)
    setTipModalOpen(true)
  }

  const playAudioPreview = (nft: NFT) => {
    setCurrentTrack({
      id: nft.id,
      title: nft.title,
      artist: nft.owner,
      coverUrl: nft.metadata?.image || '',
      audioUrl: nft.audioUrls?.preview || '',
      duration: nft.metadata?.duration || 180,
      price: parseFloat(nft.price) || 0,
      owned: false,
      quality: 'preview',
      nftData: nft
    })

    setIsMiniPlayer(true)
    setIsPlaying(true)
  }

  const playFullStream = (nft: NFT) => {
    setCurrentTrack({
      id: nft.id,
      title: nft.title,
      artist: nft.owner,
      coverUrl: nft.metadata?.image || '',
      audioUrl: nft.audioUrls?.standard || '',
      duration: nft.metadata?.duration || 180,
      price: parseFloat(nft.price) || 0,
      owned: false,
      quality: 'standard',
      nftData: nft
    })

    setIsMiniPlayer(true)
    setIsPlaying(true)
  }

  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch =
      (nft.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nft.description || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (filter === "all") return matchesSearch
    if (filter === "music") return matchesSearch
    if (filter === "collectibles") return matchesSearch

    return matchesSearch
  })

  const getSellerDisplay = (nft: NFT) => {
    if (!nft.seller) return 'Unknown'
    if (nft.seller.length <= 8) return nft.seller
    return `${nft.seller.slice(0, 8)}...`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Audio NFT Marketplace</h1>
            <p className="text-muted-foreground">
              Discover, stream, and collect exclusive audio NFTs
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search audio NFTs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="collectibles">Collectibles</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadNFTs} variant="outline" className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading audio NFTs...</span>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredNFTs.length} audio NFTs
                </p>
              </div>

              {filteredNFTs.length === 0 ? (
                <div className="text-center py-20">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No audio NFTs found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try a different search' : 'Check back soon'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredNFTs.map((nft) => (
                    <div key={nft.id} className="group transition-all duration-200 hover:shadow-md">
                      <Card className="overflow-hidden border-border h-full flex flex-col">
                        <div className="relative aspect-square bg-gradient-to-br from-primary/5 to-secondary/5">
                          <img
                            src={nft.metadata?.image || '/placeholder-audio.jpg'}
                            alt={nft.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <Button
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                              onClick={() => playAudioPreview(nft)}
                            >
                              <Play className="h-5 w-5" fill="currentColor" />
                            </Button>
                          </div>

                          <Badge className="absolute top-2 right-2 bg-primary text-xs">
                            <Music className="h-2.5 w-2.5 mr-1" />
                            Audio
                          </Badge>

                          {nft.metadata?.duration && (
                            <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                              {formatDuration(nft.metadata.duration)}
                            </Badge>
                          )}
                        </div>

                        <CardContent className="p-3 flex-grow">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base truncate">{nft.title}</CardTitle>
                              <Badge variant="outline" className="text-xs shrink-0 ml-1">
                                #{nft.tokenId}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {nft.description}
                            </p>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{getSellerDisplay(nft)}</span>
                              </div>
                              <div className="flex items-center gap-1 font-medium">
                                <DollarSign className="h-3 w-3" />
                                <span>{nft.price} XLM</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="p-3 pt-0">
                          <div className="flex gap-1 w-full">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => playFullStream(nft)}
                            >
                              <Headphones className="h-3.5 w-3.5 mr-1" />
                              Stream
                            </Button>

                            <Button size="sm" className="flex-1" onClick={() => handleBuy(nft)}>
                              Buy
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                              onClick={() => handleTipCreator(nft)}
                            >
                              Tip
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedNFT && (
            <PurchaseModal
              open={purchaseModalOpen}
              onOpenChange={setPurchaseModalOpen}
              track={{
                id: selectedNFT.id,
                title: selectedNFT.title,
                artist: selectedNFT.owner,
                price: parseFloat(selectedNFT.price) || 0,
                coverUrl: selectedNFT.metadata?.image || "",
                audioUrl: selectedNFT.audioUrls?.preview || "",
                duration: selectedNFT.metadata?.duration || 180,
                owned: false
              }}
            />
          )}

          {selectedNFT && (
            <TipModal
              open={tipModalOpen}
              onOpenChange={setTipModalOpen}
              artistName={selectedNFT.owner}
              trackTitle={selectedNFT.title}
            />
          )}
        </div>
      </div>
    </>
  )
}
