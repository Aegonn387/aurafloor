import { create } from "zustand"
import type { PiUser } from "./pi-auth"

export interface ExtendedPiUser extends PiUser {
  subscription?: "free" | "premium"
}

export interface AudioTrack {
  id: string
  title: string
  artist: string
  coverUrl: string
  audioUrl: string
  audioUrls?: {
    preview: string
    standard: string
    hq: string
  }
  duration: number
  price: number
  owned: boolean
  description?: string
  category?: string
  resaleFee?: number // 5-15% creator royalty on secondary sales
  edition?: number
  totalEditions?: number
  streamCount?: number
  adRevenue?: number
  liked?: boolean
  likeCount?: number
}

export interface Post {
  id: string
  author: string
  authorId: string
  role: "creator" | "collector"
  content: string
  timestamp: string
  likes: number
  comments: Comment[]
  linkedNFT?: {
    id: string
    title: string
    coverUrl: string
    price: number
  }
  mediaUrl?: string
  mediaType?: "image" | "audio"
  liked?: boolean
}

export interface Comment {
  id: string
  author: string
  authorId: string
  content: string
  timestamp: string
  likes: number
  liked?: boolean
}

interface AppStore {
  user: ExtendedPiUser | null
  setUser: (user: ExtendedPiUser | null) => void

  // Audio player state
  currentTrack: AudioTrack | null
  isPlaying: boolean
  isMiniPlayer: boolean
  currentStreamUrl: string | null
  currentQuality: "128kbps" | "256kbps" | "320kbps" | null
  setCurrentTrack: (track: AudioTrack) => void
  setIsPlaying: (playing: boolean) => void
  setIsMiniPlayer: (mini: boolean) => void
  setCurrentStreamUrl: (url: string | null, quality: "128kbps" | "256kbps" | "320kbps" | null) => void

  // Community state
  posts: Post[]
  addPost: (post: Post) => void
  togglePostLike: (postId: string) => void
  addComment: (postId: string, comment: Comment) => void
  toggleCommentLike: (postId: string, commentId: string) => void
  sharePost: (postId: string) => void
}

export const useStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  currentTrack: null,
  isPlaying: false,
  isMiniPlayer: true,
  currentStreamUrl: null,
  currentQuality: null,
  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsMiniPlayer: (mini) => set({ isMiniPlayer: mini }),
  setCurrentStreamUrl: (url, quality) => set({ currentStreamUrl: url, currentQuality: quality }),

  posts: [],
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  togglePostLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
          : post,
      ),
    })),
  addComment: (postId, comment) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
      ),
    })),
  toggleCommentLike: (postId, commentId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId
                  ? { ...comment, liked: !comment.liked, likes: comment.liked ? comment.likes - 1 : comment.likes + 1 }
                  : comment,
              ),
            }
          : post,
      ),
    })),
  sharePost: (postId) => {
    // Implementation for sharing
    const post = useStore.getState().posts.find((p) => p.id === postId)
    if (post && navigator.share) {
      navigator.share({
        title: `Post by ${post.author}`,
        text: post.content,
        url: `${window.location.origin}/community?post=${postId}`,
      })
    }
  },
}))
