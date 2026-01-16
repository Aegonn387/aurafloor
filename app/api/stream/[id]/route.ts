import { NextRequest, NextResponse } from 'next/server';

// Try to use existing redis module if available, otherwise fallback
async function getCachedOrFetch(key: string, fetchFn: () => Promise<any>, ttl: number = 600): Promise<any> {
  try {
    // Try to use the existing module
    const { getCachedOrFetch: redisFetch } = await import('@/lib/redis');
    return await redisFetch(key, fetchFn, ttl);
  } catch (error) {
    console.log('Redis module not available, using in-memory cache');
    
    // Fallback in-memory cache
    const cache = new Map();
    const CACHE_DURATION = ttl * 1000;
    
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    const data = await fetchFn();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}

// Simulate fetching a stream URL from your database or storage
async function fetchStreamFromService(trackId: string, userId: string): Promise<{ streamUrl: string; quality: string }> {
  console.log(`Fetching stream for track: ${trackId}, user: ${userId}`);
  
  // Publicly accessible audio URLs for testing
  const mockTracks: Record<string, { streamUrl: string; quality: string }> = {
    'track-1': {
      streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      quality: '320kbps'
    },
    'track-2': {
      streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      quality: '320kbps'
    },
    'track-3': {
      streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      quality: '320kbps'
    },
    'demo': {
      streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      quality: '320kbps'
    }
  };
  
  // Return a mock stream URL if track exists, otherwise default
  const trackData = mockTracks[trackId] || {
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    quality: '320kbps'
  };
  
  // Simulate some delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return trackData;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const { id: trackId } = await context.params;
    const userId = request.nextUrl.searchParams.get('userId') || 'anonymous';

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    // Use your existing cache helper
    const data = await getCachedOrFetch(
      `stream:${trackId}:${userId}`,
      () => fetchStreamFromService(trackId, userId),
      600 // Cache for 10 minutes
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
