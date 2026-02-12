// scripts/upload-to-r2.js - CORRECTED VERSION
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

console.log('📤 Starting R2 Audio Upload...');
console.log('==============================');

// Configuration
const TRACK_ID = 1;
const LOCAL_BASE_DIR = `./audio/encoded/${TRACK_ID}`;
const R2_BASE_PATH = `audio/${TRACK_ID}`;

const FILES_TO_UPLOAD = [
  { localName: 'hq.mp3', r2Key: `${R2_BASE_PATH}/hq.mp3`, quality: '320kbps' },
  { localName: 'std.mp3', r2Key: `${R2_BASE_PATH}/std.mp3`, quality: '192kbps' },
  { localName: 'preview.mp3', r2Key: `${R2_BASE_PATH}/preview.mp3`, quality: '96kbps' }
];

// Validate environment variables
const requiredEnvVars = [
  'CLOUDFLARE_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID', 
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME'
];

console.log('🔍 Checking environment variables...');
requiredEnvVars.forEach(varName => {
  console.log(`   ${varName}: ${process.env[varName] ? '✅ Set' : '❌ Missing'}`);
});

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nEnsure these are in .env.local and the file is loading.');
  process.exit(1);
}

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Upload function
async function uploadFile(localFilePath, r2Key, quality) {
  try {
    const fileContent = fs.readFileSync(localFilePath);
    const fileSizeMB = (fileContent.length / (1024 * 1024)).toFixed(2);

    console.log(`\n📁 Uploading: ${path.basename(localFilePath)}`);
    console.log(`   R2 Path: ${r2Key}`);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileContent,
      ContentType: 'audio/mpeg',
    });

    await r2Client.send(command);
    console.log(`   ✅ Upload successful!`);
    
    return { success: true, r2Key, size: fileSizeMB };

  } catch (error) {
    console.error(`   ❌ Upload failed: ${error.message}`);
    return { success: false, r2Key, error: error.message };
  }
}

// Main execution
async function main() {
  console.log(`\n📊 Processing Track ID: ${TRACK_ID}`);
  
  // Check if local files exist
  const missingLocalFiles = [];
  FILES_TO_UPLOAD.forEach(file => {
    const localPath = path.join(LOCAL_BASE_DIR, file.localName);
    if (!fs.existsSync(localPath)) {
      missingLocalFiles.push(file.localName);
    }
  });

  if (missingLocalFiles.length > 0) {
    console.error('\n❌ Missing local files:');
    missingLocalFiles.forEach(fileName => console.error(`   - ${fileName}`));
    console.error('\nRun: node scripts/encode-tiers.js');
    process.exit(1);
  }

  // Upload all files
  const results = [];
  for (const file of FILES_TO_UPLOAD) {
    const localPath = path.join(LOCAL_BASE_DIR, file.localName);
    const result = await uploadFile(localPath, file.r2Key, file.quality);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  const successful = results.filter(r => r.success);
  console.log(`📊 UPLOAD COMPLETE: ${successful.length}/3 successful`);
  
  if (successful.length === 3) {
    console.log('\n🎉 All files uploaded to R2!');
    console.log('\n🚀 Next: Test your stream endpoint:');
    console.log('curl -X POST http://localhost:3000/api/stream/1 \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d "{\\"userId\\":\\"test_user\\"}"');
  }
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
