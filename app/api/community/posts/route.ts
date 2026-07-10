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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    const posts = await queryWithRetry(() => sql`
      SELECT
        cp.id,
        cp.content,
        cp.media_url,
        cp.media_type,
        cp.linked_nft_id,
        cp.created_at,
        cp.like_count,
        cp.comment_count,
        u.id as author_id,
        u.dname as author_name,
        u.piuser as author_username,
        u.avatar as author_avatar,
        u.role as author_role
      FROM community_posts cp
      LEFT JOIN u ON cp.author_id = u.piuser
      ORDER BY cp.created_at DESC
      LIMIT 50
    `);

    const postIds = posts.map(p => p.id);
    let commentsMap: Record<string, any[]> = {};

    if (postIds.length > 0) {
      const comments = await queryWithRetry(() => sql`
        SELECT
          pc.id,
          pc.post_id,
          pc.content,
          pc.created_at,
          pc.like_count,
          u.id as author_id,
          u.dname as author_name,
          u.piuser as author_username
        FROM post_comments pc
        LEFT JOIN u ON pc.author_id = u.piuser
        WHERE pc.post_id = ANY(${postIds})
        ORDER BY pc.created_at ASC
      `);

      for (const comment of comments) {
        if (!commentsMap[comment.post_id]) commentsMap[comment.post_id] = [];
        commentsMap[comment.post_id].push({
          id: comment.id,
          author: comment.author_name || comment.author_username || 'Unknown',
          authorId: comment.author_id,
          content: comment.content,
          timestamp: formatTimeAgo(comment.created_at),
          likes: Number(comment.like_count) || 0,
          liked: false
        });
      }
    }

    let likedPostIds = new Set();
    if (uid) {
      const likes = await queryWithRetry(() => sql`
        SELECT post_id FROM post_likes WHERE user_id = ${uid}
      `);
      likedPostIds = new Set(likes.map((l: any) => l.post_id));
    }

    const formatted = posts.map(post => ({
      id: post.id,
      author: post.author_name || post.author_username || 'Unknown',
      authorId: post.author_id,
      role: post.author_role || 'collector',
      content: post.content,
      timestamp: formatTimeAgo(post.created_at),
      likes: Number(post.like_count) || 0,
      comments: commentsMap[post.id] || [],
      linkedNFT: post.linked_nft_id ? { id: post.linked_nft_id } : undefined,
      liked: likedPostIds.has(post.id)
    }));

    return NextResponse.json({ posts: formatted });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, linkedNFTId, uid } = body;

    if (!content || !uid) {
      return NextResponse.json({ error: 'Missing content or uid' }, { status: 400 });
    }

    const user = await queryWithRetry(() => sql`
      SELECT id, dname, piuser FROM u WHERE piuser = ${uid} LIMIT 1
    `);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const result = await queryWithRetry(() => sql`
      INSERT INTO community_posts (author_id, content, linked_nft_id, created_at, like_count, comment_count)
      VALUES (${uid}, ${content}, ${linkedNFTId || null}, NOW(), 0, 0)
      RETURNING id, created_at
    `);

    const newPost = {
      id: result[0].id,
      author: user[0].dname || user[0].piuser,
      authorId: uid,
      content,
      timestamp: 'Just now',
      likes: 0,
      comments: [],
      linkedNFT: linkedNFTId ? { id: linkedNFTId } : undefined,
      liked: false,
    };

    return NextResponse.json({ post: newPost });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
