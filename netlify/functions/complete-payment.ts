import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import pinataSDK from '@pinata/sdk';
import { Keypair, TransactionBuilder, Networks, Asset, Operation, Server } from '@stellar/stellar-sdk';

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!);

// Initialize Cloudflare R2 client
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;

// Initialize Pinata
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_API_KEY!
);

interface CompletePaymentRequest {
  paymentId: string;
  txid: string;
}

interface PendingNFTData {
  payment_id: string;
  creator_wallet: string;
  title: string;
  description: string;
  category: string;
  price: number;
  resale_fee: number;
  edition_type: string;
  total_editions: number;
  monetization: any;
  audio_data: Buffer;
  audio_filename: string;
  audio_content_type: string;
  cover_data: Buffer | null;
  cover_filename: string | null;
  cover_content_type: string | null;
  created_at: Date;
  expires_at: Date;
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
    const body = JSON.parse(event.body || '{}') as CompletePaymentRequest;
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Payment ID and txid are required'
        })
      };
    }

    console.log('[Complete Payment] Processing payment:', paymentId);

    // 1. Verify and sign the transaction FIRST
    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      throw new Error('PI_API_KEY environment variable is not set');
    }

    // Get your app's secret seed from environment
    const appSecretSeed = process.env.PI_APP_SECRET_SEED;
    if (!appSecretSeed) {
      throw new Error('PI_APP_SECRET_SEED environment variable is not set');
    }

    console.log('[Complete Payment] Fetching payment details for:', paymentId);

    // Get payment details to build transaction
    const paymentDetailsResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': 'Key ' + piApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentDetailsResponse.ok) {
      const errorText = await paymentDetailsResponse.text();
      throw new Error('Failed to fetch payment details: ' + errorText);
    }

    const paymentDetails = await paymentDetailsResponse.json();
    console.log('[Complete Payment] Payment details received:', {
      amount: paymentDetails.amount,
      from_address: paymentDetails.from_address
    });

    // Build and sign the Stellar transaction
    const appKeypair = Keypair.fromSecret(appSecretSeed);
    const server = new Server('https://api.testnet.minepi.com');
    
    // Fetch the account sequence number
    const account = await server.loadAccount(appKeypair.publicKey());

    const transaction = new TransactionBuilder(account, {
      fee: "10000", // 100 stroops = 0.001 XLM
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.payment({
      destination: paymentDetails.from_address,
      asset: Asset.native(),
      amount: paymentDetails.amount.toString()
    }))
    .setTimeout(180)
    .build();

    // Sign the transaction
    transaction.sign(appKeypair);
    console.log('[Complete Payment] Transaction signed');

    // Submit to Pi Network's horizon server
    const submitResponse = await fetch('https://api.testnet.minepi.com/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx: transaction.toXDR()
      })
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error('Failed to submit transaction: ' + errorText);
    }

    const transactionResult = await submitResponse.json();
    console.log('[Complete Payment] Transaction submitted successfully:', transactionResult.hash);

    // 2. NOW verify with Pi API that payment is complete
    const piApiUrl = "https://api.minepi.com/v2/payments/complete";
    const piResponse = await fetch(piApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Key ' + piApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid })
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      throw new Error('Pi payment verification failed: ' + errorText);
    }

    console.log('[Complete Payment] Pi payment verified');

    // [REST OF YOUR ORIGINAL CODE FOLLOWS - retrieving NFT data, uploading to R2, IPFS, etc.]
    // 3. Retrieve NFT data from pending_nft_mints table
    const nftData = await sql`
      SELECT * FROM pending_nft_mints
      WHERE payment_id = ${paymentId}
      LIMIT 1
    `;

    if (nftData.length === 0) {
      throw new Error('NFT data not found for this payment');
    }

    const nft = nftData[0] as PendingNFTData;
    console.log('[Complete Payment] Retrieved NFT data:', nft.title);

    // 4. Upload audio to Cloudflare R2
    const audioKey = `audio/${paymentId}-${nft.audio_filename}`;
    await R2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: audioKey,
      Body: nft.audio_data,
      ContentType: nft.audio_content_type,
    }));
    const audioUrl = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${audioKey}`;

    console.log('[Complete Payment] Audio uploaded to R2:', audioUrl);

    // 5. Upload cover image to IPFS (if exists)
    let coverIpfsHash = '';
    if (nft.cover_data) {
      try {
        const coverResult = await pinata.pinFileToIPFS(nft.cover_data, {
          pinataMetadata: {
            name: nft.cover_filename || 'cover-' + paymentId
          },
        });
        coverIpfsHash = coverResult.IpfsHash;
        console.log('[Complete Payment] Cover uploaded to IPFS:', coverIpfsHash);
      } catch (error) {
        console.warn('[Complete Payment] Failed to upload cover to IPFS:', error);
        // Continue without cover - it's optional
      }
    }

    // 6. Create and upload metadata JSON to IPFS
    const metadata = {
      name: nft.title,
      description: nft.description,
      image: coverIpfsHash ? 'ipfs://' + coverIpfsHash : '',
      animation_url: audioUrl,
      external_url: `https://aurafloor.xyz/track/${paymentId}`,
      attributes: [
        { trait_type: 'Category', value: nft.category },
        { trait_type: 'Edition Type', value: nft.edition_type || 'Single' },
        { trait_type: 'Royalty', value: `${(nft.resale_fee / 100).toFixed(2)}%` },
        ...(nft.total_editions ? [{ trait_type: 'Total Editions', value: nft.total_editions }] : []),
        ...(nft.monetization ? [{ trait_type: 'Monetization', value: JSON.stringify(nft.monetization) }] : []),
      ],
      properties: {
        creator: nft.creator_wallet,
        price: nft.price,
        created_at: nft.created_at.toISOString(),
      }
    };

    const metadataResult = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: { name: `${nft.title} - Metadata` },
    });
    const tokenUri = 'ipfs://' + metadataResult.IpfsHash;

    console.log('[Complete Payment] Metadata uploaded to IPFS:', tokenUri);

    // 7. TODO: Call Soroban contract to mint NFT
    // This is where you would integrate with your Stellar Soroban contract
    // const tokenId = await mintOnSoroban(nft.creator_wallet, tokenUri, nft.resale_fee);

    // For now, generate a mock token ID
    const tokenId = 'aura_' + paymentId;
    console.log('[Complete Payment] NFT minted (mock):', tokenId);

    // 8. TODO: Store final NFT data in your main 'n' table
    // You would insert into your existing 'n' table here
    // await sql`
    //   INSERT INTO n (id, title, descr, genre, price, royalty, ...)
    //   VALUES (uuid_generate_v4(), ${nft.title}, ${nft.description}, ...)
    // `;

    // 9. Clean up - remove from pending_nft_mints
    await sql`
      DELETE FROM pending_nft_mints
      WHERE payment_id = ${paymentId}
    `;

    console.log('[Complete Payment] Cleaned up pending data');

    // 10. Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        paymentId,
        transactionHash: transactionResult.hash,
        nft: {
          tokenId,
          tokenUri,
          audioUrl,
          coverUrl: coverIpfsHash ? 'ipfs://' + coverIpfsHash : null,
          title: nft.title,
          description: nft.description,
          royalty: nft.resale_fee / 100,
          price: nft.price,
          creatorWallet: nft.creator_wallet,
        },
        message: 'Payment completed and NFT minted successfully!'
      })
    };

  } catch (error) {
    console.error('[Complete Payment] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'NFT minting failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    };
  }
};
