import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import pinataSDK from '@pinata/sdk';
import * as StellarSdk from '@stellar/stellar-sdk';

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

// --------------------------------------------------------------
// Soroban helpers – authoritative on-chain NFT state
// --------------------------------------------------------------

async function getNextTokenId(contractId: string): Promise<number> {
  const adminSecret = process.env.STELLAR_ADMIN_SECRET;
  if (!adminSecret) throw new Error('STELLAR_ADMIN_SECRET not configured');

  const server = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org');
  const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecret);
  const contract = new StellarSdk.Contract(contractId);
  const sourceAccount = await server.getAccount(adminKeypair.publicKey());

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100000',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(contract.call('get_next_token_id'))
    .setTimeout(30)
    .build();

  tx.sign(adminKeypair);
  const simulateResponse = await server.simulateTransaction(tx);

  if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulateResponse)) {
    const nextIdScVal = simulateResponse.result?.retval;
    if (nextIdScVal) {
      return StellarSdk.scValToNative(nextIdScVal);
    }
  }
  throw new Error('Failed to get next token ID');
}

async function mintOnSoroban(params: {
  minterAddress: string;
  metadataCid: string;
  audioR2Url: string;
  royaltyBasisPoints: number;
  contractId: string;
}): Promise<{ tokenId: string; transactionHash: string }> {
  const adminSecret = process.env.STELLAR_ADMIN_SECRET;
  if (!adminSecret) throw new Error('STELLAR_ADMIN_SECRET not configured');

  const server = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org');
  const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecret);
  const contract = new StellarSdk.Contract(params.contractId);
  const adminAccount = await server.getAccount(adminKeypair.publicKey());

  const royaltyInfo = {
    recipient: new StellarSdk.Address(params.minterAddress),
    percentage: params.royaltyBasisPoints,
    is_perpetual: true,
  };

  const tx = new StellarSdk.TransactionBuilder(adminAccount, {
    fee: '100000',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'mint',
        new StellarSdk.Address(params.minterAddress).toScVal(),
        StellarSdk.nativeToScVal(params.metadataCid, { type: 'string' }),
        StellarSdk.nativeToScVal(params.audioR2Url, { type: 'string' }),
        StellarSdk.nativeToScVal(royaltyInfo, { type: 'map' })
      )
    )
    .setTimeout(30)
    .build();

  tx.sign(adminKeypair);
  const simulateResponse = await server.simulateTransaction(tx);
  if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulateResponse)) {
    throw new Error('Simulation failed: ' + JSON.stringify(simulateResponse));
  }

  const preparedTx = StellarSdk.SorobanRpc.assembleTransaction(tx, simulateResponse);
  preparedTx.sign(adminKeypair);
  const sendResponse = await server.sendTransaction(preparedTx);
  if (sendResponse.status === 'ERROR') {
    throw new Error('Send failed: ' + JSON.stringify(sendResponse));
  }

  const txHash = sendResponse.hash;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const txResponse = await server.getTransaction(txHash);
      if (txResponse.status === 'SUCCESS') {
        const tokenIdVal = StellarSdk.scValToNative(txResponse.returnValue!);
        return { tokenId: tokenIdVal.toString(), transactionHash: txHash };
      }
      if (txResponse.status === 'FAILED') {
        throw new Error('Transaction failed: ' + txResponse.resultXdr);
      }
    } catch (e) {}
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Could not retrieve token ID after mint');
}

// --------------------------------------------------------------
// Main handler
// --------------------------------------------------------------
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as CompletePaymentRequest;
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Payment ID and txid are required' }),
      };
    }

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) throw new Error('PI_API_KEY not set');

    const piVerifyResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${piApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid }),
    });
    if (!piVerifyResponse.ok) throw new Error('Pi payment verification failed');

    const nftData = await sql`
      SELECT * FROM pending_nft_mints WHERE payment_id = ${paymentId} LIMIT 1
    `;
    if (nftData.length === 0) throw new Error('NFT data not found');
    const nft = nftData[0];

    const contractId = process.env.STELLAR_NFT_CONTRACT_ID!;
    const nextTokenId = await getNextTokenId(contractId);

    const audioKeyPreview = `audio/${nextTokenId}/preview.mp3`;
    const audioKeyStd = `audio/${nextTokenId}/std.mp3`;
    const audioKeyHq = `audio/${nextTokenId}/hq.mp3`;

    let audioBuffer: Buffer;
    if (Buffer.isBuffer(nft.audio_data)) {
      audioBuffer = nft.audio_data;
    } else if (typeof nft.audio_data === 'string') {
      audioBuffer = Buffer.from(nft.audio_data, 'base64');
    } else {
      audioBuffer = nft.audio_data;
    }

    await Promise.all([
      R2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: audioKeyPreview, Body: audioBuffer, ContentType: nft.audio_content_type })),
      R2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: audioKeyStd, Body: audioBuffer, ContentType: nft.audio_content_type })),
      R2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: audioKeyHq, Body: audioBuffer, ContentType: nft.audio_content_type })),
    ]);

    const audioUrl = `/api/stream/${nextTokenId}`;

    let coverIpfsHash = '';
    if (nft.cover_data) {
      try {
        const coverResult = await pinata.pinFileToIPFS(nft.cover_data, {
          pinataMetadata: { name: nft.cover_filename || `cover-${paymentId}` },
        });
        coverIpfsHash = coverResult.IpfsHash;
      } catch (error) {
        console.warn('Cover upload failed:', error);
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

    const sorobanResult = await mintOnSoroban({
      minterAddress: nft.creator_wallet,
      metadataCid: metadataCid,
      audioR2Url: audioUrl,
      royaltyBasisPoints: nft.resale_fee,
      contractId: contractId,
    });

    // Database is a cache/index; authoritative ownership is on Soroban
    const nftIdResult = await sql`
      INSERT INTO n (
        bnid, title, descr, genre, aprev, astd, ahq, aipfs, cimg, cipfs,
        meta, royalty, price, st, crid, ownerid, bcsync, ca, ua
      ) VALUES (
        ${sorobanResult.tokenId},
        ${nft.title},
        ${nft.description},
        ${nft.category},
        ${audioUrl},
        ${audioUrl},
        ${audioUrl},
        ${metadataCid},
        ${coverIpfsHash ? `ipfs://${coverIpfsHash}` : null},
        ${coverIpfsHash || null},
        ${JSON.stringify(metadata)},
        ${nft.resale_fee / 100},
        ${nft.price},
        'active',
        (SELECT id FROM u WHERE piaddr = ${nft.creator_wallet}),
        (SELECT id FROM u WHERE piaddr = ${nft.creator_wallet}),
        NOW(),
        NOW(),
        NOW()
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
          transactionHash: sorobanResult.transactionHash,
        },
      }),
    };
  } catch (error) {
    console.error('Complete payment error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        error: 'Minting failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
