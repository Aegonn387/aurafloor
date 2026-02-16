import { NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch all blog posts (for admin view)
export async function GET() {
  try {
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
        action_text,
        action_link,
        is_published,
        is_featured,
        published_at,
        created_at,
        updated_at
      FROM blog_posts
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch posts'
    }, { status: 500 });
  }
}

// POST - Create new blog post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      category,
      icon,
      gradient,
      author,
      is_published,
      is_featured
    } = body;

    // Auto-generate slug if not provided
    const finalSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const action_text = 'Read More';
    const action_link = `/blog/${finalSlug}`;

    const result = await queryWithRetry(() => sql`
      INSERT INTO blog_posts (
        title, slug, excerpt, content, category, icon, gradient,
        author, action_text, action_link, is_published, is_featured,
        published_at
      ) VALUES (
        ${title}, ${finalSlug}, ${excerpt}, ${content || ''}, ${category},
        ${icon || '📝'}, ${gradient}, ${author || 'Admin'},
        ${action_text}, ${action_link},
        ${is_published || false}, ${is_featured || false},
        ${is_published ? new Date().toISOString() : null}
      )
      RETURNING *
    `);

    return NextResponse.json({
      success: true,
      post: result[0]
    });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create post'
    }, { status: 500 });
  }
}
