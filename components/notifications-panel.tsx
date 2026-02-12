"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { X, Bell, MessageSquare, Activity, CheckCircle, Settings, User, CreditCard, Heart, TrendingUp, Send, Search, MoreVertical, Video, Phone, Image as ImageIcon, Smile, Paperclip, Mic, Eye, EyeOff, Download, Share2, Flag, Volume2, VolumeX, Calendar, MapPin, Users, Star, Crown, Zap, Target, Wallet, Award, Gift, TrendingDown, Clock, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { notificationService, useNotifications } from "@/lib/services/notifications"

interface NotificationsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ViewMode = 'notifications' | 'messages' | 'activity' | 'chat'

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const { toast } = useToast()
  const user = useStore((state) => state.user)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)

  // ============ REAL DATA FROM YOUR DATABASE ============
  
  // 1. NOTIFICATIONS - from your 'notif' table via service
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: refreshNotifications
  } = useNotifications({ pollInterval: 30000 })

  // 2. CHATS - from your 'chats' table
  const [chats, setChats] = useState<any[]>([])
  const [chatsLoading, setChatsLoading] = useState(false)
  const [chatsError, setChatsError] = useState<string | null>(null)

  // 3. MESSAGES - from your 'msg' table
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  // 4. ACTIVITIES - from your 'activities' table
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)

  // 5. ONLINE STATUS - from your 'online_status' table
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({})

  // ============ UI STATE ============
  const [viewMode, setViewMode] = useState<ViewMode>('notifications')
  const [selectedChat, setSelectedChat] = useState<any | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  const [messagesEnabled, setMessagesEnabled] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('notifications-messages-enabled') : 'true'
    return saved !== null ? JSON.parse(saved) : true
  })
  // ============ FETCH CHATS FROM YOUR DATABASE ============
  const fetchChats = useCallback(async () => {
    if (!(user as any)?.id) return
    setChatsLoading(true)
    setChatsError(null)
    
    try {
      const response = await fetch(`/api/chats?userId=${(user as any).id}`)
      if (!response.ok) throw new Error('Failed to fetch chats')
      const data = await response.json()
      
      // Transform to match UI format
      const transformed = data.map((chat: any) => ({
        id: chat.id,
        userId: chat.other_user_id,
        userName: chat.other_user_name,
        userAvatar: chat.other_user_avatar,
        lastMessage: chat.last_message,
        lastMessageTime: formatTime(chat.last_message_time),
        unreadCount: chat.unread_count || 0,
        online: onlineUsers[chat.other_user_id] || false,
        lastSeen: chat.last_seen,
        typing: false,
        isMuted: chat.is_muted || false,
        isPinned: chat.is_pinned || false
      }))
      
      setChats(transformed)
    } catch (err) {
      console.error('Error fetching chats:', err)
      setChatsError('Failed to load conversations')
    } finally {
      setChatsLoading(false)
    }
  }, [user, onlineUsers])

  // ============ FETCH MESSAGES FOR SELECTED CHAT ============
  const fetchMessages = useCallback(async (chatId: string) => {
    setMessagesLoading(true)
    setMessagesError(null)
    
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      
      // Transform to match UI format
      const transformed = data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.fuid,
        receiverId: msg.tuid,
        content: msg.cont,
        timestamp: new Date(msg.ca).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: msg.read || false,
        type: msg.type || 'text',
        paymentAmount: msg.payment_amount,
        paymentCurrency: msg.payment_currency,
        attachments: msg.attachments
      }))
      
      setMessages(transformed)
      
      // Mark messages as read
      await fetch(`/api/messages/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, userId: (user as any)?.id })
      })
      
      // Update unread count in chats
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ))
      
    } catch (err) {
      console.error('Error fetching messages:', err)
      setMessagesError('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }, [user])

  // ============ FETCH ACTIVITIES FROM YOUR DATABASE ============
  const fetchActivities = useCallback(async () => {
    if (!(user as any)?.id) return
    setActivitiesLoading(true)
    setActivitiesError(null)
    
    try {
      const response = await fetch(`/api/activities?userId=${(user as any).id}&limit=20`)
      if (!response.ok) throw new Error('Failed to fetch activities')
      const data = await response.json()
      
      // Transform to match UI format with proper icons
      const transformed = data.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        time: formatTime(activity.created_at),
        icon: getActivityIcon(activity.type),
        action: activity.action_label ? {
          label: activity.action_label,
          onClick: () => window.location.href = activity.action_url || '#'
        } : undefined,
        metadata: activity.metadata
      }))
      
      setActivities(transformed)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setActivitiesError('Failed to load activities')
    } finally {
      setActivitiesLoading(false)
    }
  }, [user])
  // ============ FETCH ONLINE STATUS ============
  const fetchOnlineStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/online-status')
      if (!response.ok) throw new Error('Failed to fetch online status')
      const data = await response.json()
      
      const statusMap: Record<string, boolean> = {}
      data.forEach((status: any) => {
        statusMap[status.user_id] = status.online
      })
      setOnlineUsers(statusMap)
    } catch (err) {
      console.error('Error fetching online status:', err)
    }
  }, [])

  // ============ SEND MESSAGE ============
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedChat || !(user as any)?.id) return

    const tempId = Date.now().toString()
    const tempMessage = {
      id: tempId,
      senderId: (user as any).id,
      receiverId: selectedChat.userId,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'text' as const
    }

    setMessages(prev => [...prev, tempMessage])
    setMessageInput('')

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedChat.userId,
          content: messageInput,
          chatId: selectedChat.id
        })
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      const savedMessage = await response.json()
      
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(m => m.id === tempId ? {
          id: savedMessage.id,
          senderId: savedMessage.fuid,
          receiverId: savedMessage.tuid,
          content: savedMessage.cont,
          timestamp: new Date(savedMessage.ca).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: savedMessage.read || false,
          type: savedMessage.type || 'text',
          paymentAmount: savedMessage.payment_amount,
          paymentCurrency: savedMessage.payment_currency,
          attachments: savedMessage.attachments
        } : m)
      )
      
      // Update last message in chats list
      setChats(prev => prev.map(c => 
        c.id === selectedChat.id ? {
          ...c,
          lastMessage: messageInput,
          lastMessageTime: 'just now'
        } : c
      ))
      
    } catch (err) {
      console.error('Error sending message:', err)
      toast({
        title: 'Failed to send',
        description: 'Your message could not be sent. Please try again.',
        variant: 'destructive'
      })
      // Remove temp message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }, [messageInput, selectedChat, user, toast])

  // ============ MARK CHAT AS READ ============
  const markChatAsRead = useCallback(async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (user as any)?.id })
      })
      
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ))
    } catch (err) {
      console.error('Error marking chat as read:', err)
    }
  }, [user])

  // ============ DELETE CHAT ============
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (user as any)?.id })
      })
      
      setChats(prev => prev.filter(c => c.id !== chatId))
      
      if (selectedChat?.id === chatId) {
        setSelectedChat(null)
        setViewMode('messages')
      }
      
      toast({
        title: "Chat deleted",
        description: "The conversation has been removed",
      })
    } catch (err) {
      console.error('Error deleting chat:', err)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      })
    }
  }, [selectedChat, user, toast])

  // ============ START CHAT ============
  const startChat = useCallback((chat: any) => {
    setSelectedChat(chat)
    setViewMode('chat')
    fetchMessages(chat.id)
  }, [fetchMessages])

  // ============ FORMAT TIME ============
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // ============ GET ACTIVITY ICON ============
  const getActivityIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'stream': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'revenue': return <CreditCard className="w-4 h-4 text-yellow-500" />
      case 'promotion': return <Target className="w-4 h-4 text-blue-500" />
      case 'achievement': return <Award className="w-4 h-4 text-purple-500" />
      case 'milestone': return <Users className="w-4 h-4 text-pink-500" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  // ============ GET NOTIFICATION ICON ============
  const getNotificationIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'purchase': return <CreditCard className="w-4 h-4 text-green-500" />
      case 'tip': return <Gift className="w-4 h-4 text-yellow-500" />
      case 'follow': return <User className="w-4 h-4 text-blue-500" />
      case 'like': return <Heart className="w-4 h-4 text-red-500" />
      case 'comment': return <MessageSquare className="w-4 h-4 text-purple-500" />
      case 'stream': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'revenue': return <Wallet className="w-4 h-4 text-yellow-500" />
      case 'achievement': return <Award className="w-4 h-4 text-purple-500" />
      case 'system': return <Bell className="w-4 h-4 text-gray-500" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Bell className="w-4 h-4 text-gray-500" />
    }
  }
  // ============ EFFECTS ============
  
  // Fetch data on mount and when user changes
  useEffect(() => {
    if (!(user as any)?.id) return
    
    fetchChats()
    fetchActivities()
    fetchOnlineStatus()
    
    // Poll for online status every 30 seconds
    const interval = setInterval(fetchOnlineStatus, 30000)
    return () => clearInterval(interval)
  }, [user, fetchChats, fetchActivities, fetchOnlineStatus])

  // Save messagesEnabled to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications-messages-enabled', JSON.stringify(messagesEnabled))
    }
  }, [messagesEnabled])

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [open])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (selectedChat && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, selectedChat])

  // ============ FILTERS ============
  const filteredChats = chats.filter(chat =>
    chat.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredNotifications = notifications.filter(n =>
    n.senderUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ============ UNREAD COUNTS ============
  const totalUnreadMessages = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  // ============ KEYBOARD HANDLER ============
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 w-full sm:w-[480px] h-screen bg-card/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden">
        
        {/* ============ HEADER ============ */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-card to-card/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {viewMode === 'chat' ? selectedChat?.userName : 'Notifications'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {viewMode === 'notifications' && !notificationsLoading && `${unreadCount} unread • ${notifications.length} total`}
                {viewMode === 'notifications' && notificationsLoading && 'Loading...'}
                {viewMode === 'messages' && !chatsLoading && `${totalUnreadMessages} unread • ${chats.length} conversations`}
                {viewMode === 'messages' && chatsLoading && 'Loading...'}
                {viewMode === 'activity' && !activitiesLoading && `${activities.length} activities`}
                {viewMode === 'activity' && activitiesLoading && 'Loading...'}
                {viewMode === 'chat' && selectedChat?.online ? 'Online now' : 'Last seen recently'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'chat' ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSelectedChat(null); setViewMode('messages') }}
                className="h-9 w-9 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            ) : (
              <>
                {viewMode === 'notifications' && unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 px-3 text-sm hover:bg-white/10"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-2" />
                    Mark all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9 rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ============ TABS ============ */}
        {viewMode !== 'chat' && (
          <div className="px-4 pt-3 shrink-0">
            <Tabs
              defaultValue={viewMode}
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-3 rounded-lg bg-muted/50 p-1">
                <TabsTrigger value="notifications" className="rounded-md">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs bg-primary">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="messages" className="rounded-md">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                  {totalUnreadMessages > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs bg-primary">
                      {totalUnreadMessages}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-md">
                  <Activity className="w-4 h-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* ============ SEARCH ============ */}
        {viewMode !== 'chat' && (
          <div className="p-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={
                  viewMode === 'notifications' ? "Search notifications..." :
                  viewMode === 'messages' ? "Search conversations..." :
                  "Search activities..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10"
              />
            </div>
          </div>
        )}

        {/* ============ MAIN CONTENT ============ */}
        <div className="flex-1 overflow-hidden">
          {/* ===== NOTIFICATIONS VIEW ===== */}
          {viewMode === 'notifications' && (
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1 px-4">
                {notificationsLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-lg font-medium">Loading notifications...</p>
                  </div>
                ) : notificationsError ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-lg font-medium">Failed to load</p>
                    <p className="text-sm text-muted-foreground mt-2">{notificationsError}</p>
                    <Button className="mt-4" onClick={refreshNotifications}>
                      Try again
                    </Button>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                    <Bell className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchQuery ? 'No matches found' : 'All caught up!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-4 rounded-xl border transition-all duration-200 group hover:bg-accent/5 cursor-pointer",
                          notif.unread ? 'border-primary/20 bg-primary/5' : 'border-white/5'
                        )}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="w-11 h-11 border-2 border-background">
                              {notif.senderAvatar ? (
                                <AvatarImage src={notif.senderAvatar} alt={notif.senderUsername || 'User'} />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
                                  {notif.senderUsername?.[0] || '?'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-white/10 flex items-center justify-center">
                              {getNotificationIcon(notif.type)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {notif.senderUsername || 'System'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notif.message}
                                </p>
                                {notif.amount && (
                                  <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20">
                                    <CreditCard className="w-3 h-3 text-green-500" />
                                    <span className="text-sm font-medium text-green-500">
                                      +{notif.amount}{notif.currency || 'π'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {notif.unread && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1 animate-pulse" />
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notif.createdAt.toISOString())}
                              </span>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          markAsRead(notif.id)
                                        }}
                                        className="h-7 text-xs"
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Mark as read</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteNotification(notif.id)
                                        }}
                                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete notification</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {notifications.length > 0 && (
                <div className="p-4 border-t border-white/10 shrink-0">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={clearAll}>
                      <X className="w-4 h-4 mr-2" />
                      Clear all
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => toast({
                      title: "Notification settings",
                      description: "Settings panel would open here",
                    })}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== MESSAGES VIEW ===== */}
          {viewMode === 'messages' && (
            <div className="h-full flex flex-col">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-white/10 mx-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="messages-toggle"
                          checked={messagesEnabled}
                          onCheckedChange={setMessagesEnabled}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Label htmlFor="messages-toggle" className="text-sm font-medium">
                          Messages {messagesEnabled ? 'Enabled' : 'Disabled'}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {messagesEnabled
                          ? 'Receive messages from followers and collaborators'
                          : 'Messages are currently disabled'}
                      </p>
                    </div>
                  </div>
                  {totalUnreadMessages > 0 && (
                    <Button size="sm" onClick={markAllAsRead} className="h-8">
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>

              {messagesEnabled ? (
                <ScrollArea className="flex-1 px-4">
                  {chatsLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                      <p className="text-lg font-medium">Loading conversations...</p>
                    </div>
                  ) : chatsError ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                      <p className="text-lg font-medium">Failed to load</p>
                      <p className="text-sm text-muted-foreground mt-2">{chatsError}</p>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                      <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No conversations</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {searchQuery ? 'No matches found' : 'Start a conversation with other artists!'}
                      </p>
                      <Button className="mt-4">Explore Artists</Button>
                    </div>
                  ) : (
                    <div className="space-y-2 pb-4">
                      {filteredChats.map((chat) => (
                        <div
                          key={chat.id}
                          className="p-3 rounded-xl border border-white/5 hover:bg-accent/5 cursor-pointer group transition-all"
                          onClick={() => startChat(chat)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12 border-2 border-background">
                                {chat.userAvatar ? (
                                  <AvatarImage src={chat.userAvatar} alt={chat.userName} />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-br from-green-500/10 to-green-600/20 text-green-600">
                                    {chat.userName?.[0] || '?'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              {chat.online && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium truncate">
                                  {chat.userName}
                                </p>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {chat.lastMessageTime}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {chat.typing ? (
                                  <span className="text-primary animate-pulse">typing...</span>
                                ) : (
                                  chat.lastMessage
                                )}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              {chat.unreadCount > 0 && (
                                <Badge className="h-5 w-5 rounded-full p-0 text-xs bg-primary">
                                  {chat.unreadCount}
                                </Badge>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => markChatAsRead(chat.id)}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark as read
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <VolumeX className="w-4 h-4 mr-2" />
                                    Mute
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteChat(chat.id)
                                    }}
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Delete chat
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Messages are disabled</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-6">
                    Enable messages to connect with other artists and receive collaboration requests
                  </p>
                  <Button onClick={() => setMessagesEnabled(true)}>
                    Enable Messages
                  </Button>
                </div>
              )}
            </div>
          )}
          {/* ===== ACTIVITY VIEW ===== */}
          {viewMode === 'activity' && (
            <ScrollArea className="h-full px-4">
              {activitiesLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-lg font-medium">Loading activities...</p>
                </div>
              ) : activitiesError ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-lg font-medium">Failed to load</p>
                  <p className="text-sm text-muted-foreground mt-2">{activitiesError}</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No activity yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your recent activity will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 rounded-xl border border-white/5 hover:bg-accent/5 cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 flex items-center justify-center">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {activity.title}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {activity.time}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                          {activity.action && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              onClick={activity.action.onClick}
                            >
                              {activity.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* ===== CHAT VIEW ===== */}
          {viewMode === 'chat' && selectedChat && (
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-card to-card/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setSelectedChat(null); setViewMode('messages') }}
                      className="h-9 w-9 rounded-lg hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <div className="relative">
                      <Avatar className="w-10 h-10 border-2 border-background">
                        {selectedChat.userAvatar ? (
                          <AvatarImage src={selectedChat.userAvatar} alt={selectedChat.userName} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-green-500/10 to-green-600/20 text-green-600">
                            {selectedChat.userName?.[0] || '?'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {selectedChat.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium">{selectedChat.userName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedChat.online ? 'Online now' : selectedChat.lastSeen ? `Last seen ${selectedChat.lastSeen}` : 'Recently active'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Voice call</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Video className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Video call</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <VolumeX className="w-4 h-4 mr-2" />
                          Mute notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag className="w-4 h-4 mr-2" />
                          Report user
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => deleteChat(selectedChat.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Delete conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </div>
                ) : messagesError ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Failed to load messages</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-6">
                      <div className="px-3 py-1 rounded-full bg-white/5 text-xs text-muted-foreground">
                        Today
                      </div>
                    </div>

                    {/* Messages */}
                    {messages
                      .filter(msg =>
                        (msg.senderId === selectedChat.userId && msg.receiverId === (user as any)?.id) ||
                        (msg.senderId === (user as any)?.id && msg.receiverId === selectedChat.userId)
                      )
                      .map((message) => {
                        const isCurrentUser = message.senderId === (user as any)?.id

                        if (message.type === 'payment') {
                          return (
                            <div key={message.id} className="flex justify-center my-4">
                              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-5 h-5 text-green-500" />
                                  <span className="text-lg font-bold text-green-500">
                                    +{message.paymentAmount}{message.paymentCurrency}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Payment received from {selectedChat.userName}
                                </p>
                                <p className="text-xs text-muted-foreground">{message.timestamp}</p>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              isCurrentUser ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isCurrentUser && (
                              <Avatar className="w-8 h-8">
                                {selectedChat.userAvatar ? (
                                  <AvatarImage src={selectedChat.userAvatar} alt={selectedChat.userName} />
                                ) : (
                                  <AvatarFallback>{selectedChat.userName?.[0] || '?'}</AvatarFallback>
                                )}
                              </Avatar>
                            )}

                            <div className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-3",
                              isCurrentUser
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted rounded-bl-none"
                            )}>
                              <p className="text-sm">{message.content}</p>
                              <div className={cn(
                                "flex items-center gap-2 mt-1 text-xs",
                                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                <span>{message.timestamp}</span>
                                {isCurrentUser && (
                                  <span>
                                    {message.read ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isCurrentUser && (
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>You</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )
                      })}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          {selectedChat.userAvatar ? (
                            <AvatarImage src={selectedChat.userAvatar} alt={selectedChat.userName} />
                          ) : (
                            <AvatarFallback>{selectedChat.userName?.[0] || '?'}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messageEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="min-h-[44px] max-h-32 pr-12 resize-none bg-white/5 border-white/10"
                      rows={1}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Smile className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Emoji</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Paperclip className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Attach file</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    className="h-11 w-11"
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary">
                      <ImageIcon className="w-4 h-4" />
                      <span>Photo</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary">
                      <Mic className="w-4 h-4" />
                      <span>Audio</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary">
                      <CreditCard className="w-4 h-4" />
                      <span>Send π</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setAudioEnabled(!audioEnabled)}
                          >
                            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{audioEnabled ? 'Mute sounds' : 'Unmute sounds'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Chat settings</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
