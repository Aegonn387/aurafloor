// app/api/nfts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: NextRequest) {
  try {
    // Initialize database connection INSIDE the function
    const sql = neon(process.env.DATABASE_URL!);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const nfts = await sql`
      SELECT nfts.*, users.username as creator_name
      FROM nfts
      JOIN users ON nfts.creator_id = users.id
      WHERE nfts.published = true
      ORDER BY nfts.created_at DESC
      LIMIT ${limit}
    `;
    
    return NextResponse.json({ success: true, data: nfts });
  } catch (error) {
    console.error('NFTs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // Your NFT creation logic here
    const [newNft] = await sql`
      INSERT INTO nfts (title, description, creator_id, published)
      VALUES (${body.title}, ${body.description}, ${body.creatorId}, true)
      RETURNING *
    `;
    
    return NextResponse.json(
      { success: true, data: newNft },
      { status: 201 }
    );
  } catch (error) {
    console.error('NFT creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create NFT' },
      { status: 500 }
    );
  }
}
