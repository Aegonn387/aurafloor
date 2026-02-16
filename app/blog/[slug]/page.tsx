"use client"

import { useState, useEffect } from 'react';
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, User, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';

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

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();
      if (data.success) {
        setPost(data.post);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Header />
        <main className="container px-4 py-6 max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading article...</p>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Header />
        <main className="container px-4 py-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
              <p className="text-muted-foreground mb-6">This article doesn't exist or has been removed.</p>
              <Link href="/blog">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
              </Link>
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

      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Button>
        </Link>

        {/* Article */}
        <article>
          {/* Header with Gradient */}
          <Card className="overflow-hidden">
            <div className={`${post.gradient} p-8 sm:p-12 relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white rounded-full blur-3xl"></div>
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-5xl sm:text-6xl">{post.icon}</span>
                  <Badge className="bg-black/40 backdrop-blur-md border-white/20">
                    {post.category}
                  </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {post.title}
                </h1>
                <p className="text-lg text-white/90">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-6 sm:p-8">
              {post.content ? (
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {post.content}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Full content coming soon...</p>
                </div>
              )}

              {/* Share Button */}
              <div className="pt-8 border-t mt-8">
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Article
                </Button>
              </div>
            </CardContent>
          </Card>
        </article>

        {/* Back to Blog CTA */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="font-bold mb-2">Want to read more?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Check out our other articles and stay updated with Aurafloor
            </p>
            <Link href="/blog">
              <Button>View All Articles</Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
