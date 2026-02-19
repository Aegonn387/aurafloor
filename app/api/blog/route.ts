import { NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';
import { homepageCache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const CACHE_TTL = 300; // 5 minutes

export async function GET() {
  try {
    const cacheKey = 'blog:list';

    const response = await homepageCache.get(cacheKey, async () => {
      const posts = await queryWithRetry(() => sql`
        SELECT
          id,
          title,
          slug,
          excerpt,
          category,
          icon,
          gradient,
          author,
          published_at
        FROM blog_posts
        WHERE is_published = true
        ORDER BY published_at DESC
      `);
      return { success: true, posts };
    }, CACHE_TTL);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch posts'
    }, { status: 500 });
  }
}
