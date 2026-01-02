import { NextRequest, NextResponse } from 'next/server';
import { getCachedOrFetch } from '@/lib/redis';

// Simulate fetching a stream URL from your database or storage
async function fetchStreamFromService(trackId: string, userId: string): Promise<{ streamUrl: string; quality: string }> {
  // TODO: Replace this mock with your actual logic.
  // Example: query your database, call Pinata, etc.
  console.log(`Fetching stream for track: ${trackId}, user: ${userId}`);
  return {
    streamUrl: `https://your-audio-storage.com/tracks/${trackId}.mp3`,
    quality: 'high'
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Note: params is a Promise in Next.js 15
) {
  try {
    // Await the params promise
    const { id: trackId } = await context.params;
    const userId = request.nextUrl.searchParams.get('userId') || 'anonymous';

    // Use your existing cache helper
    const data = await getCachedOrFetch(
      `stream:${trackId}:${userId}`,
      () => fetchStreamFromService(trackId, userId),
      600 // Cache for 10 minutes (adjust as needed)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/stream/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to get stream URL' },
      { status: 500 }
    );
  }
}
