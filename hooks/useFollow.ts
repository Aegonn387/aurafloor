"use client"

import { useState, useEffect, useCallback } from "react"

export function useFollow(username: string | undefined) {
  const [followers, setFollowers] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!username) return
    fetch(`/.netlify/functions/follow?username=${username}`)
      .then(r => r.json())
      .then(d => { setFollowers(d.followers ?? 0); setIsFollowing(d.isFollowing ?? false) })
      .catch(() => {})
  }, [username])

  const toggle = useCallback(async () => {
    if (!username) return
    setLoading(true)
    const action = isFollowing ? 'unfollow' : 'follow'
    const res = await fetch('/.netlify/functions/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower: 'current_user', following: username, action })
    })
    if (res.ok) {
      setIsFollowing(!isFollowing)
      setFollowers(prev => isFollowing ? prev - 1 : prev + 1)
    }
    setLoading(false)
  }, [username, isFollowing])

  return { followers, isFollowing, toggle, loading }
}
