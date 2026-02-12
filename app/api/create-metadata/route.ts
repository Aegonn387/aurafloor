import { NextRequest, NextResponse } from 'next/server'
import pinataSDK from '@pinata/sdk'

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, nftTitle, description, creator, imageUrl, audioUrl, duration } = body

    if (!paymentId || !nftTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentId and nftTitle' },
        { status: 400 }
      )
    }

    const enhancedMetadata = {
      name: nftTitle,
      description: description || `An exclusive audio NFT by ${creator}`,
      image: imageUrl || '',
      audio: audioUrl || '',
      properties: {
        creator: creator || 'Unknown',
        duration: duration || 0,
        type: 'audio',
        paymentId,
      },
      attributes: [
        {
          trait_type: 'Creator',
          value: creator || 'Unknown',
        },
        {
          trait_type: 'Duration',
          value: duration || 0,
        },
        {
          trait_type: 'Type',
          value: 'Audio NFT',
        },
      ],
    }

    const pinataOptions = {
      pinataMetadata: {
        name: `${nftTitle} - Metadata`,
      },
      pinataOptions: {
        cidVersion: 1 as const,
      },
    }

    console.log('[Create Metadata] Uploading metadata to IPFS...')
    const pinataResult = await pinata.pinJSONToIPFS(enhancedMetadata, pinataOptions)
    const metadataCid = pinataResult.IpfsHash
    const metadataIpfsUrl = `ipfs://${metadataCid}`
    const metadataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${metadataCid}`

    console.log('[Create Metadata] Metadata uploaded successfully:', {
      cid: metadataCid,
      ipfsUrl: metadataIpfsUrl,
      gatewayUrl: metadataGatewayUrl,
    })

    return NextResponse.json({
      success: true,
      metadataCid,
      metadataIpfsUrl,
      metadataGatewayUrl,
      metadata: enhancedMetadata,
    })
  } catch (error: any) {
    console.error('[Create Metadata] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create metadata', details: error.message },
      { status: 500 }
    )
  }
}
