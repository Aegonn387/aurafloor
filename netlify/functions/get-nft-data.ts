import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const handler: Handler = async (event) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const tokenId = event.queryStringParameters?.tokenId; // bnid from n table
    const nftId = event.queryStringParameters?.nftId;     // id from n table (UUID)

    if (!tokenId && !nftId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing tokenId or nftId parameter' }),
      };
    }

    // Core Query: Matches YOUR database schema exactly
    const query = `
      SELECT
        n.id AS internal_id,
        n.bnid AS blockchain_token_id,
        n.title,
        n.descr AS description,
        n.genre,
        n.dur AS duration_seconds,
        -- Audio URLs from your 'n' table
        n.aprev AS preview_audio_url,
        n.astd AS standard_audio_url,
        n.ahq AS high_quality_audio_url,
        n.aipfs AS audio_ipfs_cid,
        -- Cover image from your 'n' table
        n.cimg AS cover_image_url,
        n.cipfs AS cover_ipfs_cid,
        -- Blockchain & monetization data
        n.meta AS metadata_json,
        n.royalty,
        n.price,
        n.scount AS stream_count,
        n.lcount AS like_count,
        n.pcount AS purchase_count,
        n.st AS nft_status,
        n.bcsync AS last_blockchain_sync,
        n.ca AS created_at,
        n.ua AS updated_at,
        -- Creator info (joined from 'u' table)
        creator.id AS creator_id,
        creator.dname AS creator_display_name,
        creator.piaddr AS creator_pi_address,
        creator.stellar_public_key AS creator_stellar_key,
        -- Owner info (joined from 'u' table)
        owner.id AS owner_id,
        owner.dname AS owner_display_name,
        owner.piaddr AS owner_pi_address,
        -- Transaction (joined from 't' table - may be NULL for now)
        t.btx AS mint_transaction_hash,
        t.ca AS transaction_date
      FROM n
      LEFT JOIN u AS creator ON n.crid = creator.id
      LEFT JOIN u AS owner ON n.ownerid = owner.id
      LEFT JOIN t ON n.id = t.nid AND t.type = 'mint'
      WHERE ${tokenId ? 'n.bnid = $1' : 'n.id = $1'}
      ORDER BY t.ca DESC NULLS LAST
      LIMIT 1
    `;

    const result = await sql(query, [tokenId || nftId]);

    if (result.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'NFT not found in database' }),
      };
    }

    const nft = result[0];

    // Build a clean response matching your player's expected format
    const response = {
      success: true,
      data: {
        // Core player fields
        id: nft.blockchain_token_id || nft.internal_id,
        title: nft.title,
        artist: nft.creator_display_name || 'Unknown Artist',
        coverUrl: nft.cover_image_url || '/placeholder-cover.jpg',
        audioUrl: nft.preview_audio_url || nft.standard_audio_url || '',
        duration: nft.duration_seconds || 180,
        price: parseFloat(nft.price) || 0,
        
        // Extended fields for your UI
        description: nft.description,
        genre: nft.genre,
        streamCount: nft.stream_count || 0,
        likeCount: nft.like_count || 0,
        royalty: parseFloat(nft.royalty) || 10,
        status: nft.nft_status,
        
        // Real blockchain data
        blockchainData: {
          tokenId: nft.blockchain_token_id,
          creator: {
            id: nft.creator_id,
            name: nft.creator_display_name,
            piAddress: nft.creator_pi_address,
            stellarKey: nft.creator_stellar_key,
          },
          owner: {
            id: nft.owner_id,
            name: nft.owner_display_name,
            piAddress: nft.owner_pi_address,
          },
          transactionHash: nft.mint_transaction_hash,
          mintDate: nft.transaction_date,
          lastSync: nft.last_blockchain_sync,
          ipfs: {
            audio: nft.audio_ipfs_cid,
            cover: nft.cover_ipfs_cid,
          },
          urls: {
            audioPreview: nft.preview_audio_url,
            audioStandard: nft.standard_audio_url,
            audioHQ: nft.high_quality_audio_url,
            coverImage: nft.cover_image_url,
          }
        }
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('❌ [get-nft-data] Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Database query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
