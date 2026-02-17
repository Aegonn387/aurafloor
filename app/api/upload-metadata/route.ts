import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const PINATA_JWT = process.env.PINATA_JWT!;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, name, description, artist, genre, duration, bpm, externalUrl } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
    }

    const pending = await sql`
      SELECT audio_r2_url, cover_r2_url FROM pending_nft_mints WHERE payment_id = ${paymentId} LIMIT 1
    `;

    if (!pending.length || !pending[0].audio_r2_url || !pending[0].cover_r2_url) {
      return NextResponse.json({ error: 'Audio and cover must be uploaded first' }, { status: 400 });
    }

    const metadata = {
      name,
      description,
      image: pending[0].cover_r2_url,
      animation_url: pending[0].audio_r2_url,
      external_url: externalUrl || `https://aurafloor.co.za/track/${paymentId}`,
      attributes: [
        { trait_type: 'Artist', value: artist },
        { trait_type: 'Genre', value: genre },
        { trait_type: 'Duration', value: duration },
        { trait_type: 'BPM', value: bpm },
        { trait_type: 'Minted Date', value: new Date().toISOString() }
      ]
    };

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${name}-metadata.json`
        }
      })
    });

    if (!pinataResponse.ok) {
      throw new Error(`Pinata error: ${pinataResponse.statusText}`);
    }

    const pinataData = await pinataResponse.json();
    const metadataUri = `ipfs://${pinataData.IpfsHash}`;
    const metadataUrl = `${PINATA_GATEWAY}/ipfs/${pinataData.IpfsHash}`;

    await sql`
      UPDATE pending_nft_mints
      SET metadata_json = ${JSON.stringify({
        ...metadata,
        ipfs_hash: pinataData.IpfsHash,
        metadata_uri: metadataUri,
        metadata_url: metadataUrl
      })}
      WHERE payment_id = ${paymentId}
    `;

    return NextResponse.json({
      success: true,
      metadataUri,
      metadataUrl,
      ipfsHash: pinataData.IpfsHash,
      metadata
    });
  } catch (error) {
    console.error('[Metadata Upload Error]:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
