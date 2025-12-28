"use client"

import { use } from "react"
// ... (ALL YOUR EXISTING IMPORTS REMAIN HERE, DO NOT REMOVE THEM)

// 🔧 CRITICAL FIX: Add this function for static export
export async function generateStaticParams() {
  // Return an array of objects with all possible `id` values.
  // Since you use mock data, generate from mockTracks.
  // If you don't know the IDs, return an empty array for now.
  return mockTracks.map((track) => ({
    id: track.id,
  }))
}

// YOUR EXISTING PAGE COMPONENT FUNCTION STARTS HERE
export default function NFTDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // ... (THE REST OF YOUR EXISTING PAGE CODE)
}
