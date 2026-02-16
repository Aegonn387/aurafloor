import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// POST - Submit creator application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pi_address,
      pi_username,
      display_name,
      bio,
      writing_sample,
      topics
    } = body;

    // Validate required fields
    if (!pi_address || !pi_username || !display_name || !bio || !writing_sample || !topics || topics.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'All fields are required' 
      }, { status: 400 });
    }

    // Check if already applied
    const existing = await sql`
      SELECT id, status FROM creator_applications
      WHERE pi_address = ${pi_address}
    `;

    if (existing.length > 0) {
      const status = existing[0].status;
      if (status === 'pending') {
        return NextResponse.json({ 
          success: false, 
          error: 'You already have a pending application' 
        }, { status: 400 });
      } else if (status === 'approved') {
        return NextResponse.json({ 
          success: false, 
          error: 'You are already an approved creator' 
        }, { status: 400 });
      }
    }

    // Check if already authorized
    const authorized = await sql`
      SELECT id FROM authorized_creators
      WHERE pi_address = ${pi_address}
    `;

    if (authorized.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'You are already an authorized creator' 
      }, { status: 400 });
    }

    // Insert application
    const result = await sql`
      INSERT INTO creator_applications (
        pi_address,
        pi_username,
        display_name,
        bio,
        writing_sample,
        topics_interested
      ) VALUES (
        ${pi_address},
        ${pi_username},
        ${display_name},
        ${bio},
        ${writing_sample},
        ${topics}
      )
      RETURNING *
    `;

    return NextResponse.json({ 
      success: true, 
      application: result[0] 
    });

  } catch (error) {
    console.error('Failed to submit application:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to submit application' 
    }, { status: 500 });
  }
}
