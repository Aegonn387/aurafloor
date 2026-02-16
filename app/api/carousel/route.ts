import { NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const posts = await queryWithRetry(() => sql`
      SELECT
        id,
        title,
        excerpt as description,
        category,
        icon,
        gradient,
        action_text,
        action_link,
        published_at
      FROM blog_posts
      WHERE is_published = true AND is_featured = true
      ORDER BY published_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      posts: posts || []
    });

  } catch (error: any) {
    console.error('Failed to fetch featured blog posts:', error);
    return NextResponse.json({
      success: false,
      error: 'Database temporarily unavailable. Please try again.',
      posts: []
    }, { status: 503 });
  }
}
