"use client"

import { useState } from "react"
import { X, Bell, MessageSquare, Activity, CheckCircle, Settings, User, CreditCard, Heart, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import { Separator } from "@/components/ui/separator"

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
      icon: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
    },
    {
      id: "2",
      type: "tip",
      user: "Mike Ross",
      message: "tipped you 5π on 'Summer Vibes'",
      time: "1h ago",
      unread: true,
      icon: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
    },
    {
      id: "3",
      type: "follow",
      user: "Emma Wilson",
      message: "started following you",
      time: "3h ago",
      unread: false,
      icon: <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
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
      icon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
    },
    {
      id: "2",
      type: "revenue",
      message: "You earned 2.4π from ad revenue",
      time: "4h ago",
      icon: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
    },
    {
      id: "3",
      type: "promotion",
      message: "Your promotion campaign is performing well",
      time: "1d ago",
      icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
    },
  ]

  const unreadNotifications = notifications.filter((n) => n.unread).length
  const unreadMessages = messages.filter((m) => m.unread).length

  return (
    <>
      {/* Overlay with backdrop blur */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel with glass effect - Responsive positioning */}
      <div className="fixed top-16 right-0 sm:right-4 w-full sm:w-auto sm:max-w-sm h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] bg-card/95 backdrop-blur-lg border border-white/10 shadow-2xl rounded-none sm:rounded-xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-gradient-to-r from-card to-card/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">
                {unreadNotifications} unread • {messages.length} messages
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Tabs - Responsive tabs container */}
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="notifications" className="w-full flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 rounded-lg bg-muted/50 p-1 text-xs sm:text-sm">
              <TabsTrigger
                value="notifications"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm relative text-xs sm:text-sm"
              >
                <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <Badge className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs bg-primary">
                    {unreadNotifications}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm relative text-xs sm:text-sm"
              >
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-2" />
                Messages
                {unreadMessages > 0 && (
                  <Badge className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs bg-primary">
                    {unreadMessages}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm"
              >
                <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Notifications Content */}
            <TabsContent value="notifications" className="mt-3 sm:mt-4 focus:outline-none flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-1 sm:pr-2">
                <div className="space-y-2 sm:space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 group hover:bg-accent/5 cursor-pointer ${
                        notif.unread
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="relative">
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary text-xs sm:text-sm">
                              {notif.user[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-background border border-white/10 flex items-center justify-center">
                            {notif.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs sm:text-sm font-medium leading-tight">
                                {notif.user}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
                                {notif.message}
                              </p>
                            </div>
                            {notif.unread && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary flex-shrink-0 mt-0.5 sm:mt-1 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {notif.time}
                            </span>
                            {notif.unread && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 sm:h-6 text-[10px] sm:text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="pt-3 sm:pt-4 border-t border-white/10 mt-3 sm:mt-4 shrink-0">
                <Button variant="outline" className="w-full text-xs sm:text-sm h-8 sm:h-9">
                  <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                  Notification settings
                </Button>
              </div>
            </TabsContent>

            {/* Messages Content */}
            <TabsContent value="messages" className="mt-3 sm:mt-4 focus:outline-none flex-1 flex flex-col min-h-0">
              <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 mb-3 sm:mb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="messages-toggle"
                      checked={messagesEnabled}
                      onCheckedChange={setMessagesEnabled}
                      className="data-[state=checked]:bg-primary h-4 w-7 sm:h-5 sm:w-9"
                    />
                    <Label htmlFor="messages-toggle" className="text-xs sm:text-sm">
                      Enable Messages
                    </Label>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {messagesEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              <ScrollArea className="flex-1 pr-1 sm:pr-2">
                {messagesEnabled ? (
                  <div className="space-y-2 sm:space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 group hover:bg-accent/5 cursor-pointer ${
                          msg.unread
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-green-500/10 to-green-600/20 text-green-600 text-xs sm:text-sm">
                              {msg.user[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs sm:text-sm font-medium leading-tight">
                                  {msg.user}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 leading-tight line-clamp-2">
                                  {msg.message}
                                </p>
                              </div>
                              {msg.unread && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 flex-shrink-0 mt-0.5 sm:mt-1 animate-pulse" />
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {msg.time}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 sm:h-6 text-[10px] sm:text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Reply
                                </Button>
                                {msg.unread && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 sm:h-6 text-[10px] sm:text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                    Read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-4 sm:p-6 rounded-xl border border-dashed border-white/10">
                    <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-2 sm:mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Messages are currently disabled
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enable messages to receive private messages from other users
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 sm:mt-4 text-xs sm:text-sm"
                      onClick={() => setMessagesEnabled(true)}
                    >
                      Enable Messages
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Activity Content */}
            <TabsContent value="activity" className="mt-3 sm:mt-4 focus:outline-none flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-1 sm:pr-2">
                <div className="space-y-2 sm:space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-white/5 transition-all duration-200 hover:bg-accent/5 cursor-pointer group"
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 flex items-center justify-center">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium leading-tight">
                            {activity.message}
                          </p>
                          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {activity.time}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 sm:h-6 text-[10px] sm:text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              View details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
