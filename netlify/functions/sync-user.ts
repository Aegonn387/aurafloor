import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface SyncUserRequest {
  uid: string;
  username: string;
  piaddr?: string;
  role?: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as SyncUserRequest;
    const { uid, username, piaddr, role } = body;

    if (!uid || !username) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'uid and username are required' }),
      };
    }

    const rows = await sql`
      INSERT INTO u (id, piuser, piaddr, role, ca, ua)
      VALUES (${uid}, ${username}, ${piaddr || null}, ${role || 'collector'}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        piuser = EXCLUDED.piuser,
        piaddr = COALESCE(EXCLUDED.piaddr, u.piaddr),
        role = COALESCE(EXCLUDED.role, u.role),
        ua = NOW()
      RETURNING id, piuser, piaddr, role, dname, bio, avatar, email, subtier, stellar_public_key
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, user: rows[0] }),
    };
  } catch (error) {
    console.error('[Sync User] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Failed to sync user',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
