import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// PUT - Update blog post
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params; // FIXED: await params

    const {
      title,
      excerpt,
      content,
      category,
      icon,
      gradient,
      action_text,
      action_link,
      is_published,
      is_featured
    } = body;

    // Auto-generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const result = await sql`
      UPDATE blog_posts
      SET
        title = ${title},
        slug = ${slug},
        excerpt = ${excerpt},
        content = ${content},
        category = ${category},
        icon = ${icon},
        gradient = ${gradient},
        action_text = ${action_text},
        action_link = ${action_link},
        is_published = ${is_published},
        is_featured = ${is_featured},
        published_at = ${is_published && body.published_at === null ? new Date().toISOString() : body.published_at},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ 
      success: true, 
      post: result[0] 
    });
  } catch (error) {
    console.error('Failed to update post:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update post' 
    }, { status: 500 });
  }
}

// DELETE - Delete blog post
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // FIXED: await params

    await sql`
      DELETE FROM blog_posts
      WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete post' 
    }, { status: 500 });
  }
}
