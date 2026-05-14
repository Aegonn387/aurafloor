import { Handler } from '@netlify/functions';
import * as StellarSdk from '@stellar/stellar-sdk';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const PI_RPC_URL = process.env.PI_RPC_URL || 'https://api.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.PI_NETWORK_PASSPHRASE || 'Pi Testnet';
const NFT_CONTRACT_ID = process.env.PI_NFT_CONTRACT || '';
const MINTER_SECRET_KEY = process.env.MINTER_SECRET_KEY || '';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    const { paymentId, creatorWallet, title, description, price, resaleFee, audioUrl, coverIpfsUrl, metadataCid } = body;

    if (!creatorWallet || !metadataCid || !audioUrl) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: creatorWallet, metadataCid, audioUrl' }) };
    }
    if (!MINTER_SECRET_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'MINTER_SECRET_KEY not configured' }) };
    if (!NFT_CONTRACT_ID) return { statusCode: 500, body: JSON.stringify({ error: 'NFT_CONTRACT_ID not configured' }) };
    const server = new StellarSdk.SorobanRpc.Server(PI_RPC_URL);
    const minterKeypair = StellarSdk.Keypair.fromSecret(MINTER_SECRET_KEY);
    const minterAddress = minterKeypair.publicKey();
    const minterAccount = await server.getAccount(minterAddress);

    const contract = new StellarSdk.Contract(NFT_CONTRACT_ID);
    const royaltyParam = {
      recipient: new StellarSdk.Address(creatorWallet),
      percentage: resaleFee ? Math.round(parseInt(resaleFee) / 100) : 10,
      is_perpetual: true,
    };

    const transaction = new StellarSdk.TransactionBuilder(minterAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('mint',
        new StellarSdk.Address(creatorWallet),
        StellarSdk.nativeToScVal(metadataCid, { type: 'string' }),
        StellarSdk.nativeToScVal(audioUrl, { type: 'string' }),
        StellarSdk.nativeToScVal(royaltyParam, { type: 'map' }),
      ))
      .setTimeout(180)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Simulation failed', details: simulated.error }) };
    }
    const prepared = StellarSdk.SorobanRpc.assembleTransaction(transaction, simulated);
    prepared.sign(minterKeypair);
    const result = await server.sendTransaction(prepared);
    let status = await server.getTransaction(result.hash);
    let attempts = 0;
    while (status.status === 'NOT_FOUND' && attempts < 10) {
      await new Promise(r => setTimeout(r, 1000));
      status = await server.getTransaction(result.hash);
      attempts++;
    }
    if (status.status !== 'SUCCESS') {
      return { statusCode: 500, body: JSON.stringify({ error: 'Transaction failed', status: status.status }) };
    }
    const tokenId = StellarSdk.scValToNative(status.returnValue);
    // Insert into nft_mints table
    await sql`
      INSERT INTO nft_mints (payment_id, creator_wallet, title, description, price, resale_fee, token_id, transaction_hash, metadata_cid, audio_url, cover_url)
    await fetch('/.netlify/functions/nft-indexer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'mint', payload: { user_pi_address: creatorWallet, token_id: tokenId, month_year: new Date().toISOString().slice(0,7), metadata: { title, description, price, royalty: resaleFee, audioUrl, coverUrl: coverIpfsUrl } } }) })
      VALUES (${paymentId || ''}, ${creatorWallet}, ${title || ''}, ${description || ''}, ${price || 0}, ${resaleFee || 0}, ${tokenId}, ${result.hash}, ${metadataCid}, ${audioUrl}, ${coverIpfsUrl || ''})
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        nft: {
          tokenId,
          title,
          royalty: resaleFee ? Math.round(parseInt(resaleFee) / 100) : 10,
          audioUrl,
          metadataCid,
          transactionHash: result.hash,
        }
      }),
    };
  } catch (error: any) {
    console.error('[mint-nft-pi] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Minting failed' }),
    };
  }
};
