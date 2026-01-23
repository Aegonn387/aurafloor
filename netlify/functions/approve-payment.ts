import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!);

interface NFTMintRequest {
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

interface PiPaymentResponse {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: any;
  from_address: string;
  created_at: string;
  network: string;
  direction: string;
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

    console.log('[Approve Payment] Creating Pi payment for:', body.title);

    // 1. Create Pi payment
    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      throw new Error('PI_API_KEY environment variable is not set');
    }

    // Prepare payment data for Pi Network
    const paymentData = {
      amount: body.price,
      memo: "Mint NFT: " + body.title,
      metadata: {
        type: 'nft_mint',
        title: body.title,
        creatorWallet: body.creatorWallet,
        category: body.category,
        resaleFee: body.resaleFee / 100, // Convert back to percentage
      },
      uid: body.creatorWallet, // Pi wallet address
    };

    // Make request to Pi Network API
    const piResponse = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': Key ,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      throw new Error(`Pi payment creation failed: ${errorText}`);
    }

    const piPayment: PiPaymentResponse = await piResponse.json();
    const paymentId = piPayment.identifier;

    console.log('[Approve Payment] Pi payment created:', paymentId);

    // 2. Convert base64 strings to buffers for BYTEA storage
    const audioBuffer = Buffer.from(body.audioData, 'base64');
    const coverBuffer = body.coverData 
      ? Buffer.from(body.coverData, 'base64') 
      : null;

    // 3. Store NFT data in pending_nft_mints table
    await sql
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
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        
      )
    ;

    console.log('[Approve Payment] NFT data stored for payment:', paymentId);

    // 4. Return payment ID and Pi payment details to frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        paymentId,
        piPayment: {
          identifier: piPayment.identifier,
          amount: piPayment.amount,
          memo: piPayment.memo,
          user_uid: piPayment.user_uid,
          network: piPayment.network,
        },
        message: 'Payment created successfully. Please approve in your Pi wallet.'
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




