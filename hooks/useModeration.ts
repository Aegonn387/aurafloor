"use client"

import { useState, useCallback } from "react"

export interface ModerationAssignment {
  id: number
  content_id: string
  creator_wallet: string
  title: string
  status: string
  risk_score: number
}

export function useModeration(moderatorAddress: string) {
  const [assignments, setAssignments] = useState<ModerationAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [rewards, setRewards] = useState(0)

  const fetchAssignments = useCallback(async () => {
    if (!moderatorAddress) return
    setLoading(true)
    try {
      const res = await fetch(`/.netlify/functions/moderate-content?moderatorAddress=${moderatorAddress}`)
      const data = await res.json()
      if (data.assignments) setAssignments(data.assignments)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [moderatorAddress])

  const vote = useCallback(async (assignmentId: number, voteValue: string) => {
    const res = await fetch('/.netlify/functions/moderate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', assignmentId, moderator: moderatorAddress, vote: voteValue })
    })
    if (res.ok) {
      setAssignments(prev => prev.filter(a => a.id !== assignmentId))
    }
    return res.ok
  }, [moderatorAddress])

  const claimRewards = useCallback(async () => {
    const res = await fetch('/.netlify/functions/claim-moderation-rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderator: moderatorAddress })
    })
    const data = await res.json()
    if (data.success) setRewards(prev => prev + data.claimed)
    return data
  }, [moderatorAddress])

  return { assignments, loading, rewards, fetchAssignments, vote, claimRewards }
}
