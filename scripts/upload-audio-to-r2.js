// scripts/upload-audio-to-r2.js
// Uploads audio files to PRIVATE R2 storage - returns OBJECT KEYS, not public URLs
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class R2AudioUploader {
  constructor() {
    // R2 configuration - set these in .env.local
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    
    this.bucketName = process.env.R2_BUCKET_NAME;
  }

  // Upload audio file to private R2 bucket
  async uploadAudioFile(filePath, trackId, quality) {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Private object key format: audio/{trackId}/{quality}/{filename}
    const objectKey = `audio/${trackId}/${quality}/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: 'audio/mpeg',
      // Metadata for tracking
      Metadata: {
        trackId: trackId.toString(),
        quality: quality,
        uploadedAt: new Date().toISOString()
      }
    });

    try {
      await this.client.send(command);
      console.log(`✅ Uploaded to R2: ${objectKey}`);
      return objectKey; // Return the PRIVATE object key, NOT a public URL
    } catch (error) {
      console.error(`❌ R2 upload failed:`, error);
      throw error;
    }
  }

  // Generate a temporary signed URL for streaming (expires in 1 hour)
  async generateSignedUrl(objectKey, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(this.client, command, { 
      expiresIn: expiresIn 
    });
    
    return signedUrl;
  }

  // Upload all qualities for a track
  async uploadTrack(trackId, trackName) {
    const qualities = [
      { name: 'hq', folder: '320kbps' },
      { name: 'std', folder: '128kbps' },
      { name: 'preview', folder: '64kbps' }
    ];

    const results = {};

    for (const quality of qualities) {
      const fileName = `${trackId}-${quality.folder}.mp3`;
      const filePath = path.join(__dirname, `../audio/${quality.folder}/${fileName}`);
      
      if (fs.existsSync(filePath)) {
        const objectKey = await this.uploadAudioFile(filePath, trackId, quality.name);
        results[quality.name] = {
          objectKey: objectKey,
          path: filePath,
          size: fs.statSync(filePath).size
        };
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
        results[quality.name] = null;
      }
    }

    // Save object keys to file (NOT public URLs)
    const keyFile = `./metadata/track-${trackId}-keys.json`;
    fs.writeFileSync(keyFile, JSON.stringify({
      trackId,
      name: trackName,
      objectKeys: {
        hq: results.hq?.objectKey,
        std: results.std?.objectKey,
        preview: results.preview?.objectKey
      },
      uploadedAt: new Date().toISOString()
    }, null, 2));

    console.log(`\n📁 Saved object keys to: ${keyFile}`);
    return results;
  }
}

// Main function
async function main() {
  console.log('🔒 R2 Audio Uploader - PRIVATE MODE');
  console.log('====================================');
  
  // Check environment
  const required = ['CLOUDFLARE_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    console.log('\nSet these in .env.local:');
    console.log('CLOUDFLARE_ACCOUNT_ID=your-account-id');
    console.log('R2_ACCESS_KEY_ID=your-access-key');
    console.log('R2_SECRET_ACCESS_KEY=your-secret-key');
    console.log('R2_BUCKET_NAME=aurafloor-audio-private');
    process.exit(1);
  }

  const uploader = new R2AudioUploader();
  
  // Example: Upload track 1
  const trackId = 1;
  const trackName = 'Midnight Drive';
  
  console.log(`\n🎵 Uploading Track #${trackId}: ${trackName}`);
  console.log('----------------------------------------');
  
  try {
    const results = await uploader.uploadTrack(trackId, trackName);
    
    console.log('\n📊 Upload Results:');
    Object.entries(results).forEach(([quality, data]) => {
      if (data) {
        console.log(`   ${quality.toUpperCase()}: ${data.objectKey}`);
      }
    });
    
    console.log('\n⚠️  IMPORTANT: Audio files are stored PRIVATELY in R2.');
    console.log('   Use generateSignedUrl() in your stream endpoint after ownership verification.');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

// Install required package: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
if (require.main === module) {
  main().catch(console.error);
}

module.exports = R2AudioUploader;
