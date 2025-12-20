// app/api/nfts/route.ts
export const runtime = 'nodejs'; // Force Node.js runtime for Redis compatibility

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { neon } from '@neondatabase/serverless';

// Database connection (replace with your actual schema)
const sql = neon(process.env.DATABASE_URL!);

// GET /api/nfts - Fetch all NFTs with optional pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Check cache first
    const cacheKey = `nfts:page_${page}:limit_${limit}`;
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        page,
        limit
      });
    }

    // Fetch from database
    const nfts = await sql`
      SELECT 
        nfts.*,
        users.username as creator_name,
        users.avatar_url as creator_avatar,
        COUNT(nft_likes.id) as like_count
      FROM nfts
      LEFT JOIN users ON nfts.creator_id = users.id
      LEFT JOIN nft_likes ON nfts.id = nft_likes.nft_id
      WHERE nfts.published = true
      GROUP BY nfts.id, users.username, users.avatar_url
      ORDER BY nfts.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCount = await sql`
      SELECT COUNT(*) as count FROM nfts WHERE published = true
    `;

    const responseData = {
      nfts,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount[0].count),
        totalPages: Math.ceil(parseInt(totalCount[0].count) / limit)
      }
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(responseData));

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    console.error('GET /api/nfts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}

// POST /api/nfts - Create a new NFT
export async function POST(request: NextRequest) {
  try {
    // Get user ID from your auth system (adjust based on your auth setup)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, image_url, audio_url, price } = body;

    // Validate required fields
    if (!title || !image_url) {
      return NextResponse.json(
        { success: false, error: 'Title and image URL are required' },
        { status: 400 }
      );
    }

    // Create NFT in database
    const [newNft] = await sql`
      INSERT INTO nfts 
        (title, description, image_url, audio_url, price, creator_id, published)
      VALUES 
        (${title}, ${description || null}, ${image_url}, ${audio_url || null}, 
         ${price || 0}, ${userId}, ${true})
      RETURNING *
    `;

    // Invalidate NFT list cache
    await redis.del('nfts:page_1:limit_20');

    return NextResponse.json({
      success: true,
      data: newNft,
      message: 'NFT created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/nfts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create NFT' },
      { status: 500 }
    );
  }
}

// Optional: PUT, PATCH, DELETE methods if needed
