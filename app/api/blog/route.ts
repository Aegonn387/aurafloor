import { NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';
import { homepageCache } from '@/lib/redis';

export const dynamic = 'force-dynamic';
const CACHE_TTL = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const draftsOnly = searchParams.get('drafts') === 'true';

  if (draftsOnly) {
    const drafts = await queryWithRetry(() => sql`
      SELECT id, title, content, saved_at FROM blog_drafts
      WHERE author_id = 'current_user' AND published = false
      ORDER BY saved_at DESC
    `);
    return NextResponse.json({ success: true, drafts });
  }

  try {
    const cacheKey = 'blog:list';
    const response = await homepageCache.get(cacheKey, async () => {
      const posts = await queryWithRetry(() => sql`
        SELECT id, title, slug, excerpt, category, icon, gradient, author, published_at
        FROM blog_posts WHERE is_published = true ORDER BY published_at DESC
      `);
      return { success: true, posts };
    }, CACHE_TTL);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, action } = body;

    if (!title || !action) {
      return NextResponse.json({ success: false, error: 'Title and action required' }, { status: 400 });
    }

    if (action === 'draft') {
      // Save as draft
      const existing = await queryWithRetry(() => sql`
        SELECT id FROM blog_drafts WHERE title = ${title} AND author_id = 'current_user'
      `);
      if (existing.length > 0) {
        await queryWithRetry(() => sql`
          UPDATE blog_drafts SET content = ${content || ''}, saved_at = NOW()
          WHERE id = ${existing[0].id}
        `);
        return NextResponse.json({ success: true, message: 'Draft updated' });
      } else {
        const count = await queryWithRetry(() => sql`SELECT COUNT(*) FROM blog_drafts WHERE author_id = 'current_user'`);
        if (parseInt(count[0].count) >= 5) {
          return NextResponse.json({ success: false, error: 'Max 5 drafts reached' }, { status: 400 });
        }
        await queryWithRetry(() => sql`
          INSERT INTO blog_drafts (title, content, author_id, saved_at) VALUES (${title}, ${content || ''}, 'current_user', NOW())
        `);
        return NextResponse.json({ success: true, message: 'Draft saved' });
      }
    }

    if (action === 'publish') {
      // Placeholder: Verify 100 AURA stake (will call AURA token contract once deployed)
      // TODO: Replace with actual on-chain stake check after AURA contract is live
      if (!content) return NextResponse.json({ success: false, error: 'Content required to publish' }, { status: 400 });
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const result = await queryWithRetry(() => sql`
        INSERT INTO blog_posts (title, slug, excerpt, content, category, icon, gradient, author, is_published, published_at)
        VALUES (${title}, ${slug}, ${content.slice(0,150)}..., ${content}, 'Writing', '📝', 'from-primary/10 to-accent/10', 'current_user', true, NOW())
        RETURNING id
      `);
      // Remove from drafts if it was a draft
      await queryWithRetry(() => sql`DELETE FROM blog_drafts WHERE title = ${title} AND author_id = 'current_user'`);
      return NextResponse.json({ success: true, id: result[0].id, slug });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Blog POST error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  try {
    await queryWithRetry(() => sql`DELETE FROM blog_drafts WHERE id = ${id} AND author_id = 'current_user'`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Blog DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
