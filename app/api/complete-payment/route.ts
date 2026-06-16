export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface CompletePaymentRequest {
  paymentId: string;
  metadataCid: string;
  audioUrl?: string;
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

    // FIXED: Import entire SDK and use sdk.rpc instead of SorobanRpc
    const sdk = require('@stellar/stellar-sdk');
    const {
      Keypair,
      Contract,
      TransactionBuilder,
      Networks,
      Address,
      xdr,
      scValToNative
    } = sdk;

    // FIXED: Use sdk.rpc.Server instead of SorobanRpc.Server
    const server = new sdk.rpc.Server('https://soroban-testnet.stellar.org');
    const adminSecret = process.env.STELLAR_ADMIN_SECRET;

    if (!adminSecret) {
      throw new Error('STELLAR_ADMIN_SECRET not configured');
    }

    const adminKeypair = Keypair.fromSecret(adminSecret);
    const contract = new Contract(params.contractId);
    const adminAccount = await server.getAccount(adminKeypair.publicKey());

    // FIXED: Keys MUST be in alphabetical order: additional_payees, basis_points, is_fixed, recipient
    const royaltyInfo = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("additional_payees"), // A
        val: xdr.ScVal.scvVec([])
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("basis_points"),      // B
        val: xdr.ScVal.scvU32(params.royaltyBasisPoints)
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("is_fixed"),          // I
        val: xdr.ScVal.scvBool(true)
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("recipient"),         // R
        val: new Address(params.minterAddress).toScVal()
      })
    ]);

    console.log('[Soroban Mint] Built royalty info ScVal with sorted keys');

    const transaction = new TransactionBuilder(adminAccount, {
      fee: '1000000',
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          'mint',
          Address.fromString(params.minterAddress).toScVal(),
          xdr.ScVal.scvString(params.metadataCid),
          xdr.ScVal.scvString(params.audioR2Url),
          royaltyInfo
        )
      )
      .setTimeout(30)
      .build();

    transaction.sign(adminKeypair);

    const simulateResponse = await server.simulateTransaction(transaction);
    if (simulateResponse.error) {
      console.error('[Soroban Mint] Simulation error:', simulateResponse.error);
      throw new Error('Simulation failed: ' + JSON.stringify(simulateResponse.error));
    }

    // FIXED: Use sdk.rpc.assembleTransaction instead of SorobanRpc.assembleTransaction
    const preparedTransaction = sdk.rpc.assembleTransaction(
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
          const tokenIdVal = scValToNative(txResponse.returnValue);
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
        // Continue polling
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

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const body = JSON.parse(await req.text() || '{}') as CompletePaymentRequest;
    const { paymentId, metadataCid, audioUrl } = body;

    if (!paymentId || !metadataCid) {
      return NextResponse.json({
        error: 'Payment ID and Metadata CID are required'
      }, { status: 400 });
    }

    console.log('[Complete Payment] Processing payment:', paymentId);
    console.log('[Complete Payment] Received Metadata CID:', metadataCid);
    console.log('[Complete Payment] Received Audio URL:', audioUrl || 'not provided');

    const nftData = await sql`SELECT * FROM pending_nft_mints WHERE payment_id = ${paymentId} LIMIT 1`;
    if (nftData.length === 0) {
      throw new Error('NFT data not found for this payment ID');
    }

    const nft = nftData[0];
    console.log('[Complete Payment] Found NFT data:', nft.title);

    const userData = await sql`
      SELECT stellar_public_key FROM u WHERE id = ${nft.creator_wallet} LIMIT 1
    `;

    if (userData.length === 0 || !userData[0].stellar_public_key) {
      throw new Error('User Stellar address not found. User may need to connect their Stellar wallet.');
    }

    const minterStellarAddress = userData[0].stellar_public_key;
    console.log('[Complete Payment] Found Stellar address for minter:', minterStellarAddress);

    const contractId = process.env.STELLAR_NFT_CONTRACT_ID;
    if (!contractId) {
      throw new Error('STELLAR_NFT_CONTRACT_ID not configured');
    }

    const finalAudioUrl = audioUrl || `/api/stream/${paymentId}`;

    console.log('[Complete Payment] Using audio URL:', finalAudioUrl);
    console.log('[Complete Payment] Using contract:', contractId);

    const sorobanResult = await mintOnSoroban({
      minterAddress: minterStellarAddress,
      metadataCid: metadataCid,
      audioR2Url: finalAudioUrl,
      royaltyBasisPoints: nft.resale_fee,
      contractId: contractId
    });

    console.log('[Complete Payment] Successfully minted token:', sorobanResult.tokenId);

    // FIXED: Use table 'n' with correct column names
    // Column mapping: bnid=blockchain_nft_id, crid=creator_id, ownerid=current_owner_id, 
    // descr=description, aprev=audio_preview_url, astd=audio_standard_url, ahq=audio_hq_url,
    // aipfs=audio_ipfs_hash, cimg=cover_image_url, cipfs=cover_image_ipfs_hash,
    // meta=metadata, royalty=resale_royalty_percent, st=status, bcsync=blockchain_synced_at
    const nftIdResult = await sql`
      INSERT INTO n (
        bnid,
        crid,
        ownerid,
        title,
        descr,
        genre,
        etype,
        ted,
        aprev,
        astd,
        ahq,
        aipfs,
        cimg,
        cipfs,
        meta,
        price,
        royalty,
        st,
        bcsync
      ) VALUES (
        ${sorobanResult.tokenId},
        ${nft.creator_wallet},
        ${nft.creator_wallet},
        ${nft.title},
        ${nft.description || ''},
        ${nft.category || ''}, 
        ${nft.edition_type || null},
        ${nft.total_editions || null},
        ${finalAudioUrl},
        ${finalAudioUrl},
        ${finalAudioUrl},
        ${metadataCid},
        ${nft.cover_r2_url || null},
        ${null},
        ${nft.metadata_json || JSON.stringify({ cid: metadataCid })},
        ${nft.price},
        ${nft.resale_fee / 100},
        'active',
        NOW()
      ) RETURNING id
    `;

    // ===== ADDED: NOTIFICATION FOR NFT CREATOR =====
    await sql`
      INSERT INTO notif (uid, type, title, msg, actor_uid, nid, amt, action)
      VALUES (
        ${nft.creator_wallet},
        'system',
        'NFT Minted Successfully',
        ${`Your NFT "${nft.title}" has been minted on Stellar with token ID: ${sorobanResult.tokenId}`},
        ${nft.creator_wallet},
        ${nftIdResult[0].id},
        ${nft.price},
        'minted'
      )
    `;
    // ===== END ADDITION =====

    await sql`DELETE FROM pending_nft_mints WHERE payment_id = ${paymentId}`;

    return NextResponse.json({
      success: true,
      nft: {
        tokenId: sorobanResult.tokenId,
        nftId: nftIdResult[0].id,
        title: nft.title,
        audioUrl: finalAudioUrl,
        royalty: nft.resale_fee / 100,
        transactionHash: sorobanResult.transactionHash,
        metadataCid: metadataCid
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Complete Payment] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Minting on Stellar failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

