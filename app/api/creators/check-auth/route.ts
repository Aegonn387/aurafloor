import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

// GET - Check if user is authorized admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pi_address = searchParams.get('pi_address');

    if (!pi_address) {
      return NextResponse.json({ 
        is_admin: false,
        is_creator: false
      });
    }

    const result = await sql`
      SELECT role, can_publish, is_active
      FROM authorized_creators
      WHERE pi_address = ${pi_address}
    `;

    if (result.length === 0) {
      return NextResponse.json({ 
        is_admin: false,
        is_creator: false
      });
    }

    const creator = result[0];
    const is_super_admin = creator.role === 'super_admin';
    const is_editor = creator.role === 'editor';

    return NextResponse.json({ 
      is_admin: is_super_admin || is_editor,
      is_super_admin,
      is_creator: creator.is_active,
      can_publish: creator.can_publish,
      role: creator.role
    });

  } catch (error) {
    console.error('Auth check failed:', error);
    return NextResponse.json({ 
      is_admin: false,
      is_creator: false
    }, { status: 500 });
  }
}
