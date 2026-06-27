import { create } from "zustand"
export interface PiUser {
  uid: string
  username: string
  accessToken: string
}

export interface ExtendedPiUser extends PiUser {
  role?: "creator" | "collector"
  subscription?: { tier: string; plan?: string }
  // Add database fields from u table
  dname?: string
  piuser?: string
  piaddr?: string
  walletAddress?: string  // Alias for piaddr (Pi Network address) - auto-populated from piaddr
  avatar?: string
  bio?: string
  email?: string
  subtier?: string
  stellar_public_key?: string
}

// ======================
// DATABASE-ALIGNED INTERFACES
// ======================

// Matches your 'n' table structure
export interface DatabaseNFT {
  // Core identifiers (from 'n' table)
  id: string                     // n.id (UUID primary key)
  bnid?: string                 // n.bnid (blockchain token ID)
  crid?: string                 // n.crid (creator ID)
  ownerid?: string              // n.ownerid (owner ID)

  // Content (from 'n' table)
  title: string                 // n.title
  descr?: string               // n.descr
  genre?: string               // n.genre
  dur?: number                 // n.dur (duration in seconds)

  // Audio files (from 'n' table)
  aprev?: string               // n.aprev (preview audio URL)
  astd?: string                // n.astd (standard audio URL)
  ahq?: string                 // n.ahq (HQ audio URL)
  aipfs?: string               // n.aipfs (audio IPFS hash)

  // Cover/image (from 'n' table)
  cimg?: string                // n.cimg (cover image URL)
  cipfs?: string               // n.cipfs (cover IPFS hash)

  // Metadata (from 'n' table)
  meta?: any                   // n.meta (JSONB metadata)
  etype?: string               // n.etype (edition type)
  ted?: number                 // n.ted (total editions)

  // Stats (from 'n' table)
  scount: number               // n.scount (stream count)
  pcount: number               // n.pcount (purchase count)
  lcount: number               // n.lcount (like count)

  // Financial (from 'n' table)
  price: number                // n.price
  royalty: number              // n.royalty

  // Status (from 'n' table)
  st: string                   // n.st (status: 'active', 'inactive', etc.)
  bcsync?: string              // n.bcsync (blockchain sync timestamp)

  // Timestamps (from 'n' table)
  ca: string                   // n.ca (created_at)
  ua: string                   // n.ua (updated_at)
}

// Matches your 'u' table structure
export interface DatabaseUser {
  id: string                   // u.id
  piuser: string               // u.piuser
  piaddr: string               // u.piaddr
  dname?: string               // u.dname
  bio?: string                 // u.bio
  avatar?: string              // u.avatar
  email?: string               // u.email
  role: string                 // u.role
  stellar_public_key?: string  // u.stellar_public_key
}

// ======================
// APP INTERFACES (UPDATED)
// ======================

export interface AudioTrack {
  // Core player fields (keep existing for compatibility)
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
  royalty?: number
  edition?: number
  totalEditions?: number
  streamCount?: number
  adRevenue?: number
  liked?: boolean
  likeCount?: number
  quality?: 'preview' | 'standard' | 'hq'
  nftData?: any
  image?: string
  plays?: number

  // Existing blockchain fields (keep for backward compatibility)
  blockchain?: string
  contractAddress?: string
  tokenId?: string
  txHash?: string
  mintDate?: string
  creatorWallet?: string
  ipfsHash?: string
  explorerUrl?: string

  // NEW: Real database fields from your 'n' table
  // These will be populated by your API calls
  databaseId?: string           // From n.id (UUID)
  blockchainNftId?: string      // From n.bnid (Pi Network token ID)
  creatorId?: string            // From n.crid
  ownerId?: string             // From n.ownerid
  audioPreviewUrl?: string     // From n.aprev
  audioStandardUrl?: string    // From n.astd
  audioHqUrl?: string         // From n.ahq
  audioIpfsHash?: string      // From n.aipfs
  coverImageUrl?: string      // From n.cimg (same as coverUrl, but separate for clarity)
  coverIpfsHash?: string      // From n.cipfs
  nftMetadata?: any           // From n.meta (JSONB)
  nftStatus?: string          // From n.st
  blockchainSyncedAt?: string // From n.bcsync
  purchaseCount?: number      // From n.pcount
  streamCountDb?: number      // From n.scount (duplicate of streamCount, but explicit)
  likeCountDb?: number        // From n.lcount (duplicate of likeCount, but explicit)
  durationSeconds?: number    // From n.dur (duplicate of duration, but explicit)
  genre?: string             // From n.genre (duplicate of category, but explicit)
  editionType?: string       // From n.etype
  totalEditionsDb?: number   // From n.ted (duplicate of totalEditions, but explicit)
  created_at?: string        // From n.ca
  updated_at?: string        // From n.ua

