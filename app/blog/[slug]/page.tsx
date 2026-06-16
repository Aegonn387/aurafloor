"use client"

import { useState, useEffect } from 'react';
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, User, ArrowLeft, Heart, MessageCircle, Eye } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  icon: string;
  gradient: string;
  author: string;
  published_at: string;
}

interface Comment {
  id: number;
  content: string;
  author_id: string;
  created_at: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [readRewarded, setReadRewarded] = useState(false);
  const user = useStore((state) => state.user);

  useEffect(() => { if (slug) fetchPost(); }, [slug]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/blog/${slug}`);
      const data = await res.json();
      if (data.success) setPost(data.post);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!post) return;
    const blogId = `blog_${post.id}`;
    fetch(`/api/community/likes/${blogId}`).then(r => r.json()).then(d => {
      setLiked(d.liked); setLikeCount(d.count || 0);
    }).catch(() => {});
    fetch(`/api/community/comments?postId=${blogId}`).then(r => r.json()).then(d => {
      if (d.comments) setComments(d.comments);
    }).catch(() => {});
    // Send reading reward after 30 seconds on page
    if (!readRewarded) {
      const timer = setTimeout(() => {
        setReadRewarded(true);
        fetch('/.netlify/functions/nft-indexer', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'reward', payload: { user_id: user?.uid || 'reader', category: 'blog_read', amount: 2.5 } })
        }).catch(() => {});
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [post]);

  const toggleLike = async () => {
    const blogId = `blog_${post!.id}`;
    const res = await fetch(`/api/community/likes/${blogId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) { setLiked(data.liked); setLikeCount(data.count); }
      fetch('/.netlify/functions/nft-indexer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reward', payload: { user_id: user?.uid, category: 'blog_like', amount: 0.5 } }) }).catch(() => {});
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    setCommenting(true);
    const res = await fetch('/api/community/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: `blog_${post!.id}`, content: commentText })
    });
    const data = await res.json();
    if (data.success) { setComments(prev => [data.comment, ...prev]); setCommentText(''); }
      fetch('/.netlify/functions/nft-indexer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reward', payload: { user_id: user?.uid, category: 'blog_comment', amount: 5 } }) }).catch(() => {});
    setCommenting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Header /><main className="container px-4 py-6 max-w-4xl mx-auto"><div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /><p className="text-muted-foreground">Loading article...</p></div></main><MobileNav />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Header /><main className="container px-4 py-6 max-w-4xl mx-auto"><Card><CardContent className="p-12 text-center"><h1 className="text-2xl font-bold mb-2">Article Not Found</h1><p className="text-muted-foreground mb-6">This article doesn't exist or has been removed.</p><Link href="/blog"><Button><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Button></Link></CardContent></Card></main><MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Header />
      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <Link href="/blog"><Button variant="ghost" className="gap-2"><ArrowLeft className="w-4 h-4" />Back to Blog</Button></Link>
        <article>
          <Card className="overflow-hidden">
            <div className={`${post.gradient} p-8 sm:p-12 relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10"><div className="absolute -top-20 -right-20 w-60 h-60 bg-white rounded-full blur-3xl"></div></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3"><span className="text-5xl sm:text-6xl">{post.icon}</span><Badge className="bg-black/40 backdrop-blur-md border-white/20">{post.category}</Badge></div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{post.title}</h1>
                <p className="text-lg text-white/90">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-2"><User className="w-4 h-4" />{post.author}</div>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
            </div>
            <CardContent className="p-6 sm:p-8">
              <div className="prose prose-lg max-w-none"><div className="whitespace-pre-wrap text-foreground leading-relaxed">{post.content || 'Full content coming soon...'}</div></div>
              <div className="flex items-center gap-4 pt-8 border-t mt-8">
                <Button variant="outline" onClick={toggleLike} className={`gap-2 ${liked ? 'text-red-500' : ''}`}>
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {likeCount}
                </Button>
                <div className="flex items-center gap-1 text-sm text-muted-foreground"><Eye className="w-4 h-4" /> {readRewarded ? 'Read rewarded' : 'Reading...'}</div>
              </div>
              <div className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Comments ({comments.length})</h3>
                <div className="flex gap-2">
                  <Input placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                  <Button onClick={postComment} disabled={commenting || !commentText.trim()}>Post</Button>
                </div>
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><User className="w-3 h-3" /> {c.author_id?.slice(0,8)}... • {new Date(c.created_at).toLocaleString()}</div>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </article>
        <Card><CardContent className="p-6 text-center"><h3 className="font-bold mb-2">Want to read more?</h3><p className="text-sm text-muted-foreground mb-4">Check out our other articles</p><Link href="/blog"><Button>View All Articles</Button></Link></CardContent></Card>
      </main>
      <MobileNav />
    </div>
  );
}
