export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { queryWithRetry, sql } from '@/lib/db';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// GET: Fetch comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
    }

    // FIX: Join on u.piuser (not u.id) since author_id stores piuser string
    const comments = await queryWithRetry(() => sql`
      SELECT
        pc.id,
        pc.content,
        pc.created_at,
        pc.like_count,
        u.id as author_id,
        u.dname as author_name,
        u.piuser as author_username
      FROM post_comments pc
      LEFT JOIN u ON pc.author_id = u.piuser
      WHERE pc.post_id = ${postId}
      ORDER BY pc.created_at ASC
    `);

    const formatted = comments.map(comment => ({
      id: comment.id,
      author: comment.author_name || comment.author_username || 'Unknown',
      authorId: comment.author_id,
      content: comment.content,
      timestamp: formatTimeAgo(comment.created_at),
      likes: Number(comment.like_count) || 0,
      liked: false
    }));

    return NextResponse.json({ comments: formatted });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST: Add a comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, content, uid } = body;

    if (!postId || !content || !uid) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // FIX: Lookup by piuser (not id) since uid is the piuser string
    const user = await queryWithRetry(() => sql`
      SELECT dname, piuser FROM u WHERE piuser = ${uid} LIMIT 1
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

    return NextResponse.json(newComment);
  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
