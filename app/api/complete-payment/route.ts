export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { rpc, Keypair, Contract, TransactionBuilder, Address, nativeToScVal, scValToNative } from '@stellar/stellar-sdk'
import { neon } from '@neondatabase/serverless'
import { getBackendConfig, validatePiConfig, PI_CONFIG } from '@/lib/pi-config'

const sql = neon(process.env.DATABASE_URL!)

interface CompletePaymentRequest {
  paymentId: string
  metadataCid: string
  audioUrl?: string
}

async function mintOnPiSoroban(params: {
  minterAddress: string
  metadataCid: string
  audioR2Url: string
  royaltyBasisPoints: number
  contractId: string
}): Promise<{ tokenId: string; transactionHash: string }> {
  console.log('[Soroban Mint] Starting mint for:', params.minterAddress)

  const rpcUrl = PI_CONFIG.network === 'mainnet'
    ? 'https://api.mainnet.minepi.com/rpc'
    : 'https://api.testnet.minepi.com/rpc'

  const server = new rpc.Server(rpcUrl)
  const adminSecret = process.env.MINTER_SECRET_KEY

  if (!adminSecret) {
    throw new Error('MINTER_SECRET_KEY not configured')
  }

  const adminKeypair = Keypair.fromSecret(adminSecret)
  const contract = new Contract(params.contractId)
  const adminAccount = await server.getAccount(adminKeypair.publicKey())

  const royaltyParam = {
    recipient: params.minterAddress,
    basis_points: params.royaltyBasisPoints,
    is_fixed: true,
    additional_payees: [],
  }

  const transaction = new TransactionBuilder(adminAccount, {
    fee: '1000000',
    networkPassphrase: PI_CONFIG.contractConfig.networkPassphrase,
  })
    .addOperation(
      contract.call(
        'mint',
        new Address(params.minterAddress).toScVal(),
        nativeToScVal(params.metadataCid, { type: 'string' }),
        nativeToScVal(params.audioR2Url, { type: 'string' }),
        nativeToScVal(royaltyParam, { type: 'map' }),
      )
    )
    .setTimeout(30)
    .build()

  transaction.sign(adminKeypair)

  const simulateResponse = await server.simulateTransaction(transaction)

  if (rpc.Api.isSimulationError(simulateResponse)) {
    throw new Error('Simulation failed: ' + simulateResponse.error)
  }

  const preparedTransaction = rpc.assembleTransaction(transaction, simulateResponse).build()
  preparedTransaction.sign(adminKeypair)

  const sendResponse = await server.sendTransaction(preparedTransaction)

  if (sendResponse.status === 'ERROR') {
    throw new Error('Send failed: ' + sendResponse.errorResult)
  }

  const txHash = sendResponse.hash
  console.log('[Soroban Mint] Transaction sent:', txHash)

  let attempts = 0
  const maxAttempts = 30

  while (attempts < maxAttempts) {
    const txResponse = await server.getTransaction(txHash)

    if (txResponse.status === 'SUCCESS' && txResponse.returnValue) {
      const tokenIdVal = scValToNative(txResponse.returnValue)
      console.log('[Soroban Mint] Minted! Token ID:', tokenIdVal)
      return {
        tokenId: tokenIdVal.toString(),
        transactionHash: txHash,
      }
    }

    if (txResponse.status === 'FAILED') {
      throw new Error('Transaction failed: ' + txResponse.resultXdr)
    }

    attempts++
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  throw new Error('Could not retrieve token ID after mint')
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
  }

  try {
    const body = JSON.parse(await req.text() || '{}') as CompletePaymentRequest
    const { paymentId, metadataCid, audioUrl } = body

    if (!paymentId || !metadataCid) {
      return NextResponse.json(
        { error: 'Payment ID and Metadata CID are required' },
        { status: 400 }
      )
    }

    console.log('[Complete Payment] Processing payment:', paymentId)
    console.log('[Complete Payment] Metadata CID:', metadataCid)
    console.log('[Complete Payment] Audio URL:', audioUrl || 'not provided')

    const configCheck = validatePiConfig()
    if (!configCheck.valid) {
      console.error('[Complete Payment] Config errors:', configCheck.errors)
      return NextResponse.json(
        { error: 'Server configuration error', details: configCheck.errors },
        { status: 500 }
      )
    }

    const backend = getBackendConfig()

    const nftData = await sql`SELECT * FROM pending_nft_mints WHERE payment_id = ${paymentId} LIMIT 1`

    if (nftData.length === 0) {
      throw new Error('NFT data not found for this payment ID')
    }

    const nft = nftData[0]
    console.log('[Complete Payment] Found NFT data:', nft.title)

    const userData = await sql`
      SELECT stellar_public_key FROM u WHERE id = ${nft.creator_wallet} LIMIT 1
    `

    if (userData.length === 0 || !userData[0].stellar_public_key) {
      throw new Error('User Stellar address not found')
    }

    const minterStellarAddress = userData[0].stellar_public_key
    console.log('[Complete Payment] Stellar address:', minterStellarAddress)

    const contractId = process.env.PI_NFT_CONTRACT

    if (!contractId) {
      throw new Error('PI_NFT_CONTRACT not configured')
    }

    const finalAudioUrl = audioUrl || `/api/stream/${paymentId}`
    console.log('[Complete Payment] Audio URL:', finalAudioUrl)
    console.log('[Complete Payment] Contract:', contractId)

    const sorobanResult = await mintOnPiSoroban({
      minterAddress: minterStellarAddress,
      metadataCid: metadataCid,
      audioR2Url: finalAudioUrl,
      royaltyBasisPoints: nft.resale_fee,
      contractId: contractId,
    })

    console.log('[Complete Payment] Minted token:', sorobanResult.tokenId)

    const completeRes = await fetch(`${backend.baseUrl}/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: backend.headers,
      body: JSON.stringify({ txid: sorobanResult.transactionHash }),
    })

    if (!completeRes.ok) {
      const completeError = await completeRes.text()
      console.error('[Complete Payment] Pi completion failed:', completeError)
    }

    const nftIdResult = await sql`
      INSERT INTO n (
        bnid, crid, ownerid, title, descr, genre, etype, ted,
        aprev, astd, ahq, aipfs, cimg, cipfs, meta, price, royalty, st, bcsync
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
    `

    await sql`
      INSERT INTO notif (uid, type, title, msg, actor_uid, nid, amt, action)
      VALUES (
        ${nft.creator_wallet},
        'system',
        'NFT Minted Successfully',
        ${`Your NFT "${nft.title}" has been minted with token ID: ${sorobanResult.tokenId}`},
        ${nft.creator_wallet},
        ${nftIdResult[0].id},
        ${nft.price},
        'minted'
      )
    `

    await sql`DELETE FROM pending_nft_mints WHERE payment_id = ${paymentId}`

    return NextResponse.json({
      success: true,
      nft: {
        tokenId: sorobanResult.tokenId,
        nftId: nftIdResult[0].id,
        title: nft.title,
        audioUrl: finalAudioUrl,
        royalty: nft.resale_fee / 100,
        transactionHash: sorobanResult.transactionHash,
        metadataCid: metadataCid,
      },
    }, { status: 200 })

  } catch (error) {
    console.error('[Complete Payment] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Minting failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
