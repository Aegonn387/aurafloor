"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TipModal } from "@/components/tip-modal"
import { ReportModal } from "@/components/report-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { mockTracks } from "@/lib/mock-data"
import type { Post, Comment } from "@/lib/store"
import {
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Link2,
  ImageIcon,
  Send,
  TrendingUp,
  Clock,
  Coins,
  Play,
  MoreVertical,
  Flag,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

const mockPosts: Post[] = [
  {
    id: "1",
    author: "Luna Wave",
    authorId: "user1",
    role: "creator",
    content:
      "Just dropped my latest ambient track! This one took 3 months to perfect. Hope you all enjoy the journey 🎵",
    timestamp: "2 hours ago",
    likes: 124,
    comments: [],
    linkedNFT: {
      id: "1",
      title: "Midnight Dreams",
      coverUrl: "/placeholder.svg?height=300&width=300",
      price: 5.5,
    },
    liked: false,
  },
  {
    id: "2",
    author: "Beat Maker Pro",
    authorId: "user2",
    role: "creator",
    content: "Behind the scenes of my creative process. What's your favorite part of music production?",
    timestamp: "5 hours ago",
    likes: 89,
    comments: [],
    mediaUrl: "/placeholder.svg?height=400&width=600",
    mediaType: "image",
    liked: false,
  },
]

export default function CommunityPage() {
  const [postContent, setPostContent] = useState("")
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<string>("")
  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<{ name: string; track: string } | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportData, setReportData] = useState<{ id: string; title: string } | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})

  const user = useStore((state) => state.user)
  const currentTrack = useStore((state) => state.currentTrack)
  const setCurrentTrack = useStore((state) => state.setCurrentTrack)

  const posts = useStore((state) => state.posts)
  const addPost = useStore((state) => state.addPost)
  const togglePostLike = useStore((state) => state.togglePostLike)
  const addComment = useStore((state) => state.addComment)
  const toggleCommentLike = useStore((state) => state.toggleCommentLike)
  const sharePost = useStore((state) => state.sharePost)

  // Initialize with mock posts if empty
  const displayPosts = posts.length > 0 ? posts : mockPosts

  const handleTip = (artistName: string, trackTitle: string) => {
    setSelectedArtist({ name: artistName, track: trackTitle })
    setTipModalOpen(true)
  }

  const handlePlayNFT = (nft: Post["linkedNFT"]) => {
    if (!nft) return
    const track = mockTracks.find((t) => t.id === nft.id)
    if (track) {
      setCurrentTrack(track)
    }
  }

  const handleReport = (postId: string, postAuthor: string) => {
    setReportData({ id: postId, title: `Post by ${postAuthor}` })
    setReportModalOpen(true)
  }

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return

    const newPost: Post = {
      id: crypto.randomUUID(),
      author: user.username,
      authorId: user.uid,
      role: user.role || "collector",
      content: postContent,
      timestamp: "Just now",
      likes: 0,
      comments: [],
      linkedNFT: selectedNFT ? mockTracks.find((t) => t.id === selectedNFT) : undefined,
      liked: false,
    }

    try {
      // Call API to create post
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          username: user.username,
          role: user.role,
          content: postContent,
          linkedNFTId: selectedNFT || null,
        }),
      })

      if (response.ok) {
        addPost(newPost)
        setPostContent("")
        setSelectedNFT("")
        setCreatePostOpen(false)
      }
    } catch (error) {
      console.error("[v0] Failed to create post:", error)
    }
  }

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content || !user) return

    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: user.username,
      authorId: user.uid,
      content,
      timestamp: "Just now",
      likes: 0,
      liked: false,
    }

    try {
      const response = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          userId: user.uid,
          username: user.username,
          content,
        }),
      })

      if (response.ok) {
        addComment(postId, newComment)
        setCommentInputs({ ...commentInputs, [postId]: "" })
      }
    } catch (error) {
      console.error("[v0] Failed to add comment:", error)
    }
  }

  const handleLike = (postId: string) => {
    togglePostLike(postId)
    // In production: Call API to persist like
  }

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author}`,
          text: post.content,
          url: `${window.location.origin}/community?post=${post.id}`,
        })
      } catch (error) {
        console.error("[v0] Share failed:", error)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`)
      alert("Link copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Hub</h1>
            <p className="text-muted-foreground">Connect with creators and collectors</p>
          </div>
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
                      {mockTracks
                        .filter((t) => t.owned || user?.role === "creator")
                        .map((track) => (
                          <SelectItem key={track.id} value={track.id}>
                            {track.title} - {track.artist}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" disabled>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Media
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" disabled>
                    <Music2 className="w-4 h-4 mr-2" />
                    Add Clip
                  </Button>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setCreatePostOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePost} disabled={!postContent.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
            {displayPosts.map((post) => (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTip(post.author, post.linkedNFT?.title || "Post")}
                    >
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
                          Report Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{post.content}</p>

                  {post.mediaUrl && post.mediaType === "image" && (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={post.mediaUrl || "/placeholder.svg"} alt="Post media" className="w-full h-auto" />
                    </div>
                  )}

                  {post.linkedNFT && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={post.linkedNFT.coverUrl || "/placeholder.svg"}
                              alt={post.linkedNFT.title}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              size="icon"
                              variant="secondary"
                              className="absolute inset-0 w-full h-full bg-black/40 hover:bg-black/60"
                              onClick={() => handlePlayNFT(post.linkedNFT)}
                            >
                              <Play className="w-5 h-5 text-white" />
                            </Button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/nft/${post.linkedNFT.id}`} className="hover:underline">
                              <p className="font-semibold text-sm truncate">{post.linkedNFT.title}</p>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {post.linkedNFT.price}π
                              </Badge>
                              <Link href={`/nft/${post.linkedNFT.id}`}>
                                <Button size="sm" variant="link" className="h-auto p-0 text-xs">
                                  View NFT
                                  <Link2 className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleLike(post.id)}>
                      <Heart className={`w-4 h-4 ${post.liked ? "fill-red-500 text-red-500" : ""}`} />
                      <span className="text-xs">{post.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        setExpandedComments({ ...expandedComments, [post.id]: !expandedComments[post.id] })
                      }
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs">{post.comments.length}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 ml-auto" onClick={() => handleShare(post)}>
                      <Share2 className="w-4 h-4" />
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
                                  <button
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                    onClick={() => toggleCommentLike(post.id, comment.id)}
                                  >
                                    <Heart className={`w-3 h-3 ${comment.liked ? "fill-red-500 text-red-500" : ""}`} />
                                    {comment.likes > 0 && comment.likes}
                                  </button>
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
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleAddComment(post.id)
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
      </main>

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
    </div>
  )
}
