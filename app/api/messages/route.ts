// app/api/messages/route.ts
// This is a placeholder API route for messages

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Return mock chat list
  return NextResponse.json([
    {
      id: "1",
      userId: "alex_turner",
      userName: "Alex Turner",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      lastMessage: "Hey! Love your latest track. Any chance for a collab?",
      lastMessageTime: "5m ago",
      unreadCount: 3,
      online: true,
      typing: false,
      isMuted: false,
      isBlocked: false
    }
  ])
}

export async function POST(request: NextRequest) {
  // Handle sending messages
  const body = await request.json()
  const { receiverId, content, type } = body

  // In a real app, save message to database and send via WebSocket

  const mockMessage = {
    id: Date.now().toString(),
    senderId: "current_user",
    receiverId,
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
    type: type || 'text'
  }

  return NextResponse.json(mockMessage)
}
