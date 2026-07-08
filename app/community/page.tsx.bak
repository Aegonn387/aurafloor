"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TipModal } from "@/components/tip-modal";
import { ReportModal } from "@/components/report-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import type { Post, Comment } from "@/lib/store";
import {
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Link2,
  Send,
  TrendingUp,
  Clock,
  Coins,
  Play,
  MoreVertical,
  Flag,
  Loader2,
  Check,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export const runtime = 'nodejs';

export default function CommunityPage() {
  const [postContent, setPostContent] = useState("");
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<string>("");
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<{ name: string; track: string } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<{ id: string; title: string } | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNFTs, setUserNFTs] = useState<Array<{id: string, title: string, artist: string}>>([]);

  // UI feedback states
  const [creatingPost, setCreatingPost] = useState(false);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [commentingPosts, setCommentingPosts] = useState<Set<string>>(new Set());
  const [sharingPosts, setSharingPosts] = useState<Set<string>>(new Set());

  // Edit post states
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const user = useStore((state) => state.user);
  const currentTrack = useStore((state) => state.currentTrack);
  const setCurrentTrack = useStore((state) => state.setCurrentTrack);
  const { toast } = useToast();
  useEffect(() => {
    fetchPosts();
    if (user?.piuser) {
      fetchUserNFTs();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/posts');
      if (response.ok) {
        const data = await response.json();
        const postsArray = data.posts || [];
        const transformedPosts: Post[] = postsArray.map((post: any) => ({
          id: post.id,
          author: post.author_name || post.author || "Unknown",
          authorId: post.author_id,
          role: post.role || "collector",
          content: post.content,
          timestamp: formatTimeAgo(post.created_at),
          likes: Number(post.like_count) || 0,
          comments: post.comments || [],
          linkedNFT: post.linked_nft_id ? {
            id: post.linked_nft_id,
            title: post.nft_title || "Untitled NFT",
            coverUrl: post.nft_cover_url || "/placeholder.svg?height=300&width=300",
            price: post.nft_price || 0
          } : undefined,
          liked: post.liked || false
        }));
        setPosts(transformedPosts);
      } else {
        console.error("Failed to fetch posts:", await response.text());
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNFTs = async () => {
    if (!user?.piuser) return;
    try {
      const response = await fetch(`/api/user/${user.piuser}/nfts`);
      if (response.ok) {
        const data = await response.json();
        setUserNFTs(data);
      }
    } catch (error) {
      console.error("Failed to fetch user NFTs:", error);
    }
  };

  const handleTip = (artistName: string, trackTitle: string) => {
    setSelectedArtist({ name: artistName, track: trackTitle });
    setTipModalOpen(true);
  };

  const handlePlayNFT = async (post: Post) => {
    if (!post.linkedNFT) return;
    try {
      const response = await fetch(`/api/nft/${post.linkedNFT.id}`);
      if (response.ok) {
        const nft = await response.json();
        setCurrentTrack({
          id: nft.id,
          title: nft.title,
          artist: post.author,
          coverUrl: nft.cover_url || nft.coverUrl,
          audioUrl: nft.audio_url || nft.file_url,
          duration: nft.duration,
          price: nft.price,
          owned: false
        });
      }
    } catch (error) {
      console.error("Failed to play NFT:", error);
    }
  };

  const handleReport = (postId: string, postAuthor: string) => {
    setReportData({ id: postId, title: `Post by ${postAuthor}` });
    setReportModalOpen(true);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;
    setCreatingPost(true);
    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent,
          linkedNFTId: selectedNFT || null,
          uid: user.piuser,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const newPost = data.post || data;
        const postToAdd: Post = {
          id: newPost.id,
          author: user.dname || user.piuser || "User",
          authorId: user.piuser || "",
          role: "collector",
          content: newPost.content,
          timestamp: "Just now",
          likes: 0,
          comments: [],
          linkedNFT: selectedNFT ? {
            id: selectedNFT,
            title: userNFTs.find(nft => nft.id === selectedNFT)?.title || "NFT",
            coverUrl: "/placeholder.svg?height=300&width=300",
            price: 0
          } : undefined,
          liked: false
        };
        setPosts([postToAdd, ...posts]);
        setPostContent("");
        setSelectedNFT("");
        setCreatePostOpen(false);
        toast({ title: "Success", description: "Post created!" });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditDialogOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editContent.trim() || !user) return;
    try {
      const response = await fetch(`/api/community/posts/${editingPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          uid: user.piuser,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setPosts(posts.map(p => p.id === editingPost.id ? { ...p, content: updated.content } : p));
        setEditDialogOpen(false);
        setEditingPost(null);
        setEditContent("");
        toast({ title: "Success", description: "Post updated!" });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update post");
      }
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("Failed to update post");
    }
  };

  const handleDeleteClick = (postId: string) => {
    setDeletingPostId(postId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPostId || !user) return;
    try {
      const response = await fetch(`/api/community/posts/${deletingPostId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.piuser }),
      });
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== deletingPostId));
        toast({ title: "Success", description: "Post deleted." });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingPostId(null);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content || !user) return;
    setCommentingPosts(prev => new Set(prev).add(postId));
    try {
      const response = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, uid: user.piuser }),
      });
      if (response.ok) {
        const newComment = await response.json();
        setPosts(posts.map(post => {
          if (post.id === postId) {
            const commentToAdd: Comment = {
              id: newComment.id,
              author: user.dname || user.piuser || "User",
              authorId: user.piuser || "",
              content: newComment.content,
              timestamp: "Just now",
              likes: 0,
              liked: false
            };
            return { ...post, comments: [...post.comments, commentToAdd] };
          }
          return post;
        }));
        setCommentInputs({ ...commentInputs, [postId]: "" });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment");
    } finally {
      setCommentingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleLike = async (postId: string) => {
    if (!user?.piuser) {
      alert("Please sign in to like posts");
      return;
    }
    setLikingPosts(prev => new Set(prev).add(postId));
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const wasLiked = post.liked;
      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            liked: !wasLiked,
            likes: wasLiked ? p.likes - 1 : p.likes + 1
          };
        }
        return p;
      }));
      const response = await fetch(`/api/community/likes/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.piuser })
      });
      if (!response.ok) {
        // Revert on error
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              liked: wasLiked,
              likes: wasLiked ? p.likes + 1 : p.likes - 1
            };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    } finally {
      setLikingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleShare = async (post: Post) => {
    setSharingPosts(prev => new Set(prev).add(post.id));
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.author}`,
          text: post.content,
          url: `${window.location.origin}/community?post=${post.id}`,
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`);
        toast({ title: "Link copied!", description: "Post URL copied to clipboard." });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Share failed:", error);
      }
    } finally {
      setTimeout(() => {
        setSharingPosts(prev => {
          const next = new Set(prev);
          next.delete(post.id);
          return next;
        });
      }, 500);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container px-4 py-6">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading community posts...</p>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Hub</h1>
            <p className="text-muted-foreground">Connect with creators and collectors</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/blog">
                <BookOpen className="w-4 h-4 mr-2" />
                Read Blog
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/write">
                <Pencil className="w-4 h-4 mr-2" />
                Write Blog
              </Link>
            </Button>
            <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
              <DialogTrigger asChild>
                <Button>Create Post</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">What's on your mind?</Label>
                    <Textarea
                      id="content"
                      placeholder="Share your thoughts, updates, or latest creations..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nft-link">Link an NFT (Optional)</Label>
                    <Select value={selectedNFT} onValueChange={setSelectedNFT}>
                      <SelectTrigger id="nft-link">
                        <SelectValue placeholder="Select an NFT from your collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {userNFTs.length > 0 ? (
                          userNFTs.map((nft) => (
                            <SelectItem key={nft.id} value={nft.id}>{nft.title}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none">No NFTs available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setCreatePostOpen(false)} disabled={creatingPost}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost} disabled={!postContent.trim() || creatingPost}>
                      {creatingPost ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-1" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-sm text-muted-foreground">Be the first to share something with the community!</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{post.author}</p>
                          <Badge variant={post.role === "creator" ? "default" : "secondary"} className="text-xs">
                            {post.role === "creator" ? "Creator" : "Collector"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{post.timestamp}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleTip(post.author, post.linkedNFT?.title || "Post")}>
                        <Coins className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleReport(post.id, post.author)}>
                            <Flag className="w-4 h-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                          {user?.piuser === post.authorId && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClick(post.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">{post.content}</p>

                    {post.linkedNFT && (
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={post.linkedNFT.coverUrl || "/placeholder.svg"} alt={post.linkedNFT.title} className="w-full h-full object-cover" />
                              <Button size="icon" variant="secondary" className="absolute inset-0 w-full h-full bg-black/40 hover:bg-black/60" onClick={() => handlePlayNFT(post)}>
                                <Play className="w-5 h-5 text-white" />
                              </Button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link href={`/nft/${post.linkedNFT.id}`} className="hover:underline">
                                <p className="font-semibold text-sm truncate">{post.linkedNFT.title}</p>
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{post.linkedNFT.price}π</Badge>
                                <Link href={`/nft/${post.linkedNFT.id}`}>
                                  <Button size="sm" variant="link" className="h-auto p-0 text-xs">
                                    View NFT<Link2 className="w-3 h-3 ml-1" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex items-center gap-4 pt-2 border-t">
                      <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleLike(post.id)} disabled={likingPosts.has(post.id)}>
                        {likingPosts.has(post.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className={`w-4 h-4 transition-all ${post.liked ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                        )}
                        <span className="text-xs">{post.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setExpandedComments({ ...expandedComments, [post.id]: !expandedComments[post.id] })}>
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">{post.comments.length}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2 ml-auto" onClick={() => handleShare(post)} disabled={sharingPosts.has(post.id)}>
                        {sharingPosts.has(post.id) ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                        <span className="text-xs">Share</span>
                      </Button>
                    </div>

                    {expandedComments[post.id] && (
                      <div className="space-y-4 pt-4 border-t">
                        {post.comments.length > 0 && (
                          <div className="space-y-3">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-muted text-xs">{comment.author[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-muted rounded-lg p-3">
                                    <p className="font-semibold text-sm">{comment.author}</p>
                                    <p className="text-sm mt-1">{comment.content}</p>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 px-2">
                                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            disabled={commentingPosts.has(post.id)}
                          />
                          <Button size="sm" onClick={() => handleAddComment(post.id)} disabled={!commentInputs[post.id]?.trim() || commentingPosts.has(post.id)}>
                            {commentingPosts.has(post.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4 mt-6">
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trending Posts</h3>
                <p className="text-sm text-muted-foreground">Popular posts from the community will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="following" className="space-y-4 mt-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Following Feed</h3>
                <p className="text-sm text-muted-foreground">Posts from creators you follow will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Post Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                placeholder="Edit your post..."
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePost} disabled={!editContent.trim()}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
            </DialogHeader>
            <p className="py-4">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <MobileNav />

        {selectedArtist && (
          <TipModal
            open={tipModalOpen}
            onOpenChange={setTipModalOpen}
            artistName={selectedArtist.name}
            trackTitle={selectedArtist.track}
          />
        )}

        {reportData && (
          <ReportModal
            open={reportModalOpen}
            onOpenChange={setReportModalOpen}
            contentType="post"
            contentId={reportData.id}
            contentTitle={reportData.title}
          />
        )}
      </main>
    </div>
  );
}
