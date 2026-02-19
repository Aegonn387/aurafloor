import { NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';
import { homepageCache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const CACHE_TTL = 300; // 5 minutes

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cacheKey = `blog:post:${slug}`;

    const response = await homepageCache.get(cacheKey, async () => {
      const posts = await queryWithRetry(() => sql`
        SELECT
          id,
          title,
          slug,
          excerpt,
          content,
          category,
          icon,
          gradient,
          author,
          published_at
        FROM blog_posts
        WHERE slug = ${slug} AND is_published = true
        LIMIT 1
      `);

      if (posts.length === 0) {
        // Return a not-found object that will be cached
        return { success: false, error: 'Post not found', _notFound: true };
      }
      return { success: true, post: posts[0] };
    }, CACHE_TTL);

    if (response._notFound) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch post'
    }, { status: 500 });
  }
}
