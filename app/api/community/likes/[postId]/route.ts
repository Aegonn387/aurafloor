import { NextRequest, NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { uid } = body;

    if (!postId || !uid) {
      return NextResponse.json({ error: 'Missing postId or uid' }, { status: 400 });
    }

    const existing = await queryWithRetry(() => sql`
      SELECT id FROM post_likes WHERE post_id = ${postId} AND user_id = ${uid} LIMIT 1
    `);

    if (existing.length > 0) {
      await queryWithRetry(() => sql`
        DELETE FROM post_likes WHERE post_id = ${postId} AND user_id = ${uid}
      `);
      await queryWithRetry(() => sql`
        UPDATE community_posts SET like_count = like_count - 1 WHERE id = ${postId}
      `);
      return NextResponse.json({ liked: false });
    } else {
      await queryWithRetry(() => sql`
        INSERT INTO post_likes (post_id, user_id, created_at) VALUES (${postId}, ${uid}, NOW())
      `);
      await queryWithRetry(() => sql`
        UPDATE community_posts SET like_count = like_count + 1 WHERE id = ${postId}
      `);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process like' }, { status: 500 });
  }
}
