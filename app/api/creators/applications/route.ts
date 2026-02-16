import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// GET - Fetch all applications
export async function GET() {
  try {
    const applications = await sql`
      SELECT
        id,
        pi_address,
        pi_username,
        display_name,
        bio,
        writing_sample,
        topics_interested,
        status,
        reviewed_by,
        review_notes,
        applied_at,
        reviewed_at
      FROM creator_applications
      ORDER BY 
        CASE 
          WHEN status = 'pending' THEN 1
          WHEN status = 'approved' THEN 2
          WHEN status = 'rejected' THEN 3
        END,
        applied_at DESC
    `;

    return NextResponse.json({ 
      success: true, 
      applications 
    });

  } catch (error) {
    console.error('Failed to fetch applications:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch applications' 
    }, { status: 500 });
  }
}
