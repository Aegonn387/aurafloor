// scripts/nft-indexer.js - PRODUCTION VERSION
const { neon } = require('@neondatabase/serverless');
const { execSync } = require('child_process');

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);

// Configuration
const INDEXER_INTERVAL_MINUTES = 2; // Run every 2 minutes
const BATCH_SIZE = 50; // Process NFTs in batches

console.log('🚀 NFT Indexer Started - PRODUCTION MODE');
console.log('=========================================');

async function runProductionIndexer() {
  const startTime = Date.now();
  let processedCount = 0;
  let errorCount = 0;

  try {
    console.log(`[${new Date().toISOString()}] Starting sync cycle...`);

    // Step 1: Fetch NFTs from Stellar blockchain
    console.log('Fetching NFT data from Stellar blockchain...');
    
    // Use your existing API endpoint (which already works)
    const response = await fetch('http://localhost:3000/api/stellar/get-listing?getAll=true');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.listings) {
      throw new Error('Invalid response from Stellar API');
    }

    const listings = result.listings;
    console.log(`Found ${listings.length} NFTs on blockchain`);

    // Step 2: Process each NFT and update database
    for (const listing of listings) {
      try {
        await processNFT(listing);
        processedCount++;
      } catch (error) {
        console.error(`Error processing NFT ${listing.tokenId}:`, error.message);
        errorCount++;
      }
    }

    // Step 3: Clean up old NFTs no longer on blockchain
    await cleanupOldNFTs(listings.map(l => l.tokenId));

    const duration = Date.now() - startTime;
    console.log(`\n✅ Sync completed in ${duration}ms`);
    console.log(`   Processed: ${processedCount} NFTs`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Next run in ${INDEXER_INTERVAL_MINUTES} minutes\n`);

  } catch (error) {
    console.error('❌ Indexer cycle failed:', error.message);
  }
}

async function processNFT(listing) {
  const { tokenId, tokenURI, metadata } = listing;
  
  // Extract audio URLs from metadata
  // ADJUST THESE PROPERTY NAMES BASED ON YOUR ACTUAL METADATA
  const audioUrlHQ = metadata?.audio_hq || metadata?.ahq || metadata?.audio || null;
  const audioUrlStandard = metadata?.audio_std || metadata?.astd || metadata?.audio_standard || null;
  const audioUrlPreview = metadata?.audio_preview || metadata?.aprev || metadata?.preview || null;
  
  // Fallback: If tokenURI is an IPFS link, fetch actual metadata
  let finalMetadata = metadata;
  if (tokenURI && tokenURI.startsWith('ipfs://') && (!audioUrlHQ || !audioUrlStandard)) {
    try {
      const ipfsHash = tokenURI.replace('ipfs://', '');
      const metadataResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, {
        timeout: 10000
      });
      
      if (metadataResponse.ok) {
        finalMetadata = await metadataResponse.json();
        
        // Update audio URLs with actual IPFS metadata
        const audioUrlHQ = finalMetadata?.audio_hq || finalMetadata?.ahq || finalMetadata?.audio;
        const audioUrlStandard = finalMetadata?.audio_std || finalMetadata?.astd || finalMetadata?.audio_standard;
        const audioUrlPreview = finalMetadata?.audio_preview || finalMetadata?.aprev || finalMetadata?.preview;
      }
    } catch (error) {
      console.log(`Could not fetch IPFS metadata for token ${tokenId}:`, error.message);
    }
  }

  // Insert or update in database
  // MATCHING YOUR DATABASE SCHEMA from stream endpoint
  await sql`
    INSERT INTO n (
      bnid,
      title,
      dur,
      cimg,
      ahq,
      astd,
      aprev,
      updated_at
    ) VALUES (
      ${tokenId.toString()},
      ${finalMetadata?.name || `NFT #${tokenId}`},
      ${finalMetadata?.duration || 0},
      ${finalMetadata?.image || finalMetadata?.coverUrl || null},
      ${audioUrlHQ},
      ${audioUrlStandard},
      ${audioUrlPreview},
      NOW()
    )
    ON CONFLICT (bnid) DO UPDATE SET
      title = EXCLUDED.title,
      dur = EXCLUDED.dur,
      cimg = EXCLUDED.cimg,
      ahq = EXCLUDED.ahq,
      astd = EXCLUDED.astd,
      aprev = EXCLUDED.aprev,
      updated_at = NOW()
  `;

  console.log(`✓ Synced NFT ${tokenId}: ${finalMetadata?.name || `NFT #${tokenId}`}`);
}

async function cleanupOldNFTs(currentTokenIds) {
  // Remove NFTs from database that are no longer on the blockchain
  const result = await sql`
    DELETE FROM n 
    WHERE bnid NOT IN (${currentTokenIds})
    AND updated_at < NOW() - INTERVAL '1 hour'
    RETURNING bnid
  `;
  
  if (result.length > 0) {
    console.log(`🧹 Cleaned up ${result.length} old NFTs`);
  }
}

// Health check and monitoring
async function healthCheck() {
  try {
    const test = await sql`SELECT 1 as healthy`;
    console.log(`[${new Date().toISOString()}] Database connection: OK`);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

// Production error handling
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  // Don't exit in production - try to recover
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Start the indexer
async function startIndexer() {
  console.log('🔧 Initializing production indexer...');
  
  // Initial health check
  const healthy = await healthCheck();
  if (!healthy) {
    console.error('❌ Initial health check failed. Exiting.');
    process.exit(1);
  }

  // Run immediately
  await runProductionIndexer();
  
  // Then run on schedule
  setInterval(runProductionIndexer, INDEXER_INTERVAL_MINUTES * 60 * 1000);
}

// Start
if (require.main === module) {
  startIndexer().catch(error => {
    console.error('Failed to start indexer:', error);
    process.exit(1);
  });
}

module.exports = { startIndexer };
