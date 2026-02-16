"use client"

import { useState, useEffect } from 'react';
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, ExternalLink } from "lucide-react";

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
  action_text: string;
  action_link: string;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
}

const categories = ['Spotlight', 'Announcement', 'Recognition', 'Education', 'Community', 'Tips', 'Music', 'Events', 'Tutorial', 'Trending'];
const gradients = [
  { name: 'Purple to Pink', value: 'bg-gradient-to-r from-purple-600 to-pink-500' },
  { name: 'Blue to Cyan', value: 'bg-gradient-to-r from-blue-600 to-cyan-500' },
  { name: 'Green to Emerald', value: 'bg-gradient-to-r from-green-600 to-emerald-500' },
  { name: 'Orange to Red', value: 'bg-gradient-to-r from-orange-600 to-red-500' },
  { name: 'Indigo to Violet', value: 'bg-gradient-to-r from-indigo-600 to-violet-500' },
  { name: 'Amber to Yellow', value: 'bg-gradient-to-r from-amber-600 to-yellow-500' },
  { name: 'Rose to Pink', value: 'bg-gradient-to-r from-rose-600 to-pink-500' },
  { name: 'Teal to Green', value: 'bg-gradient-to-r from-teal-600 to-green-500' },
];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Announcement',
    icon: '📝',
    gradient: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    is_published: false,
    is_featured: false,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog');
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const url = editingPost 
        ? `/api/admin/blog/${editingPost.id}`
        : '/api/admin/blog';
      
      const method = editingPost ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsDialogOpen(false);
        resetForm();
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to save post:', error);
      alert('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content || '',
      category: post.category,
      icon: post.icon,
      gradient: post.gradient,
      is_published: post.is_published,
      is_featured: post.is_featured,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: 'Announcement',
      icon: '📝',
      gradient: 'bg-gradient-to-r from-blue-600 to-cyan-500',
      is_published: false,
      is_featured: false,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 py-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Blog Admin</h1>
            <p className="text-muted-foreground">Manage carousel blog posts</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Carousel button will link to: /blog/{formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
                  </p>
                </div>

                <div>
                  <Label>Short Description (Shows on carousel) *</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    required
                    placeholder="Brief description for the carousel card"
                  />
                </div>

                <div>
                  <Label>Full Content (Shows on blog page)</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    placeholder="Write the full blog post content here. Include links to featured creators, marketplace items, etc."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Tip: Add links to featured content here (e.g., creator profiles, marketplace items)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 bg-background"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Icon (Emoji)</Label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <Label>Gradient</Label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-background"
                    value={formData.gradient}
                    onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                  >
                    {gradients.map(grad => (
                      <option key={grad.value} value={grad.value}>{grad.name}</option>
                    ))}
                  </select>
                  <div className={`mt-2 h-16 rounded-lg ${formData.gradient}`}></div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label>Published</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label>Featured (Show in Carousel)</Label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingPost ? 'Update' : 'Create'}</>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-lg ${post.gradient} flex items-center justify-center text-3xl flex-shrink-0`}>
                      {post.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{post.title}</h3>
                        <Badge variant="outline">{post.category}</Badge>
                        {post.is_published && <Badge className="bg-green-600">Published</Badge>}
                        {post.is_featured && <Badge className="bg-purple-600">Featured</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{post.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Carousel links to: {post.action_link}</span>
                        <a href={post.action_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
