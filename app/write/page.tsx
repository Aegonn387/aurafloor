"use client"

import { useState, useEffect } from 'react'
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Send, FileText, Plus, Trash2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"

interface Draft {
  id: string
  title: string
  content: string
  saved_at: string
}

export default function WritePage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/blog?drafts=true')
      const data = await res.json()
      if (data.drafts) setDrafts(data.drafts)
    } catch (e) { console.error(e) }
  }

  const selectDraft = (draft: Draft) => {
    setTitle(draft.title)
    setContent(draft.content)
  }

  const deleteDraft = async (id: string) => {
    await fetch(`/api/blog/${id}`, { method: 'DELETE' })
    setDrafts(prev => prev.filter(d => d.id !== id))
    setMessage('Draft deleted')
    setTimeout(() => setMessage(''), 3000)
  }

  const saveDraft = async () => {
    if (!title.trim()) return
    if (drafts.length >= 5 && !drafts.find(d => d.title === title)) {
      setMessage('Max 5 drafts. Delete one first.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/blog', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, action: 'draft' })
    })
    const data = await res.json()
    if (data.success) {
      setMessage('Draft saved')
      fetchDrafts()
    } else { setMessage(data.error || 'Save failed') }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const publish = async () => {
    if (!title.trim() || !content.trim()) return
    setPublishing(true)
    const res = await fetch('/api/blog', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, action: 'publish' })
    })
    const data = await res.json()
    if (data.success) {
      setMessage('Published!')
      setTitle(''); setContent('')
      fetchDrafts()
    } else { setMessage(data.error || 'Publish failed') }
    setPublishing(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl sm:text-3xl font-bold">Write</h1><p className="text-muted-foreground text-sm">Drafts are saved automatically. Max 5 drafts.</p></div>
          <Button variant="outline" onClick={saveDraft} disabled={saving} className="gap-2"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Draft'}</Button>
        </div>
        {message && <div className="p-3 bg-muted rounded-lg text-sm">{message}</div>}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Input placeholder="Article title" value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
            <Textarea placeholder="Write your article here..." value={content} onChange={(e) => setContent(e.target.value)} rows={20} className="min-h-[300px]" />
            <div className="flex gap-2">
              <Button onClick={publish} disabled={publishing || !title.trim() || !content.trim()} className="gap-2"><Send className="w-4 h-4" />{publishing ? 'Publishing...' : 'Publish'}</Button>
              <Button variant="outline" onClick={() => { setTitle(''); setContent('') }}>New Draft</Button>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Your Drafts ({drafts.length}/5)</h3>
            {drafts.map(d => (
              <Card key={d.id} className="cursor-pointer hover:border-primary" onClick={() => selectDraft(d)}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div className="min-w-0"><p className="text-sm font-medium truncate">{d.title || 'Untitled'}</p><p className="text-xs text-muted-foreground">{new Date(d.saved_at).toLocaleDateString()}</p></div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteDraft(d.id) }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </CardContent>
              </Card>
            ))}
            {drafts.length === 0 && <p className="text-sm text-muted-foreground">No drafts yet. Start writing!</p>}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
