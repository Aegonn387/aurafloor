import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';

const sql = neon(process.env.DATABASE_URL!);

interface NFTMintRequest {
  creatorWallet: string;
  title: string;
  description: string;
  category: string;
  price: number;
  resaleFee: number;
  editionType?: string;
  totalEditions?: number;
  monetization?: any;
  audioData: string;
  audioFilename: string;
  audioContentType: string;
  coverData?: string;
  coverFilename?: string;
  coverContentType?: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as NFTMintRequest;

    const requiredFields = ['creatorWallet', 'title', 'price', 'resaleFee', 'audioData', 'audioFilename', 'audioContentType'] as const;
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          missing: missingFields
        })
      };
    }

    if (body.resaleFee < 500 || body.resaleFee > 1500) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Resale fee must be between 5% and 15% (500-1500)'
        })
      };
    }

    console.log('[Approve Payment] Processing NFT mint request for:', body.title);

    const paymentId = uuidv4();
    console.log('[Approve Payment] Generated payment ID:', paymentId);

    const audioBuffer = Buffer.from(body.audioData, 'base64');
    const coverBuffer = body.coverData ? Buffer.from(body.coverData, 'base64') : null;

    await sql`
      INSERT INTO pending_nft_mints (
        payment_id, creator_wallet, title, description, category,
        price, resale_fee, edition_type, total_editions, monetization,
        audio_data, audio_filename, audio_content_type,
        cover_data, cover_filename, cover_content_type, expires_at
      ) VALUES (
        ${paymentId}, ${body.creatorWallet}, ${body.title}, ${body.description || null}, ${body.category || null},
        ${body.price}, ${body.resaleFee}, ${body.editionType || null}, ${body.totalEditions || null}, 
        ${body.monetization ? JSON.stringify(body.monetization) : null},
        ${audioBuffer}, ${body.audioFilename}, ${body.audioContentType},
        ${coverBuffer}, ${body.coverFilename || null}, ${body.coverContentType || null},
        ${new Date(Date.now() + 3600000)}
      )
    `;

    console.log('[Approve Payment] NFT data stored for payment:', paymentId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        paymentId,
        amount: body.price,
        memo: `Mint NFT: ${body.title}`,
        message: 'Payment ready for Pi Browser approval.'
      })
    };

  } catch (error) {
    console.error('[Approve Payment] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to create payment',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    };
  }
};