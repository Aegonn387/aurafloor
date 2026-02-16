import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// GET - Fetch all published blog posts
export async function GET() {
  try {
    const posts = await sql`
      SELECT
        id,
        title,
        slug,
        excerpt,
        category,
        icon,
        gradient,
        author,
        published_at
      FROM blog_posts
      WHERE is_published = true
      ORDER BY published_at DESC
    `;

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
