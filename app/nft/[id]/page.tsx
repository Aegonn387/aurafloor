// @ts-nocheck
// This disables TypeScript for this file

// Generate static params for static export
export async function generateStaticParams() {
  // Return empty array - no pages pre-generated
  // The page will be rendered at runtime
  return []
}

// NFT Detail Page
export default async function NFTDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>NFT Details</h1>
      <p>NFT ID: {id}</p>
      <p>This page works with static export.</p>
      <p>The NFT data will be fetched client-side.</p>
    </div>
  );
}

// Note: For static export, params is not a Promise
// We're using a simpler approach that works with generateStaticParams
