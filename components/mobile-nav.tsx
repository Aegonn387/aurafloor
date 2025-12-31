"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusCircle, Users, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

export function MobileNav() {
  const pathname = usePathname()
  const user = useStore((state) => state.user)
  const isCreator = user?.role === "creator"

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    ...(isCreator ? [{ href: "/mint", icon: PlusCircle, label: "Mint" }] : []),
    { href: "/community", icon: Users, label: "Community" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border z-40">
      <div className="flex items-center justify-around h-16 container mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
