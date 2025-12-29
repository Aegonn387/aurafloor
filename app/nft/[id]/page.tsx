// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array - you can add actual NFT IDs later
  return [];
}

// NFT Detail Page - Fixed for Next.js 15 static export
import { notFound } from 'next/navigation';

// Generate metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `NFT ${id}`,
  };
}

// Main page component
export default async function NFTDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>NFT Details</h1>
      <p>NFT ID: {id}</p>
      <p>This page works with static export.</p>
      <p>After Pi Network verification, you can add your full NFT logic.</p>
    </div>
  );
}
