import type { NextRequest } from "next/server"
import { query, queryOne } from "./db"
import { redis } from "./redis"

export interface User {
  id: string
  pi_username: string
  pi_address: string
  role: "creator" | "collector"
  display_name: string | null
  subscription_tier: "free" | "premium"
  messaging_enabled: boolean
}

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  // Get user ID from header or session
  const userId = request.headers.get("x-user-id")

  if (!userId) {
    return null
  }

  // Check cache first
  const cached = await redis.get<User>(`user:${userId}`)
  if (cached) {
    return cached
  }

  // Query database
  const user = await queryOne<User>(
    `SELECT id, pi_username, pi_address, role, display_name, subscription_tier, messaging_enabled
     FROM users WHERE id = $1`,
    [userId],
  )

  if (user) {
    // Cache for 5 minutes
    await redis.setex(`user:${userId}`, 300, JSON.stringify(user))
  }

  return user
}

export async function getUserByPiAddress(piAddress: string): Promise<User | null> {
  return await queryOne<User>(
    `SELECT id, pi_username, pi_address, role, display_name, subscription_tier, messaging_enabled
     FROM users WHERE pi_address = $1`,
    [piAddress],
  )
}

export async function createOrUpdateUser(piData: {
  username: string
  address: string
  role: "creator" | "collector"
}): Promise<User> {
  const [user] = await query<User>(
    `INSERT INTO users (pi_username, pi_address, role, display_name)
     VALUES ($1, $2, $3, $3)
     ON CONFLICT (pi_username) 
     DO UPDATE SET updated_at = NOW()
     RETURNING id, pi_username, pi_address, role, display_name, subscription_tier, messaging_enabled`,
    [piData.username, piData.address, piData.role],
  )

  // Create wallet if doesn't exist
  await query(
    `INSERT INTO user_wallets (user_id, pi_address)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id, piData.address],
  )

  return user
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getUserFromRequest(request)

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}

export async function requireRole(request: NextRequest, role: "creator" | "collector"): Promise<User> {
  const user = await requireAuth(request)

  if (user.role !== role) {
    throw new Error("Forbidden: Insufficient permissions")
  }

  return user
}
