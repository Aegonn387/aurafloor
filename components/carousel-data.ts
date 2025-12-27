export interface CarouselItem {
  id: number;
  title: string;
  description: string;
  category: string;
  gradient: string;
  icon: string;
  actionText: string;
  actionLink: string;
}

export const carouselItems: CarouselItem[] = [
  {
    id: 1,
    title: "Creator of the Week",
    description: "Spotlight on top audio NFT creators in our community",
    category: "Spotlight",
    gradient: "bg-gradient-to-r from-purple-600 to-pink-500",
    icon: "👑",
    actionText: "View Creator Profile",
    actionLink: "/creators/featured"
  },
  {
    id: 2,
    title: "App Updates",
    description: "Latest features, improvements & announcements",
    category: "Announcement",
    gradient: "bg-gradient-to-r from-blue-600 to-cyan-500",
    icon: "🔄",
    actionText: "See What's New",
    actionLink: "/updates"
  },
  {
    id: 3,
    title: "Outstanding Collector",
    description: "Recognizing top NFT collectors this week",
    category: "Recognition",
    gradient: "bg-gradient-to-r from-green-600 to-emerald-500",
    icon: "⭐",
    actionText: "Explore Marketplace",
    actionLink: "/marketplace"
  },
  {
    id: 4,
    title: "Audio NFT Guides",
    description: "Tutorials, insights & creation tips",
    category: "Education",
    gradient: "bg-gradient-to-r from-orange-600 to-red-500",
    icon: "📚",
    actionText: "Read Blog",
    actionLink: "/blog"
  },
  {
    id: 5,
    title: "Pi Network News",
    description: "Latest Pi ecosystem developments & partnerships",
    category: "Community",
    gradient: "bg-gradient-to-r from-indigo-600 to-violet-500",
    icon: "🪙",
    actionText: "Pi Blogs",
    actionLink: "/pi-news"
  },
  {
    id: 6,
    title: "NFT Trading Tips",
    description: "Maximize your trading success with expert strategies",
    category: "Tips",
    gradient: "bg-gradient-to-r from-amber-600 to-yellow-500",
    icon: "💡",
    actionText: "Get Tips",
    actionLink: "/tips"
  },
  {
    id: 7,
    title: "Weekly Playlist",
    description: "Curated audio NFTs from community favorites",
    category: "Music",
    gradient: "bg-gradient-to-r from-rose-600 to-pink-500",
    icon: "🎵",
    actionText: "Listen Now",
    actionLink: "/playlists"
  },
  {
    id: 8,
    title: "Community Events",
    description: "Live streams, AMAs, and virtual gatherings",
    category: "Events",
    gradient: "bg-gradient-to-r from-teal-600 to-green-500",
    icon: "🎤",
    actionText: "Join Event",
    actionLink: "/events"
  },
  {
    id: 9,
    title: "Minting Tutorials",
    description: "Step-by-step guides for creating audio NFTs",
    category: "Tutorial",
    gradient: "bg-gradient-to-r from-red-600 to-orange-500",
    icon: "🎨",
    actionText: "Learn to Mint",
    actionLink: "/mint-guide"
  },
  {
    id: 10,
    title: "Top Collections",
    description: "Explore trending NFT collections this month",
    category: "Trending",
    gradient: "bg-gradient-to-r from-cyan-600 to-blue-500",
    icon: "📈",
    actionText: "View Collections",
    actionLink: "/collections"
  }
];
