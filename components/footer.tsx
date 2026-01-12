"use client"

import Link from "next/link"
import { Music2, Twitter, MessageCircle, Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-20 md:pb-24">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Music2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">Aurafloor</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Pi-powered audio NFT marketplace for musicians and collectors.
            </p>
            <div className="flex gap-3">
              <Link
                href="https://twitter.com"
                className="h-9 w-9 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="https://discord.com"
                className="h-9 w-9 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
              <Link
                href="https://github.com"
                className="h-9 w-9 rounded-lg bg-muted hover:bg/muted/80 flex items-center justify-center transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Marketplace</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/marketplace" className="hover:text-foreground transition-colors">
                  Browse NFTs
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/marketplace?category=music" className="hover:text-foreground transition-colors">
                  Music
                </Link>
              </li>
              <li>
                <Link href="/marketplace?category=podcast" className="hover:text-foreground transition-colors">
                  Podcasts
                </Link>
              </li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Creators</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/mint" className="hover:text-foreground transition-colors">
                  Mint NFT
                </Link>
              </li>
              <li>
                <Link href="/promote" className="hover:text-foreground transition-colors">
                  Promote Content
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="hover:text-foreground transition-colors">
                  Creator Plans
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/community" className="hover:text-foreground transition-colors">
                  Community Hub
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="hover:text-foreground transition-colors">
                  Subscriptions
                </Link>
              </li>
              <li>
                <Link
                  href="https://pi.network"
                  className="hover:text-foreground transition-colors"
                  target="_blank"
                >
                  Pi Network
                </Link>
              </li>
              <li>
                <Link href="/community?tab=help" className="hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/copyright" className="hover:text-foreground transition-colors">
                  Copyright Policy
                </Link>
              </li>
              <li>
                <Link href="/fees" className="hover:text-foreground transition-colors">
                  Fee Structure
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - ADDED MORE BOTTOM PADDING HERE */}
        <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 sm:pb-8">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Aurafloor. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              Powered by <span className="text-[#FCD535] font-semibold">Pi Network</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
