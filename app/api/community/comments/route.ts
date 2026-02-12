import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

async function getUserFromRequest(request: NextRequest): Promise<{ id: number; username: string } | null> {
  // TODO: Replace with your Pi Network auth
  return { id: 1, username: 'CurrentUser' }
}

// POST: Add a comment to a post
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, content } = body

    if (!postId || !content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Post ID and content are required' }, { status: 400 })
    }

    // Verify post exists
    const postExists = await sql`
      SELECT id FROM community_posts WHERE id = ${postId}
    `
    if (postExists.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Insert comment
    const result = await sql`
      INSERT INTO post_comments (post_id, author_id, content)
      VALUES (${postId}, ${user.id}, ${content.trim()})
      RETURNING *
    `

    // Get comment with author info
    const newComment = await sql`
      SELECT 
        c.*,
        u.piuser as author
      FROM post_comments c
      JOIN u ON c.author_id = u.id
      WHERE c.id = ${result[0].id}
    `

    // Update comment count on post
    await sql`
      UPDATE community_posts 
      SET comment_count = comment_count + 1
      WHERE id = ${postId}
    `

    return NextResponse.json(newComment[0], { status: 201 })
  } catch (error) {
    console.error('[Community API] Error adding comment:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}



