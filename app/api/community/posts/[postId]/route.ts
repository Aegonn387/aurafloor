import { NextRequest, NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { content, uid } = body;

    if (!postId || !content || !uid) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const post = await queryWithRetry(() => sql`
      SELECT author_id FROM community_posts WHERE id = ${postId} LIMIT 1
    `);
    if (post.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post[0].author_id !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await queryWithRetry(() => sql`
      UPDATE community_posts
      SET content = ${content}, updated_at = NOW()
      WHERE id = ${postId}
      RETURNING content
    `);

    return NextResponse.json({ content: result[0].content });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { uid } = body;

    if (!postId || !uid) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const post = await queryWithRetry(() => sql`
      SELECT author_id FROM community_posts WHERE id = ${postId} LIMIT 1
    `);
    if (post.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post[0].author_id !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await queryWithRetry(() => sql`
      DELETE FROM community_posts WHERE id = ${postId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
