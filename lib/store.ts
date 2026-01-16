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
  resaleFee?: number
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
  // User state
  user: ExtendedPiUser | null
  setUser: (user: ExtendedPiUser | null) => void

  // Audio player state
  currentTrack: AudioTrack | null
  isPlaying: boolean
  isMiniPlayer: boolean
  currentStreamUrl: string | null
  currentQuality: "128kbps" | "256kbps" | "320kbps" | null
  audioElement: HTMLAudioElement | null
  progress: number
  streamStatus: "idle" | "loading" | "buffering" | "ready" | "error"
  error: string | null
  volume: number
  isMuted: boolean
  repeat: boolean
  shuffle: boolean
  showInfo: boolean
  
  // Queue management
  queue: AudioTrack[]
  
  // Stream analytics
  streamLogged: boolean
  adPlaying: boolean
  playedAds: number[]
  
  // Liked tracks
  likedTracks: Set<string>

  // Setters
  setCurrentTrack: (track: AudioTrack | null) => void
  setIsPlaying: (playing: boolean) => void
  setIsMiniPlayer: (mini: boolean) => void
  setCurrentStreamUrl: (url: string | null, quality: "128kbps" | "256kbps" | "320kbps" | null) => void
  setAudioElement: (audio: HTMLAudioElement | null) => void
  setProgress: (progress: number) => void
  setStreamStatus: (status: "idle" | "loading" | "buffering" | "ready" | "error") => void
  setError: (error: string | null) => void
  setVolume: (volume: number) => void
  setIsMuted: (muted: boolean) => void
  setRepeat: (repeat: boolean) => void
  setShuffle: (shuffle: boolean) => void
  setShowInfo: (show: boolean) => void
  setQueue: (queue: AudioTrack[]) => void
  setStreamLogged: (logged: boolean) => void
  setAdPlaying: (playing: boolean) => void
  setPlayedAds: (ads: number[]) => void
  
  // Actions
  addToQueue: (track: AudioTrack) => void
  removeFromQueue: (trackId: string) => void
  clearQueue: () => void
  playNext: () => void
  playPrevious: () => void
  seekTo: (progress: number) => void
  addPlayedAd: (adTime: number) => void
  toggleLike: (trackId: string) => void
  isLiked: (trackId: string) => boolean

  // Community state
  posts: Post[]
  feedPosts: Post[]
  setPosts: (posts: Post[]) => void
  setFeedPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  togglePostLike: (postId: string) => void
  addComment: (postId: string, comment: Comment) => void
  toggleCommentLike: (postId: string, commentId: string) => void
  sharePost: (postId: string) => void
}

export const useStore = create<AppStore>((set, get) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),

  // Audio player state
  currentTrack: null,
  isPlaying: false,
  isMiniPlayer: true,
  currentStreamUrl: null,
  currentQuality: null,
  audioElement: null,
  progress: 0,
  streamStatus: "idle",
  error: null,
  volume: 80,
  isMuted: false,
  repeat: false,
  shuffle: false,
  showInfo: false,
  
  // Queue management
  queue: [],
  
  // Stream analytics
  streamLogged: false,
  adPlaying: false,
  playedAds: [],
  
  // Liked tracks
  likedTracks: new Set(),

  // Setters
  setCurrentTrack: (track) => set({ 
    currentTrack: track,
    isPlaying: track !== null,
    progress: 0,
    streamStatus: track ? "loading" : "idle"
  }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsMiniPlayer: (mini) => set({ isMiniPlayer: mini }),
  
  setCurrentStreamUrl: (url, quality) => set({ 
    currentStreamUrl: url,
    currentQuality: quality 
  }),
  
  setAudioElement: (audio) => set({ audioElement: audio }),
  setProgress: (progress) => set({ progress }),
  setStreamStatus: (status) => set({ streamStatus: status }),
  setError: (error) => set({ error }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setRepeat: (repeat) => set({ repeat }),
  setShuffle: (shuffle) => set({ shuffle }),
  setShowInfo: (show) => set({ showInfo: show }),
  setQueue: (queue) => set({ queue }),
  setStreamLogged: (logged) => set({ streamLogged: logged }),
  setAdPlaying: (playing) => set({ adPlaying: playing }),
  setPlayedAds: (ads) => set({ playedAds: ads }),

  // Actions
  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),
    
  removeFromQueue: (trackId) =>
    set((state) => ({ 
      queue: state.queue.filter(track => track.id !== trackId) 
    })),
    
  clearQueue: () => set({ queue: [] }),
  
  playNext: () => {
    const { queue, currentTrack, setCurrentTrack } = get()
    if (queue.length === 0 || !currentTrack) return
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack.id)
    if (currentIndex === -1 || currentIndex === queue.length - 1) return
    
    const nextTrack = queue[currentIndex + 1]
    setCurrentTrack(nextTrack)
  },
  
  playPrevious: () => {
    const { queue, currentTrack, setCurrentTrack } = get()
    if (queue.length === 0 || !currentTrack) return
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack.id)
    if (currentIndex <= 0) return
    
    const prevTrack = queue[currentIndex - 1]
    setCurrentTrack(prevTrack)
  },
  
  seekTo: (progress) => {
    const { audioElement } = get()
    if (audioElement && !isNaN(audioElement.duration)) {
      audioElement.currentTime = (progress / 100) * audioElement.duration
    }
    set({ progress })
  },
  
  addPlayedAd: (adTime) =>
    set((state) => ({ playedAds: [...state.playedAds, adTime] })),
    
  toggleLike: (trackId) =>
    set((state) => {
      const newLikedTracks = new Set(state.likedTracks)
      if (newLikedTracks.has(trackId)) {
        newLikedTracks.delete(trackId)
      } else {
        newLikedTracks.add(trackId)
      }
      return { likedTracks: newLikedTracks }
    }),
    
  isLiked: (trackId) => {
    return get().likedTracks.has(trackId)
  },

  // Community state
  posts: [],
  feedPosts: [],
  setPosts: (posts) => set({ posts }),
  setFeedPosts: (posts) => set({ feedPosts: posts }),
  
  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts]
    })),
    
  togglePostLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1
            }
          : post
      )
    })),
    
  addComment: (postId, comment) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, comment]
            }
          : post
      )
    })),
    
  toggleCommentLike: (postId, commentId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      liked: !comment.liked,
                      likes: comment.liked ? comment.likes - 1 : comment.likes + 1
                    }
                  : comment
              )
            }
          : post
      )
    })),
    
  sharePost: (postId) => {
    const post = get().posts.find((p) => p.id === postId)
    if (post && typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Post by ${post.author}`,
        text: post.content,
        url: `${window.location.origin}/community?post=${postId}`
      })
    }
  }
}))
