import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// POST - Approve or reject application
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, review_notes, reviewed_by } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action' 
      }, { status: 400 });
    }

    // Get application details
    const applications = await sql`
      SELECT * FROM creator_applications
      WHERE id = ${id}
    `;

    if (applications.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Application not found' 
      }, { status: 404 });
    }

    const application = applications[0];

    if (application.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        error: 'Application already reviewed' 
      }, { status: 400 });
    }

    // Update application status
    await sql`
      UPDATE creator_applications
      SET 
        status = ${action === 'approve' ? 'approved' : 'rejected'},
        reviewed_by = ${reviewed_by},
        review_notes = ${review_notes || null},
        reviewed_at = NOW()
      WHERE id = ${id}
    `;

    // If approved, add to authorized_creators
    if (action === 'approve') {
      await sql`
        INSERT INTO authorized_creators (
          pi_address,
          pi_username,
          display_name,
          bio,
          role,
          can_publish
        ) VALUES (
          ${application.pi_address},
          ${application.pi_username},
          ${application.display_name},
          ${application.bio},
          'writer',
          false
        )
        ON CONFLICT (pi_address) DO NOTHING
      `;
    }

    return NextResponse.json({ 
      success: true,
      action 
    });

  } catch (error) {
    console.error('Failed to review application:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to review application' 
    }, { status: 500 });
  }
}
