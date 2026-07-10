import { Handler } from '@netlify/functions';
import { rpc, Keypair, Contract, TransactionBuilder, BASE_FEE, Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { neon } from '@neondatabase/serverless';
import { getBackendConfig, validatePiConfig, PI_CONFIG } from '../../lib/pi-config';

const sql = neon(process.env.DATABASE_URL!);
const MINTER_SECRET_KEY = process.env.MINTER_SECRET_KEY || '';
const NFT_CONTRACT_ID = process.env.PI_NFT_CONTRACT || '';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const configCheck = validatePiConfig();
  if (!configCheck.valid) {
    console.error('[mint-nft-pi] Config errors:', configCheck.errors);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error', details: configCheck.errors }),
    };
  }

  if (!MINTER_SECRET_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'MINTER_SECRET_KEY not configured' }),
    };
  }

  if (!NFT_CONTRACT_ID) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'NFT_CONTRACT_ID not configured' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { paymentId, creatorWallet, title, description, price, resaleFee, audioUrl, coverIpfsUrl, metadataCid } = body;

    if (!paymentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required field: paymentId' }),
      };
    }

    if (!creatorWallet || !metadataCid || !audioUrl) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: creatorWallet, metadataCid, audioUrl' }),
      };
    }

    const backend = getBackendConfig();

    const paymentVerifyRes = await fetch(`${backend.baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: backend.headers,
    });

    if (!paymentVerifyRes.ok) {
      const errorText = await paymentVerifyRes.text();
      console.error('[mint-nft-pi] Payment verification failed:', errorText);
      return {
        statusCode: 402,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment verification failed', details: errorText }),
      };
    }

    const paymentData = await paymentVerifyRes.json();

    if (paymentData.status?.transaction_verified !== true) {
      return {
        statusCode: 402,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment not verified on Pi blockchain', status: paymentData.status }),
      };
    }

    const rpcUrl = PI_CONFIG.network === 'mainnet'
      ? 'https://api.mainnet.minepi.com/rpc'
      : 'https://api.testnet.minepi.com/rpc';

    const server = new rpc.Server(rpcUrl);
    const minterKeypair = Keypair.fromSecret(MINTER_SECRET_KEY);
    const minterAddress = minterKeypair.publicKey();
    const minterAccount = await server.getAccount(minterAddress);

    const contract = new Contract(NFT_CONTRACT_ID);

    const royaltyParam = {
      recipient: new Address(creatorWallet).toScVal(),
      basis_points: resaleFee ? Math.round(parseInt(resaleFee) / 100) : 10,
      is_fixed: true,
      additional_payees: [],
    };

    const transaction = new TransactionBuilder(minterAccount, {
      fee: BASE_FEE,
      networkPassphrase: PI_CONFIG.contractConfig.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'mint',
          new Address(creatorWallet).toScVal(),
          nativeToScVal(metadataCid, { type: 'string' }),
          nativeToScVal(audioUrl, { type: 'string' }),
          nativeToScVal(royaltyParam, { type: 'map' }),
        )
      )
      .setTimeout(180)
      .build();

    const simulated = await server.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulated)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Simulation failed', details: simulated.error }),
      };
    }

    const prepared = rpc.assembleTransaction(transaction, simulated).build();
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
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Transaction failed', status: status.status, hash: result.hash }),
      };
    }

    const tokenId = scValToNative(status.returnValue!);

    const completeRes = await fetch(`${backend.baseUrl}/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: backend.headers,
      body: JSON.stringify({ txid: result.hash }),
    });

    if (!completeRes.ok) {
      const completeError = await completeRes.text();
      console.error('[mint-nft-pi] Payment completion failed:', completeError);
    }

    await sql`
      INSERT INTO nft_mints (
        payment_id, creator_wallet, title, description, price,
        resale_fee, token_id, transaction_hash, metadata_cid,
        audio_url, cover_url
      ) VALUES (
        ${paymentId}, ${creatorWallet}, ${title || ''}, ${description || ''},
        ${price || 0}, ${resaleFee || 0}, ${tokenId}, ${result.hash},
        ${metadataCid}, ${audioUrl}, ${coverIpfsUrl || ''}
      )
    `;

    try {
      await fetch('/.netlify/functions/nft-indexer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mint',
          payload: {
            user_pi_address: creatorWallet,
            token_id: tokenId,
            month_year: new Date().toISOString().slice(0, 7),
            metadata: {
              title,
              description,
              price,
              royalty: resaleFee,
              audioUrl,
              coverUrl: coverIpfsUrl,
            },
          },
        }),
      });
    } catch (indexerError) {
      console.error('[mint-nft-pi] Indexer error (non-critical):', indexerError);
    }

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
          coverUrl: coverIpfsUrl,
          metadataCid,
          transactionHash: result.hash,
          paymentId,
        },
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
