"use client"

import { useState } from "react"
import { X, Bell, MessageSquare, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"

interface NotificationsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const [messagesEnabled, setMessagesEnabled] = useState(true)
  const user = useStore((state) => state.user)

  if (!open) return null

  // Mock data - would come from API in production
  const notifications = [
    {
      id: "1",
      type: "purchase",
      user: "Sarah Chen",
      message: "purchased your NFT 'Midnight Jazz'",
      time: "2m ago",
      unread: true,
    },
    {
      id: "2",
      type: "tip",
      user: "Mike Ross",
      message: "tipped you 5π on 'Summer Vibes'",
      time: "1h ago",
      unread: true,
    },
    {
      id: "3",
      type: "follow",
      user: "Emma Wilson",
      message: "started following you",
      time: "3h ago",
      unread: false,
    },
  ]

  const messages = [
    {
      id: "1",
      user: "Alex Turner",
      message: "Hey! Love your latest track. Any chance for a collab?",
      time: "5m ago",
      unread: true,
    },
    {
      id: "2",
      user: "Jordan Lee",
      message: "Thanks for the inspiration!",
      time: "2h ago",
      unread: false,
    },
  ]

  const activities = [
    {
      id: "1",
      type: "stream",
      message: "Your track 'Ocean Waves' reached 1,000 streams",
      time: "1h ago",
    },
    {
      id: "2",
      type: "revenue",
      message: "You earned 2.4π from ad revenue",
      time: "4h ago",
    },
    {
      id: "3",
      type: "promotion",
      message: "Your promotion campaign is performing well",
      time: "1d ago",
    },
  ]

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={() => onOpenChange(false)} />

      {/* Panel */}
      <div className="fixed top-16 right-0 w-full sm:w-96 h-[calc(100vh-4rem)] bg-card border-l border-border z-50 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="notifications" className="h-[calc(100%-4rem)]">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
            <TabsTrigger value="notifications" className="relative">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {notifications.filter((n) => n.unread).length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {notifications.filter((n) => n.unread).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
              {messages.filter((m) => m.unread).length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {messages.filter((m) => m.unread).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="h-full mt-0">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                      notif.unread ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">{notif.user[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{notif.user}</span> {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                      </div>
                      {notif.unread && <div className="w-2 h-2 rounded-full bg-accent mt-2" />}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages" className="h-full mt-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="messages-toggle" checked={messagesEnabled} onCheckedChange={setMessagesEnabled} />
                <Label htmlFor="messages-toggle" className="text-sm">
                  Enable Messages
                </Label>
              </div>
            </div>
            <ScrollArea className="h-full">
              {messagesEnabled ? (
                <div className="p-2 space-y-1">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                        msg.unread ? "bg-muted/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">{msg.user[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{msg.user}</p>
                            <p className="text-xs text-muted-foreground">{msg.time}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">{msg.message}</p>
                        </div>
                        {msg.unread && <div className="w-2 h-2 rounded-full bg-accent mt-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Messages are currently disabled. Enable them to receive private messages from other users.
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="h-full mt-0">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
