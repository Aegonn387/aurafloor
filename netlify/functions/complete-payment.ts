import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import pinataSDK from '@pinata/sdk';

const sql = neon(process.env.DATABASE_URL!);

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_API_KEY!
);

interface CompletePaymentRequest {
  paymentId: string;
  txid: string;
}

async function getNextTokenId(contractId: string): Promise<number> {
  try {
    const StellarSdk = require('@stellar/stellar-sdk');
    const server = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');
    const contract = new StellarSdk.Contract(contractId);
    const randomKeypair = StellarSdk.Keypair.random();
    const sourceAccount = new StellarSdk.Account(randomKeypair.publicKey(), '0');

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '100000',
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(contract.call('get_next_token_id'))
      .setTimeout(30)
      .build();

    transaction.sign(randomKeypair);
    const simulateResponse = await server.simulateTransaction(transaction);

    if (simulateResponse && !simulateResponse.error && simulateResponse.result) {
      const nextIdScVal = simulateResponse.result.retval;
      if (nextIdScVal) {
        const nextId = StellarSdk.scValToNative(nextIdScVal);
        console.log('[Stellar] Next token ID:', nextId);
        return nextId;
      }
    }

    throw new Error('Failed to get next token ID');
  } catch (error) {
    console.error('[Stellar] Get next token ID error:', error);
    throw error;
  }
}

