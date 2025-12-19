"use client"

import { useState } from "react"
import Link from "next/link"
import { Music2, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AuthDialog } from "./auth-dialog"
import { NotificationsPanel } from "./notifications-panel"
import { useStore } from "@/lib/store"

export function Header() {
  const [showAuth, setShowAuth] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const user = useStore((state) => state.user)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Aurafloor</span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                </Button>

                <Link href="/profile">
                  <Button variant="ghost" size="icon">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
              </>
            ) : (
              <Button onClick={() => setShowAuth(true)} size="sm">
                Connect
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />

      {user && <NotificationsPanel open={showNotifications} onOpenChange={setShowNotifications} />}
    </>
  )
}
