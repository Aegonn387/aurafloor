import { useCallback, useEffect, useState } from "react"

export interface Notification {
  id: string
  type: string
  userId: string
  senderId?: string
  senderUsername?: string
  senderAvatar?: string
  title: string
  message: string
  read: boolean
  unread: boolean
  amount?: number
  currency?: string
  metadata?: Record<string, any>
  nid?: string      // NFT ID
  tid?: string      // Transaction ID
  msgid?: string    // Message ID
  pid?: string      // Post ID
  cid?: string      // Comment ID
  createdAt: Date
  updatedAt: Date
}

export interface NotificationPreferences {
  pushNotifications: boolean
  emailNotifications: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  marketingEmails: boolean
  securityAlerts: boolean
  purchaseAlerts: boolean
  tipAlerts: boolean
  followerAlerts: boolean
  commentAlerts: boolean
  likeAlerts: boolean
  streamAlerts: boolean
  revenueAlerts: boolean
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

class NotificationServiceClass {
  /**
   * Fetch notifications for the current user
   */
  async getNotifications(page = 1, limit = 20): Promise<Notification[]> {
    try {
      const res = await fetch(`/api/notifications?page=${page}&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      
      return data.map((n: any) => ({
        id: n.id,
        type: n.type || 'system',
        userId: n.uid,
        senderId: n.sender_id,
        senderUsername: n.sender_username,
        senderAvatar: n.sender_avatar,
        title: n.title,
        message: n.msg || n.message,
        read: n.read || false,
        unread: n.unread !== false,
        amount: n.amt || n.amount,
        currency: n.currency || 'π',
        metadata: n.meta || n.metadata,
        nid: n.nid,
        tid: n.tid,
        msgid: n.msgid,
        pid: n.pid,
        cid: n.cid,
        createdAt: n.ca || n.created_at,
        updatedAt: n.updated_at || n.ca
      }))
    } catch (error) {
      console.error('NotificationService.getNotifications error:', error)
      throw error
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      if (!res.ok) throw new Error('Failed to mark as read')
    } catch (error) {
      console.error('NotificationService.markAsRead error:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to mark all as read')
    } catch (error) {
      console.error('NotificationService.markAllAsRead error:', error)
      throw error
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete notification')
    } catch (error) {
      console.error('NotificationService.deleteNotification error:', error)
      throw error
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    try {
      const res = await fetch('/api/notifications/clear-all', {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to clear notifications')
    } catch (error) {
      console.error('NotificationService.clearAll error:', error)
      throw error
    }
  }

  /**
   * Create a notification (internal/API use)
   */
  async createNotification(data: {
    recipientId: string
    type: string
    title: string
    message: string
    senderId?: string
    amount?: number
    currency?: string
    metadata?: Record<string, any>
    nid?: string
    tid?: string
    msgid?: string
    pid?: string
    cid?: string
  }): Promise<Notification> {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create notification')
      return await res.json()
    } catch (error) {
      console.error('NotificationService.createNotification error:', error)
      throw error
    }
  }

  /**
   * Get notification preferences for the current user
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const res = await fetch('/api/notifications/preferences')
      if (!res.ok) throw new Error('Failed to fetch preferences')
      return await res.json()
    } catch (error) {
      console.error('NotificationService.getPreferences error:', error)
      // Return defaults if API fails
      return {
        pushNotifications: true,
        emailNotifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
        marketingEmails: false,
        securityAlerts: true,
        purchaseAlerts: true,
        tipAlerts: true,
        followerAlerts: true,
        commentAlerts: true,
        likeAlerts: true,
        streamAlerts: true,
        revenueAlerts: true
      }
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })
      if (!res.ok) throw new Error('Failed to update preferences')
      return await res.json()
    } catch (error) {
      console.error('NotificationService.updatePreferences error:', error)
      throw error
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await fetch('/api/notifications/unread-count')
      if (!res.ok) throw new Error('Failed to fetch unread count')
      const data = await res.json()
      return data.count || 0
    } catch (error) {
      console.error('NotificationService.getUnreadCount error:', error)
      return 0
    }
  }
}

// Singleton instance
export const notificationService = new NotificationServiceClass()

// React hook for notifications
export function useNotifications(options?: { pollInterval?: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data)
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    if (options?.pollInterval) {
      const interval = setInterval(fetchNotifications, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchNotifications, options?.pollInterval])

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id)
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true, unread: false } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true, unread: false })))
    setUnreadCount(0)
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    await notificationService.deleteNotification(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    // Re-fetch unread count to be accurate
    const count = await notificationService.getUnreadCount()
    setUnreadCount(count)
  }, [])

  const clearAll = useCallback(async () => {
    await notificationService.clearAll()
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications
  }
}
