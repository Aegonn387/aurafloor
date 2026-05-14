"use client"

import { useState } from 'react';
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Edit3, Users, Award, Coins, Lock } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function ApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    pi_address: '',
    pi_username: '',
    display_name: '',
    bio: '',
    writing_sample: '',
    topics: [] as string[],
  });

  const topicOptions = [
    'Platform Updates', 'Creator Spotlights', 'NFT Guides', 
    'Pi Network News', 'Music Industry', 'Technology',
    'Community Stories', 'Trading Tips', 'Tutorials'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/creators/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) { setSubmitted(true); }
      else { alert(data.error || 'Failed to submit application'); }
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application');
    } finally { setSubmitting(false); }
  };

  const toggleTopic = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Header />
        <main className="container px-4 py-6 max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you for applying. If approved, you'll need to stake <strong>100 AURA</strong> to start writing. We'll review your application soon.
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push('/')} className="w-full">Back to Homepage</Button>
                <Button onClick={() => router.push('/blog')} variant="outline" className="w-full">Read Our Blog</Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <MobileNav />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Become a Content Creator</h1>
          <p className="text-muted-foreground">Stake 100 AURA to join our community of writers and earn rewards</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4 text-center"><Edit3 className="w-8 h-8 mx-auto mb-2 text-primary" /><h3 className="font-semibold mb-1">Write & Earn</h3><p className="text-xs text-muted-foreground">25 AURA per approved post</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Coins className="w-8 h-8 mx-auto mb-2 text-primary" /><h3 className="font-semibold mb-1">Stake 100 AURA</h3><p className="text-xs text-muted-foreground">Required bond to publish</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Award className="w-8 h-8 mx-auto mb-2 text-primary" /><h3 className="font-semibold mb-1">Get Recognized</h3><p className="text-xs text-muted-foreground">Earn creator badge & stats</p></CardContent></Card>
        </div>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm"><p className="font-medium mb-1">100 AURA Stake Required</p><p className="text-muted-foreground">Per the whitepaper, all writers must stake 100 AURA to publish. This bond ensures quality content and is refundable when you stop writing.</p></div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Application Form</CardTitle><CardDescription>Tell us about yourself</CardDescription></CardHeader>
        <CardContent><form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><Label>Pi Username *</Label><Input value={formData.pi_username} onChange={(e) => setFormData({ ...formData, pi_username: e.target.value })} required placeholder="@yourname" /></div><div><Label>Pi Address *</Label><Input value={formData.pi_address} onChange={(e) => setFormData({ ...formData, pi_address: e.target.value })} required placeholder="G..." className="font-mono text-xs" /></div></div>
          <div><Label>Display Name *</Label><Input value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} required placeholder="How you want to be credited" /></div>
          <div><Label>Bio *</Label><Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} required rows={3} placeholder="Tell us about yourself" /></div>
          <div><Label>Writing Sample *</Label><Textarea value={formData.writing_sample} onChange={(e) => setFormData({ ...formData, writing_sample: e.target.value })} required rows={6} placeholder="Write a short sample (200-500 words)" /><p className="text-xs text-muted-foreground mt-1">Show us your writing style</p></div>
          <div><Label>Topics *</Label><div className="flex flex-wrap gap-2 mt-2">{topicOptions.map(topic => <Badge key={topic} variant={formData.topics.includes(topic) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTopic(topic)}>{topic}</Badge>)}</div></div>
          <div className="pt-4"><Button type="submit" disabled={submitting || formData.topics.length === 0} className="w-full">{submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit Application'}</Button></div>
        </form></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg">FAQ</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><p className="font-medium mb-1">Why the 100 AURA stake?</p><p className="text-muted-foreground">Per the whitepaper, writers must stake 100 AURA as a bond. This ensures quality content and discourages spam. Fully refundable when you stop writing.</p></div>
          <div><p className="font-medium mb-1">How much can I earn?</p><p className="text-muted-foreground">25 AURA per approved post, plus engagement rewards from reads (2.5 AURA), likes (0.5 AURA), and comments (5 AURA).</p></div>
          <div><p className="font-medium mb-1">Can I save drafts?</p><p className="text-muted-foreground">Yes! You can save up to 5 drafts and publish when ready.</p></div>
        </CardContent></Card>
      </main>
      <MobileNav />
    </div>
  )
}
