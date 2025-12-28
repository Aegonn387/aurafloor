// IMPORTANT: NO "use client" - This is now a server component
import { mockTracks } from "@/lib/mock-data"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Gift, TrendingUp, Headphones, Flag } from "lucide-react"

// REQUIRED FOR STATIC EXPORT
export async function generateStaticParams() {
  return mockTracks.map((track) => ({
    id: track.id,
  }))
}

export default function NFTDetailPage({ params }: { params: { id: string } }) {
  const track = mockTracks.find((t) => t.id === params.id)

  if (!track) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">NFT not found</p>
      </div>
    )
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
            <div className="absolute top-4 left-4 bg-black/40 text-white p-2 rounded">
              <Flag className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3">
                {track.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{track.title}</h1>
              <p className="text-xl text-muted-foreground">{track.artist}</p>
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
              <div className="w-full p-4 bg-secondary text-secondary-foreground rounded-lg flex items-center">
                <Headphones className="w-5 h-5 mr-2" />
                Stream Now (Static Preview)
              </div>
              
              {!track.owned ? (
                <div className="w-full p-4 bg-primary text-primary-foreground rounded-lg flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy NFT for {track.price}π (Static Preview)
                </div>
              ) : (
                <div className="w-full p-4 bg-secondary text-secondary-foreground rounded-lg flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Already Owned
                </div>
              )}
              
              <div className="w-full p-4 border rounded-lg flex items-center">
                <Gift className="w-5 h-5 mr-2" />
                Tip Creator (Static Preview)
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed">
              {track.description || "No description available."}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Note: This is a statically generated page for domain verification. 
              Interactive features will be restored after verification.
            </p>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
