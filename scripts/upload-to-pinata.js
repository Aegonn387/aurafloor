// scripts/upload-to-pinata.js - PRODUCTION VERSION
require('dotenv').config({ path: '.env.local' }); // LOADS YOUR PINATA_JWT

const fs = require('fs');
const axios = require('axios');
const path = require('path');

console.log('📤 Starting Pinata upload...');

// 1. Configuration
const PINATA_JWT = process.env.PINATA_JWT;
const METADATA_FILE = './metadata/nft-1.json';

if (!PINATA_JWT) {
  console.error('❌ CRITICAL ERROR: PINATA_JWT environment variable is not loaded.');
  console.error('   Check:');
  console.error('   1. The variable is in .env.local: PINATA_JWT=your_token_here');
  console.error('   2. This script loads it via: require(\'dotenv\').config({ path: \'.env.local\' })');
  console.error('   3. You have installed dotenv: npm install dotenv');
  process.exit(1);
}

if (!fs.existsSync(METADATA_FILE)) {
  console.error(`❌ METADATA ERROR: File not found: ${METADATA_FILE}`);
  console.error('   Run: node scripts/create-metadata.js');
  process.exit(1);
}

// 2. Read and validate metadata
let metadata;
try {
  const fileContent = fs.readFileSync(METADATA_FILE, 'utf8');
  metadata = JSON.parse(fileContent);
  
  if (!metadata.name || !metadata.aurafloor?.audio_paths) {
    console.error('❌ METADATA ERROR: Invalid structure. Missing required fields.');
    process.exit(1);
  }
  
  console.log(`📄 Processing: ${metadata.name}`);
  console.log(`   Audio Paths: ${Object.keys(metadata.aurafloor.audio_paths).join(', ')}`);
} catch (error) {
  console.error(`❌ Failed to read metadata: ${error.message}`);
  process.exit(1);
}

// 3. Upload to Pinata IPFS
async function uploadToPinata() {
  console.log('🚀 Uploading to Pinata IPFS...');
  
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataMetadata: {
          name: `audio-nft-${Date.now()}`,
          keyvalues: {
            type: 'audio-nft',
            track: metadata.name,
            app: 'aurafloor'
          }
        },
        pinataContent: metadata
      },
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const cid = response.data.IpfsHash;
    
    console.log(`\n✅ UPLOAD SUCCESSFUL`);
    console.log(`   CID: ${cid}`);
    console.log(`   IPFS URL: ipfs://${cid}`);
    console.log(`   Gateway URL: https://gateway.pinata.cloud/ipfs/${cid}`);
    console.log(`   View: https://gateway.pinata.cloud/ipfs/${cid}`);

    // 4. Save the CID for future use (critical for NFT minting)
    const cidFilePath = './metadata/nft-1.cid.txt';
    fs.writeFileSync(cidFilePath, cid);
    console.log(`\n💾 CID saved to: ${cidFilePath}`);

    // 5. Also save a complete reference file
    const referenceData = {
      timestamp: new Date().toISOString(),
      trackId: 1,
      trackName: metadata.name,
      cid: cid,
      ipfsUrl: `ipfs://${cid}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
      metadataFile: METADATA_FILE
    };
    
    fs.writeFileSync(
      './metadata/upload-reference.json',
      JSON.stringify(referenceData, null, 2)
    );
    console.log(`📋 Reference saved: ./metadata/upload-reference.json`);

    // 6. Important reminder about image CID
    if (metadata.image && metadata.image.includes('REPLACE')) {
      console.log(`\n⚠️  ACTION REQUIRED: Update your cover image!`);
      console.log(`   Current image field: ${metadata.image}`);
      console.log(`   Upload a cover image to Pinata, then update metadata.`);
    }

    console.log(`\n🎯 NEXT STEP: Use this CID as your NFT's token_uri:`);
    console.log(`   token_uri = "ipfs://${cid}"`);
    
    return cid;

  } catch (error) {
    console.error('\n❌ PINATA UPLOAD FAILED');
    
    if (error.response) {
      // The request was made and the server responded with an error
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 403) {
        console.error('\n   Likely cause: Invalid or expired JWT token.');
        console.error('   Get a new token: https://app.pinata.cloud/developers');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('   No response from Pinata API. Check your network.');
    } else {
      // Something happened in setting up the request
      console.error(`   Setup error: ${error.message}`);
    }
    
    process.exit(1);
  }
}

// Execute the upload
uploadToPinata();
