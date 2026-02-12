// scripts/create-metadata.js - Creates NFT metadata with private R2 paths
const fs = require('fs');
const path = require('path');

// Configuration
const TRACK_ID = 1;
const TRACK_NAME = "Midnight Drive";
const ARTIST = "Neon Dreams";
const COVER_IMAGE_CID = "ipfs://REPLACE_WITH_ACTUAL_CID"; // Get this from Pinata

console.log(`📝 Creating metadata for Track #${TRACK_ID}: ${TRACK_NAME}`);

// PRIVATE R2 object paths (from upload-audio-to-r2.js output)
const audioPaths = {
  hq: `audio/${TRACK_ID}/hq/${TRACK_ID}-320kbps.mp3`,
  std: `audio/${TRACK_ID}/std/${TRACK_ID}-128kbps.mp3`,
  preview: `audio/${TRACK_ID}/preview/${TRACK_ID}-64kbps.mp3`
};

// NFT metadata following OpenSea/Stellar standards
const metadata = {
  name: `${TRACK_NAME} #${TRACK_ID}`,
  description: `Exclusive audio NFT by ${ARTIST}. Access requires token ownership.`,
  image: COVER_IMAGE_CID,
  external_url: "https://aurafloor.com",
  animation_url: COVER_IMAGE_CID, // Could be audio preview
  
  // Your app's custom fields - PRIVATE PATHS ONLY
  aurafloor: {
    version: "1.0",
    audio_paths: audioPaths, // Critical: private R2 object keys
    stream_verification_required: true
  },
  
  attributes: [
    { trait_type: "Artist", value: ARTIST },
    { trait_type: "Genre", value: "Synthwave" },
    { trait_type: "Duration", value: "215s" },
    { trait_type: "Access", value: "Token-Gated" },
    { trait_type: "Audio Quality", value: "Lossless" }
  ]
};

// Save to file
const outputDir = './metadata';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, `nft-${TRACK_ID}.json`);
fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

console.log(`✅ Metadata saved: ${outputPath}`);
console.log(`\n⚠️  IMPORTANT: Update COVER_IMAGE_CID after uploading cover to Pinata`);
console.log(`   Next: Run upload-to-pinata.js to upload this file to IPFS`);