async function mintOnSoroban(params: {
  minterAddress: string;
  metadataCid: string;
  audioR2Url: string;
  royaltyBasisPoints: number;
  contractId: string;
}): Promise<{ tokenId: string; transactionHash: string }> {
  try {
    console.log('[Soroban Mint] Starting mint for:', params.minterAddress);
    
    const StellarSdk = require('@stellar/stellar-sdk');
    const server = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');
    const adminSecret = process.env.STELLAR_ADMIN_SECRET;
    
    if (!adminSecret) {
      throw new Error('STELLAR_ADMIN_SECRET not configured');
    }
    
    const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecret);
    const contract = new StellarSdk.Contract(params.contractId);
    const adminAccount = await server.getAccount(adminKeypair.publicKey());

    const royaltyInfo = {
      recipient: params.minterAddress,
      basis_points: params.royaltyBasisPoints,
      additional_payees: [],
      is_fixed: true
    };

    const transaction = new StellarSdk.TransactionBuilder(adminAccount, {
      fee: '100000',
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'mint',
          StellarSdk.Address.fromString(params.minterAddress).toScVal(),
          StellarSdk.nativeToScVal(params.metadataCid, { type: 'string' }),
          StellarSdk.nativeToScVal(params.audioR2Url, { type: 'string' }),
          StellarSdk.nativeToScVal(royaltyInfo)
        )
      )
      .setTimeout(30)
      .build();

    transaction.sign(adminKeypair);

    const simulateResponse = await server.simulateTransaction(transaction);
    if (simulateResponse.error) {
      throw new Error('Simulation failed: ' + JSON.stringify(simulateResponse.error));
    }

    const preparedTransaction = StellarSdk.SorobanRpc.assembleTransaction(
      transaction,
      simulateResponse
    ).build();

    preparedTransaction.sign(adminKeypair);
    const sendResponse = await server.sendTransaction(preparedTransaction);

    if (sendResponse.status === 'ERROR') {
      throw new Error('Send failed: ' + sendResponse.errorResult);
    }

    const txHash = sendResponse.hash;
    console.log('[Soroban Mint] Transaction sent:', txHash);

    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const txResponse = await server.getTransaction(txHash);
        
        if (txResponse.status === 'SUCCESS' && txResponse.returnValue) {
          const tokenIdVal = StellarSdk.scValToNative(txResponse.returnValue);
          console.log('[Soroban Mint] Minted! Token ID:', tokenIdVal);
          
          return {
            tokenId: tokenIdVal.toString(),
            transactionHash: txHash
          };
        }
        
        if (txResponse.status === 'FAILED') {
          throw new Error('Transaction failed: ' + txResponse.resultXdr);
        }
      } catch (error) {
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Could not retrieve token ID after mint');

  } catch (error) {
    console.error('[Soroban Mint] Error:', error);
    throw error;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as CompletePaymentRequest;
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Payment ID and txid are required' })
      };
    }

    console.log('[Complete Payment] Processing:', paymentId);

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) throw new Error('PI_API_KEY not set');

    const piVerifyResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${piApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid })
    });

    if (!piVerifyResponse.ok) {
      throw new Error('Pi payment verification failed');
    }

    console.log('[Complete Payment] Pi payment verified');

    const nftData = await sql`SELECT * FROM pending_nft_mints WHERE payment_id = ${paymentId} LIMIT 1`;
    if (nftData.length === 0) throw new Error('NFT data not found');

    const nft = nftData[0];
    console.log('[Complete Payment] NFT data:', nft.title);

    const contractId = process.env.STELLAR_NFT_CONTRACT_ID!;
    const nextTokenId = await getNextTokenId(contractId);
    console.log('[Complete Payment] Next token ID:', nextTokenId);

    const audioKeyPreview = `audio/${nextTokenId}/preview.mp3`;
    const audioKeyStd = `audio/${nextTokenId}/std.mp3`;
    const audioKeyHq = `audio/${nextTokenId}/hq.mp3`;
    
    await Promise.all([
      R2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: audioKeyPreview,
        Body: nft.audio_data,
        ContentType: nft.audio_content_type,
      })),
      R2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: audioKeyStd,
        Body: nft.audio_data,
        ContentType: nft.audio_content_type,
      })),
      R2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: audioKeyHq,
        Body: nft.audio_data,
        ContentType: nft.audio_content_type,
      }))
    ]);
    
    const audioUrl = `/api/stream/${nextTokenId}`;
    console.log('[Complete Payment] Audio uploaded for token:', nextTokenId);

    let coverIpfsHash = '';
    if (nft.cover_data) {
      try {
        const coverResult = await pinata.pinFileToIPFS(nft.cover_data, {
          pinataMetadata: { name: nft.cover_filename || `cover-${paymentId}` },
        });
        coverIpfsHash = coverResult.IpfsHash;
      } catch (error) {
        console.warn('[Complete Payment] Cover upload failed:', error);
      }
    }

    const metadata = {
      name: nft.title,
      description: nft.description,
      image: coverIpfsHash ? `ipfs://${coverIpfsHash}` : '',
      audio: audioUrl,
      external_url: `https://aurafloor.xyz/track/${nextTokenId}`,
      attributes: [
        { trait_type: 'Category', value: nft.category },
        { trait_type: 'Royalty', value: `${nft.resale_fee / 100}%` },
      ],
    };

    const metadataResult = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: { name: `${nft.title} - Metadata` },
    });
    const metadataCid = metadataResult.IpfsHash;
    console.log('[Complete Payment] Metadata CID:', metadataCid);

    const sorobanResult = await mintOnSoroban({
      minterAddress: nft.creator_wallet,
      metadataCid: metadataCid,
      audioR2Url: audioUrl,
      royaltyBasisPoints: nft.resale_fee,
      contractId: contractId
    });

    console.log('[Complete Payment] Minted token:', sorobanResult.tokenId);

    const nftIdResult = await sql`
      INSERT INTO nfts (
        blockchain_nft_id, creator_id, current_owner_id, title, description, genre,
        audio_preview_url, audio_standard_url, audio_hq_url, audio_ipfs_hash,
        cover_image_url, cover_image_ipfs_hash, metadata,
        price, resale_royalty_percent, status, blockchain_synced_at
      ) VALUES (
        ${sorobanResult.tokenId},
        (SELECT id FROM users WHERE pi_address = ${nft.creator_wallet}),
        (SELECT id FROM users WHERE pi_address = ${nft.creator_wallet}),
        ${nft.title}, ${nft.description}, ${nft.category},
        ${audioUrl}, ${audioUrl}, ${audioUrl}, ${metadataCid},
        ${coverIpfsHash ? `ipfs://${coverIpfsHash}` : null}, ${coverIpfsHash || null},
        ${JSON.stringify(metadata)},
        ${nft.price}, ${nft.resale_fee / 100}, 'active', NOW()
      ) RETURNING id
    `;

    await sql`DELETE FROM pending_nft_mints WHERE payment_id = ${paymentId}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        nft: {
          tokenId: sorobanResult.tokenId,
          nftId: nftIdResult[0].id,
          title: nft.title,
          audioUrl,
          royalty: nft.resale_fee / 100,
          transactionHash: sorobanResult.transactionHash
        }
      })
    };

  } catch (error) {
    console.error('[Complete Payment] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        error: 'Minting failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};