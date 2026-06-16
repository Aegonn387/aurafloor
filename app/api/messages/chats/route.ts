export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  return 'current_user_id'
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
  return new Date(date).toLocaleDateString()
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chats = await sql`
      SELECT * FROM chats
      WHERE user_id = ${userId}
      ORDER BY last_message_time DESC
    `

    const formatted = chats.map(chat => ({
      id: chat.id,
      userId: chat.other_user_id,
      userName: chat.other_user_name,
      userAvatar: chat.other_user_avatar,
      lastMessage: chat.last_message,
      lastMessageTime: formatTime(chat.last_message_time),
      unreadCount: chat.unread_count,
      online: false,
      typing: false,
      isMuted: chat.is_muted,
      isPinned: chat.is_pinned
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}