  // Helper method for getting audio URL by quality
  getAudioUrl?: (quality: 'preview' | 'standard' | 'hq') => string
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

// ======================
// HELPER FUNCTIONS
// ======================

// Convert DatabaseNFT to AudioTrack
export function convertDatabaseNFTToTrack(
  nft: DatabaseNFT,
  creator?: DatabaseUser,
  owner?: DatabaseUser,
  isOwned: boolean = false
): AudioTrack {
  return {
    // Core fields
    id: nft.bnid || nft.id,
    title: nft.title,
    artist: creator?.dname || 'Unknown Artist',
    coverUrl: nft.cimg || '/placeholder.svg',
    audioUrl: nft.aprev || nft.astd || '',
    audioUrls: {
      preview: nft.aprev || '',
      standard: nft.astd || '',
      hq: nft.ahq || '',
    },
    duration: nft.dur || 180,
    price: nft.price,
    owned: isOwned,

    // Descriptive fields
    description: nft.descr,
    category: nft.genre,
    royalty: nft.royalty,

    // Stats
    streamCount: nft.scount,
    likeCount: nft.lcount,
    purchaseCount: nft.pcount,

    // Edition info
    editionType: nft.etype,
    totalEditions: nft.ted,

    // Blockchain data
    tokenId: nft.bnid,
    creatorWallet: creator?.piaddr,
    creatorId: nft.crid,
    ownerId: nft.ownerid,
    ipfsHash: nft.aipfs || nft.cipfs,
    nftStatus: nft.st,

    // Database-specific fields
    databaseId: nft.id,
    blockchainNftId: nft.bnid,
    audioPreviewUrl: nft.aprev,
    audioStandardUrl: nft.astd,
    audioHqUrl: nft.ahq,
    audioIpfsHash: nft.aipfs,
    coverImageUrl: nft.cimg,
    coverIpfsHash: nft.cipfs,
    nftMetadata: nft.meta,
    blockchainSyncedAt: nft.bcsync,
    streamCountDb: nft.scount,
    likeCountDb: nft.lcount,
    durationSeconds: nft.dur,
    genre: nft.genre,
    edition: nft.ted,
    totalEditionsDb: nft.ted,
    created_at: nft.ca,
    updated_at: nft.ua,

    // Helper method
    getAudioUrl: (quality: 'preview' | 'standard' | 'hq' = 'standard') => {
      switch(quality) {
        case 'preview': return nft.aprev || '';
        case 'hq': return nft.ahq || '';
        default: return nft.astd || '';
      }
    }
  };
}

// Convert AudioTrack to DatabaseNFT (for updates)
export function convertTrackToDatabaseNFT(track: AudioTrack): Partial<DatabaseNFT> {
  return {
    id: track.databaseId || track.id,
    bnid: track.blockchainNftId || track.tokenId,
    title: track.title,
    descr: track.description,
    genre: track.genre || track.category,
    dur: track.durationSeconds || track.duration,
    aprev: track.audioPreviewUrl || track.audioUrls?.preview,
    astd: track.audioStandardUrl || track.audioUrls?.standard,
    ahq: track.audioHqUrl || track.audioUrls?.hq,
    aipfs: track.audioIpfsHash,
    cimg: track.coverImageUrl || track.coverUrl,
    cipfs: track.coverIpfsHash,
    meta: track.nftMetadata || track.nftData,
    etype: track.editionType,
    ted: track.totalEditionsDb || track.totalEditions,
    scount: track.streamCountDb || track.streamCount || 0,
    pcount: track.purchaseCount || 0,
    lcount: track.likeCountDb || track.likeCount || 0,
    price: track.price,
    royalty: track.royalty || 10,
    st: track.nftStatus || 'active'
  };
}

// ======================
// ZUSTAND STORE
// ======================

interface AppStore {
  user: ExtendedPiUser | null
  setUser: (user: ExtendedPiUser | null) => void

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
  queue: AudioTrack[]
  streamLogged: boolean
  adPlaying: boolean
  playedAds: number[]
  likedTracks: Set<string>

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

  addToQueue: (track: AudioTrack) => void
  removeFromQueue: (trackId: string) => void
  clearQueue: () => void
  playNext: () => void
  playPrevious: () => void
  seekTo: (progress: number) => void

  addPlayedAd: (adTime: number) => void
  toggleLike: (trackId: string) => void
  isLiked: (trackId: string) => boolean

  posts: Post[]
  feedPosts: Post[]
  setPosts: (posts: Post[]) => void
  setFeedPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  togglePostLike: (postId: string) => void
  addComment: (postId: string, comment: Comment) => void
  toggleCommentLike: (postId: string, commentId: string) => void
  sharePost: (postId: string) => void

  // NEW: Database NFT cache
  nftCache: Record<string, DatabaseNFT>
  setNftCache: (cache: Record<string, DatabaseNFT>) => void
  cacheNFT: (id: string, nft: DatabaseNFT) => void
  getCachedNFT: (id: string) => DatabaseNFT | undefined

  // NEW: UI preferences
  fontSize: 'default' | 'large' | 'larger'
  animations: boolean
  setFontSize: (size: 'default' | 'large' | 'larger') => void
  setAnimations: (enabled: boolean) => void
}

export const useStore = create<AppStore>((set, get) => ({
  user: null,
  setUser: (user) => {
    // Auto-populate walletAddress from piaddr for backward compatibility
    if (user && user.piaddr && !user.walletAddress) {
      user.walletAddress = user.piaddr
    }
    set({ user })
  },

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
  queue: [],
  streamLogged: false,
  adPlaying: false,
  playedAds: [],
  likedTracks: new Set(),

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
  },

  // NEW: NFT Cache functionality
  nftCache: {},
  setNftCache: (cache) => set({ nftCache: cache }),

  cacheNFT: (id, nft) =>
    set((state) => ({
      nftCache: {
        ...state.nftCache,
        [id]: nft
      }
    })),

  getCachedNFT: (id) => {
    return get().nftCache[id]
  },

  // NEW: UI preferences
  fontSize: 'default',
  animations: true,
  setFontSize: (size) => set({ fontSize: size }),
  setAnimations: (enabled) => set({ animations: enabled }),
}))

// Alias for convertDatabaseNFTToTrack to maintain compatibility with existing imports
export const convertToAudioTrack = convertDatabaseNFTToTrack;
