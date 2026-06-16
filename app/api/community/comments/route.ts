export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, content, uid } = body;

    if (!postId || !content || !uid) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await queryWithRetry(() => sql`
      SELECT dname, piuser FROM u WHERE id = ${uid} LIMIT 1
    `);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const result = await queryWithRetry(() => sql`
      INSERT INTO post_comments (post_id, author_id, content, created_at, like_count)
      VALUES (${postId}, ${uid}, ${content}, NOW(), 0)
      RETURNING id, created_at
    `);

    await queryWithRetry(() => sql`
      UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ${postId}
    `);

    const newComment = {
      id: result[0].id,
      author: user[0].dname || user[0].piuser,
      authorId: uid,
      content,
      timestamp: 'Just now',
      likes: 0,
      liked: false,
    };

    return NextResponse.json({ comment: newComment });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
