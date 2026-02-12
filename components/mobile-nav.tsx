"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusCircle, Users, User, Menu, X, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useState, useEffect } from "react"

export function MobileNav() {
  const pathname = usePathname()
  const user = useStore((state) => state.user)
  const isCreator = user?.role === "creator"
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/marketplace", icon: Search, label: "Search" },
    ...(isCreator ? [{ href: "/mint", icon: PlusCircle, label: "Mint" }] : []),
    { href: "/community", icon: Users, label: "Community" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  // Desktop collapsible sidebar
  const DesktopSidebar = () => (
    <>
      {/* Desktop Menu Toggle Button - Bottom Right Corner */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="hidden lg:flex fixed bottom-6 right-6 z-50 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Overlay - Click to close */}
      {isSidebarOpen && (
        <div
          className="hidden lg:block fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:fixed lg:left-0 lg:top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-r border-border z-40 transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Aurafloor</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors w-full",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10",
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )

  // Mobile bottom nav version
  const MobileBottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border z-40">
      <div className="flex items-center justify-around h-16 container mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
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

  return (
    <>
      {/* Desktop: Collapsible Sidebar */}
      <DesktopSidebar />

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </>
  )
}