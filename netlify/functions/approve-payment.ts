import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!);

interface NFTMintRequest {
  paymentId: string;
  creatorWallet: string;
  title: string;
  description: string;
  category: string;
  price: number;
  resaleFee: number; // e.g., 5% as 500
  editionType?: string;
  totalEditions?: number;
  monetization?: any;
  audioData: string; // base64 string
  audioFilename: string;
  audioContentType: string;
  coverData?: string; // base64 string (optional)
  coverFilename?: string;
  coverContentType?: string;
}

export const handler: Handler = async (event) => {
  // Only allow POST requests
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
    // Parse request body
    const body = JSON.parse(event.body || '{}') as NFTMintRequest;

    // Validate required fields
    const requiredFields = [
      'paymentId',
      'creatorWallet',
      'title',
      'price',
      'resaleFee',
      'audioData',
      'audioFilename',
      'audioContentType'
    ] as const;

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

    // Validate resale fee is between 5% and 15% (500-1500)
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

    const { paymentId } = body;

    console.log('[Approve Payment] Storing NFT data for payment:', paymentId);

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      throw new Error('PI_API_KEY environment variable is not set');
    }

    // Convert base64 strings to buffers for BYTEA storage
    const audioBuffer = Buffer.from(body.audioData, 'base64');
    const coverBuffer = body.coverData
      ? Buffer.from(body.coverData, 'base64')
      : null;

    // Store NFT data in pending_nft_mints table, keyed by the real
    // Pi payment ID that the client's createPayment() call generated
    const insertQuery = `
      INSERT INTO pending_nft_mints (
        payment_id,
        creator_wallet,
        title,
        description,
        category,
        price,
        resale_fee,
        edition_type,
        total_editions,
        monetization,
        audio_data,
        audio_filename,
        audio_content_type,
        cover_data,
        cover_filename,
        cover_content_type
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16
      )
    `;

    await sql(
      insertQuery,
      [
        paymentId,
        body.creatorWallet,
        body.title,
        body.description || null,
        body.category || null,
        body.price,
        body.resaleFee,
        body.editionType || null,
        body.totalEditions || null,
        body.monetization ? JSON.stringify(body.monetization) : null,
        audioBuffer,
        body.audioFilename,
        body.audioContentType,
        coverBuffer,
        body.coverFilename || null,
        body.coverContentType || null
      ]
    );

    console.log('[Approve Payment] NFT data stored for payment:', paymentId);

    // Now approve the payment with Pi Servers
    const piApiUrl = `https://api.minepi.com/v2/payments/${paymentId}/approve`;
    const piResponse = await fetch(piApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      // Roll back the stored mint data since approval failed
      await sql`DELETE FROM pending_nft_mints WHERE payment_id = ${paymentId}`;
      throw new Error(`Pi payment approval failed: ${errorText}`);
    }

    console.log('[Approve Payment] Pi payment approved:', paymentId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        paymentId,
        message: 'Payment approved. Please confirm in your Pi wallet.'
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
        error: 'Failed to approve payment',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    };
  }
};
