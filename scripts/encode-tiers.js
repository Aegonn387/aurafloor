// scripts/encode-tiers.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TRACK_ID = 1;
const MASTER_FILE = 'master.wav';
const OUTPUT_DIR = `./audio/encoded/${TRACK_ID}`;

const TIERS = [
  { key: 'hq', bitrate: '320k' },      // NFT & Top Subs
  { key: 'std', bitrate: '192k' },     // Standard Subs
  { key: 'preview', bitrate: '96k' }   // Free Tier
];

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

TIERS.forEach(tier => {
  const outputFile = path.join(OUTPUT_DIR, `${tier.key}.mp3`);
  const command = `ffmpeg -i "${MASTER_FILE}" -codec:a libmp3lame -b:a ${tier.bitrate} "${outputFile}" -y`;
  execSync(command);
  console.log(`Encoded: ${outputFile}`);
});

console.log('\n? Upload to R2:');
console.log(`your-bucket/audio/${TRACK_ID}/hq.mp3`);
console.log(`your-bucket/audio/${TRACK_ID}/std.mp3`);
console.log(`your-bucket/audio/${TRACK_ID}/preview.mp3`);
