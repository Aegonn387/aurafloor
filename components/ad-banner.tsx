"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useStore } from "@/lib/store"

interface AdBannerProps {
  placement: "top" | "bottom" | "inline"
  className?: string
}

export function AdBanner({ placement, className = "" }: AdBannerProps) {
  const user = useStore((state) => state.user)
  const [isVisible, setIsVisible] = useState(true)
  const [adContent, setAdContent] = useState<{
    title: string
    description: string
    cta: string
    url: string
  } | null>(null)

  useEffect(() => {
    const ads = [
      {
        title: "Discover New Artists",
        description: "Explore trending audio NFTs from emerging creators",
        cta: "Browse Now",
        url: "/marketplace",
      },
      {
        title: "Become a Creator",
        description: "Start earning from your music and podcasts",
        cta: "Start Creating",
        url: "/mint",
      },
      {
        title: "Go Ad-Free",
        description: "Upgrade to Premium for unlimited streaming",
        cta: "Upgrade Now",
        url: "/subscribe",
      },
    ]

    // Randomly select an ad
    setAdContent(ads[Math.floor(Math.random() * ads.length)])
  }, [])

  // Don't show ads for premium users
  if (user?.subscription === "premium") return null
  if (!isVisible || !adContent) return null

  const bannerStyles = {
    top: "mb-4",
    bottom: "mt-4",
    inline: "my-4",
  }

  return (
    <Card className={`border-muted ${bannerStyles[placement]} ${className}`}>
      <CardContent className="p-2 xs:p-3 sm:p-4">
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3">
          <div className="flex-1 min-w-0 w-full xs:w-auto">
            <div className="flex items-center gap-1 xs:gap-2 mb-0.5 xs:mb-1">
              <span className="text-[10px] xs:text-xs font-medium text-muted-foreground bg-muted px-1.5 xs:px-2 py-0.5 rounded">
                Sponsored
              </span>
            </div>
            <h4 className="font-semibold text-xs xs:text-sm sm:text-base truncate">
              {adContent.title}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 xs:line-clamp-2">
              {adContent.description}
            </p>
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2 self-stretch xs:self-auto">
            <Link href={adContent.url}>
              <Button 
                size="sm" 
                className="text-xs xs:text-sm whitespace-nowrap h-7 xs:h-9 px-2 xs:px-3"
              >
                {adContent.cta}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 xs:h-8 xs:w-8 shrink-0" 
              onClick={() => setIsVisible(false)}
            >
              <X className="w-3 h-3 xs:w-4 xs:h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
