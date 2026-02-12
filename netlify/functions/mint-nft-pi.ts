import { Handler } from '@netlify/functions';
import * as StellarSdk from '@stellar/stellar-sdk';

const PI_RPC_URL = process.env.PI_RPC_URL || 'https://api.testnet.minepi.com';
const NETWORK_PASSPHRASE = process.env.PI_NETWORK_PASSPHRASE || 'Pi Testnet';
const NFT_CONTRACT_ID = process.env.PI_NFT_CONTRACT || '';

/**
 * Netlify Function: Mint NFT on Pi Network
 * 
 * This function calls your deployed Soroban NFT contract on Pi Network Testnet2
 */
export const handler: Handler = async (event) => {
  // Handle CORS
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
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      minterAddress,
      minterSecretKey,
      metadataIpfsCid,
      audioR2Url,
      royaltyInfo,
    } = JSON.parse(event.body || '{}');

    // Validate inputs
    if (!minterAddress || !minterSecretKey || !metadataIpfsCid || !audioR2Url) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields',
        }),
      };
    }

    if (!NFT_CONTRACT_ID) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'NFT contract not configured',
        }),
      };
    }

    // Validate royalty percentage (5-15%)
    if (royaltyInfo && (royaltyInfo.percentage < 5 || royaltyInfo.percentage > 15)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Royalty percentage must be between 5% and 15%',
        }),
      };
    }

    // Initialize Stellar Server for Pi Network
    const server = new StellarSdk.SorobanRpc.Server(PI_RPC_URL);

    // Create keypair
    const minterKeypair = StellarSdk.Keypair.fromSecret(minterSecretKey);

    // Load account
    const minterAccount = await server.getAccount(minterAddress);

    // Build contract call transaction
    const contract = new StellarSdk.Contract(NFT_CONTRACT_ID);

    // Prepare royalty info parameter
    const royaltyParam = royaltyInfo ? {
      recipient: new StellarSdk.Address(royaltyInfo.recipient),
      percentage: royaltyInfo.percentage,
      is_perpetual: true,
    } : null;

    // Build the mint operation
    const transaction = new StellarSdk.TransactionBuilder(minterAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'mint',
          new StellarSdk.Address(minterAddress),
          StellarSdk.nativeToScVal(metadataIpfsCid, { type: 'string' }),
          StellarSdk.nativeToScVal(audioR2Url, { type: 'string' }),
          royaltyParam ? StellarSdk.nativeToScVal(royaltyParam, { type: 'map' }) : StellarSdk.xdr.ScVal.scvVoid(),
        )
      )
      .setTimeout(180)
      .build();

    // Simulate transaction first
    const simulated = await server.simulateTransaction(transaction);

    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
      // Prepare and sign the transaction
      const prepared = StellarSdk.SorobanRpc.assembleTransaction(transaction, simulated);
      prepared.sign(minterKeypair);

      // Submit transaction
      const result = await server.sendTransaction(prepared);

      // Wait for confirmation
      let status = await server.getTransaction(result.hash);
      let attempts = 0;

      while (status.status === 'NOT_FOUND' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await server.getTransaction(result.hash);
        attempts++;
      }

      if (status.status === 'SUCCESS') {
        // Extract token ID from result
        const resultValue = status.returnValue;
        const tokenId = StellarSdk.scValToNative(resultValue);

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'NFT minted successfully on Pi Network',
            tokenId,
            transactionHash: result.hash,
            metadataIpfsCid,
            audioR2Url,
          }),
        };
      } else {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Transaction failed',
            status: status.status,
          }),
        };
      }
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Transaction simulation failed',
          details: simulated.error,
        }),
      };
    }
  } catch (error: any) {
    console.error('NFT minting error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to mint NFT on Pi Network',
        details: error.message,
      }),
    };
  }
};
