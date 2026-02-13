"use client"

import Link from "next/link"
import { Music2 } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 pt-3 pb-0 sm:pt-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mb-3">
          {/* Brand Section */}
          <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Music2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm">Aurafloor</span>
            </Link>
            <p className="text-xs text-muted-foreground mb-2 max-w-xs">
              Pi-powered audio NFT marketplace for musicians and collectors.
            </p>
            {/* Social media links removed */}
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Marketplace</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link href="/marketplace" className="hover:text-foreground transition-colors">Browse NFTs</Link></li>
              <li><Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link></li>
              <li><Link href="/marketplace?category=music" className="hover:text-foreground transition-colors">Music</Link></li>
              <li><Link href="/marketplace?category=podcast" className="hover:text-foreground transition-colors">Podcasts</Link></li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Creators</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link href="/mint" className="hover:text-foreground transition-colors">Mint NFT</Link></li>
              <li><Link href="/promote" className="hover:text-foreground transition-colors">Promote Content</Link></li>
              <li><Link href="/profile" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/creator-tools" className="hover:text-foreground transition-colors">Creator Tools</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Community</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link href="/community" className="hover:text-foreground transition-colors">Community Hub</Link></li>
              <li><Link href="/subscribe" className="hover:text-foreground transition-colors">Subscriptions</Link></li>
              {/* External Pi Network link removed */}
              <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Legal</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/copyright" className="hover:text-foreground transition-colors">Copyright Policy</Link></li>
              <li><Link href="/fees" className="hover:text-foreground transition-colors">Fee Structure</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright & Powered by */}
        <div className="border-t pt-3 pb-3 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Copyright {new Date().getFullYear()} Aurafloor. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              Powered by <span className="text-[#FCD535] font-semibold">Pi Network</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
