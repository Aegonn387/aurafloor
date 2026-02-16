import { NextRequest, NextResponse } from 'next/server'
import { queryWithRetry, sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const posts = await queryWithRetry(() => sql`
      SELECT
        cp.*,
        u.dname as author_name,
        u.piuser as author_piuser,
        u.avatar as author_avatar,
        COALESCE(pl.like_count, 0) as like_count,
        COALESCE(pc.comment_count, 0) as comment_count
      FROM community_posts cp
      LEFT JOIN u ON cp.author_id::text = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as like_count
        FROM post_likes
        GROUP BY post_id
      ) pl ON cp.id = pl.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM post_comments
        GROUP BY post_id
      ) pc ON cp.id = pc.post_id
      ORDER BY cp.created_at DESC
      LIMIT 50
    `)

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('[Community] Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from u table using the auth token
    const users = await queryWithRetry(() => sql`
      SELECT id, piuser, role, subtier
      FROM u
      WHERE id = ${authHeader.replace('Bearer ', '')}
      LIMIT 1
    `)

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const user = users[0]
    const body = await request.json()
    const { content, mediaUrl, mediaType, linkedNftId } = body

    const result = await queryWithRetry(() => sql`
      INSERT INTO community_posts (
        author_id,
        content,
        media_url,
        media_type,
        linked_nft_id,
        created_at,
        like_count,
        comment_count
      )
      VALUES (
        ${user.id}::integer,
        ${content},
        ${mediaUrl || null},
        ${mediaType || null},
        ${linkedNftId || null},
        NOW(),
        0,
        0
      )
      RETURNING *
    `)

    // Add author info to response
    const post = {
      ...result[0],
      author_name: user.dname || user.piuser,
      author_piuser: user.piuser,
      author_avatar: user.avatar
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('[Community] Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
