"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Coins, Play } from "lucide-react"
import { useStore } from "@/lib/store"
import { useModeration } from "@/hooks/useModeration"

export default function ModeratePage() {
  const user = useStore((state) => state.user)
  const moderatorAddress = user?.piaddr || ''
  const { assignments, loading, rewards, fetchAssignments, vote, claimRewards } = useModeration(moderatorAddress)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => { fetchAssignments() }, [fetchAssignments])

  const handleVote = async (id: number, v: string) => {
    await vote(id, v)
    fetchAssignments()
  }

  const handleClaim = async () => {
    setClaiming(true)
    await claimRewards()
    setClaiming(false)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Content Moderation</h1>
            <p className="text-muted-foreground text-sm">Review flagged content and earn AURA</p>
          </div>
          <Button variant="outline" onClick={handleClaim} disabled={claiming} className="gap-2">
            <Coins className="w-4 h-4" />
            {claiming ? 'Claiming...' : `Claim Rewards`}
          </Button>
        </div>
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-sm">Earned this session: <strong>{rewards}</strong> AURA</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : assignments.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No pending content to review.</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{a.title || 'Untitled'}</CardTitle>
                      <CardDescription>by {a.creator_wallet?.slice(0,8)}... • Risk: {(a.risk_score*100).toFixed(0)}%</CardDescription>
                    </div>
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" className="gap-1 text-green-600" onClick={() => handleVote(a.id, 'approve')}>
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => handleVote(a.id, 'reject')}>
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  )
}
