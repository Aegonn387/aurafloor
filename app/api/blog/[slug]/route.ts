import { NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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
      return NextResponse.json({
        success: false,
        error: 'Post not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      post: posts[0]
    });
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch post'
    }, { status: 500 });
  }
}
