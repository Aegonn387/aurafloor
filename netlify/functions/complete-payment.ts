import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import pinataSDK from '@pinata/sdk';

const sql = neon(process.env.DATABASE_URL!);

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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

async function mintOnSoroban(params: {
  creatorAddress: string;
  tokenUri: string;
  royaltyBps: number;
  contractId: string;
}) {
  const StellarSdk = require('@stellar/stellar-sdk');
  const server = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');
  const adminSecret = process.env.STELLAR_ADMIN_SECRET;
  if (!adminSecret) throw new Error('STELLAR_ADMIN_SECRET not configured');

  const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecret);
  const contract = new StellarSdk.Contract(params.contractId);
  const adminAccount = await server.getAccount(adminKeypair.publicKey());

  const transaction = new StellarSdk.TransactionBuilder(adminAccount, {
    fee: '100000',
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'mint',
        StellarSdk.Address.fromString(params.creatorAddress).toScVal(),
        StellarSdk.nativeToScVal(params.tokenUri, { type: 'string' }),
        StellarSdk.nativeToScVal(params.royaltyBps, { type: 'u32' })
      )
    )
    .setTimeout(30)
    .build();

  transaction.sign(adminKeypair);
  const sim = await server.simulateTransaction(transaction);
  if (sim.error) throw new Error('Simulation failed: ' + JSON.stringify(sim.error));

  const prepared = StellarSdk.SorobanRpc.assembleTransaction(transaction, sim).build();
  prepared.sign(adminKeypair);
  const send = await server.sendTransaction(prepared);
  if (send.status === 'ERROR') throw new Error('Send failed: ' + send.errorResult);

  const txHash = send.hash;
  for (let i = 0; i < 30; i++) {
    const txResp = await server.getTransaction(txHash);
    if (txResp.status === 'SUCCESS' && txResp.returnValue) {
      const tokenId = StellarSdk.scValToNative(txResp.returnValue).toString();
      return { tokenId, transactionHash: txHash };
    }
    if (txResp.status === 'FAILED') throw new Error('Transaction failed');
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Could not retrieve token ID after mint');
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}') as CompletePaymentRequest;
    const { paymentId, txid } = body;
    if (!paymentId || !txid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'paymentId and txid required' }) };
    }

    const PI_API_KEY = process.env.PI_API_KEY;
    if (!PI_API_KEY) throw new Error('PI_API_KEY not set');

    // 1. Complete Pi payment
    const completeRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid }),
    });
    if (!completeRes.ok) {
      const err = await completeRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Pi completion failed', details: err }) };
    }

    // 2. Get payment details
    const detailsRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` },
    });
    if (!detailsRes.ok) throw new Error('Failed to get payment details');
    const details = await detailsRes.json();
    console.log('Payment completed:', details.amount, details.memo);

    // 3. Get NFT data from pending_nft_mints
    const nftData = await sql`SELECT * FROM pending_nft_mints WHERE payment_id = ${paymentId} LIMIT 1`;
    if (nftData.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'No NFT pending, payment completed' }) };
    }

    const nft = nftData[0] as PendingNFTData;

    // Upload audio to R2
    const audioKey = `audio/${paymentId}-${nft.audio_filename}`;
    await R2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: audioKey,
      Body: nft.audio_data,
      ContentType: nft.audio_content_type,
    }));
    const audioUrl = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${audioKey}`;

    // Upload cover to IPFS (if any)
    let coverIpfsHash = '';
    if (nft.cover_data && nft.cover_filename) {
      try {
        const coverResult = await pinata.pinFileToIPFS(nft.cover_data, {
          pinataMetadata: { name: nft.cover_filename },
        });
        coverIpfsHash = coverResult.IpfsHash;
      } catch (e) {
        console.warn('Cover upload failed', e);
      }
    }

    // Upload metadata to IPFS
    const metadata = {
      name: nft.title,
      description: nft.description,
      image: coverIpfsHash ? `ipfs://${coverIpfsHash}` : '',
      animation_url: audioUrl,
      external_url: `https://aurafloor.co.za/nft/${paymentId}`,
      attributes: [
        { trait_type: 'Category', value: nft.category },
        { trait_type: 'Edition', value: nft.edition_type || 'Single' },
      ],
    };
    const metadataResult = await pinata.pinJSONToIPFS(metadata, { pinataMetadata: { name: `${nft.title} Metadata` } });
    const tokenUri = `ipfs://${metadataResult.IpfsHash}`;

    // Mint on Stellar testnet
    const contractId = process.env.STELLAR_NFT_CONTRACT_ID || 'CDWCKCICMF2CQQ32V56BHBAMLXUAQYGOWYMY2UMUWCNNP5LVUPZS5O2H'; // fallback to hardcoded if not set
    const mintResult = await mintOnSoroban({
      creatorAddress: nft.creator_wallet,
      tokenUri,
      royaltyBps: nft.resale_fee,
      contractId,
    });

    // Save NFT to database (adjust table/columns as needed)
    const nftIdResult = await sql`
      INSERT INTO nfts (
        blockchain_nft_id, creator_id, current_owner_id, title, description, genre,
        audio_preview_url, audio_standard_url, audio_hq_url, audio_ipfs_hash,
        cover_image_url, cover_image_ipfs_hash, metadata, edition_type, total_editions,
        price, resale_royalty_percent, status, blockchain_synced_at
      ) VALUES (
        ${mintResult.tokenId},
        (SELECT id FROM users WHERE pi_address = ${nft.creator_wallet}),
        (SELECT id FROM users WHERE pi_address = ${nft.creator_wallet}),
        ${nft.title}, ${nft.description}, ${nft.category},
        ${audioUrl}, ${audioUrl}, ${audioUrl}, ${metadataResult.IpfsHash},
        ${coverIpfsHash ? `ipfs://${coverIpfsHash}` : null}, ${coverIpfsHash || null},
        ${JSON.stringify(metadata)}, ${nft.edition_type}, ${nft.total_editions},
        ${nft.price}, ${nft.resale_fee / 100}, 'active', NOW()
      )
      RETURNING id
    `;
    const nftId = nftIdResult[0].id;

    // Delete pending record
    await sql`DELETE FROM pending_nft_mints WHERE payment_id = ${paymentId}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        nft: {
          tokenId: mintResult.tokenId,
          nftId,
          audioUrl,
          title: nft.title,
        },
      }),
    };
  } catch (error: any) {
    console.error('Complete Payment Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Completion failed', details: error.message }),
    };
  }
};
