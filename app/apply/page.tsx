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
import { Loader2, CheckCircle2, Edit3, Users, Award } from "lucide-react";
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

      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
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
                Thank you for applying to become a content creator. We'll review your application and get back to you soon.
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push('/')} className="w-full">
                  Back to Homepage
                </Button>
                <Button onClick={() => router.push('/blog')} variant="outline" className="w-full">
                  Read Our Blog
                </Button>
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
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Become a Content Creator</h1>
          <p className="text-muted-foreground">
            Join our community of writers and share your voice with the Aurafloor community
          </p>
        </div>

        {/* Benefits */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Edit3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Write & Share</h3>
              <p className="text-xs text-muted-foreground">Publish articles on Aurafloor blog</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Build Audience</h3>
              <p className="text-xs text-muted-foreground">Connect with readers & creators</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Get Recognized</h3>
              <p className="text-xs text-muted-foreground">Earn creator badge & stats</p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>Tell us about yourself and why you want to write for Aurafloor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pi Network Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pi Username *</Label>
                  <Input
                    value={formData.pi_username}
                    onChange={(e) => setFormData({ ...formData, pi_username: e.target.value })}
                    required
                    placeholder="@yourname"
                  />
                </div>
                <div>
                  <Label>Pi Address *</Label>
                  <Input
                    value={formData.pi_address}
                    onChange={(e) => setFormData({ ...formData, pi_address: e.target.value })}
                    required
                    placeholder="G..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <Label>Display Name *</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  required
                  placeholder="How you want to be credited"
                />
              </div>

              <div>
                <Label>Bio *</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  required
                  rows={3}
                  placeholder="Tell us about yourself (experience, interests, etc.)"
                />
              </div>

              <div>
                <Label>Writing Sample *</Label>
                <Textarea
                  value={formData.writing_sample}
                  onChange={(e) => setFormData({ ...formData, writing_sample: e.target.value })}
                  required
                  rows={6}
                  placeholder="Write a short sample article (200-500 words) on any topic you're passionate about"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Tip: Show us your writing style and expertise
                </p>
              </div>

              <div>
                <Label>Topics You'd Like to Write About *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {topicOptions.map(topic => (
                    <Badge
                      key={topic}
                      variant={formData.topics.includes(topic) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTopic(topic)}
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Selected: {formData.topics.length > 0 ? formData.topics.join(', ') : 'None'}
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting || formData.topics.length === 0}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">How long does review take?</p>
              <p className="text-muted-foreground">Usually 2-3 days. We'll notify you via the platform.</p>
            </div>
            <div>
              <p className="font-medium mb-1">Can I write about anything?</p>
              <p className="text-muted-foreground">Yes! As long as it's relevant to the Aurafloor community and follows our guidelines.</p>
            </div>
            <div>
              <p className="font-medium mb-1">Do I get paid?</p>
              <p className="text-muted-foreground">Currently volunteer-based. Top contributors may receive rewards in the future.</p>
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
