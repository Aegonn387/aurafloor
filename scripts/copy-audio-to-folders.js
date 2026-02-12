const { S3Client, CopyObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

async function copyFiles() {
  const bucket = process.env.R2_BUCKET_NAME;
  
  // Copy from audio/1/ to audio/0/
  await client.send(new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/audio/1/preview.mp3`,
    Key: 'audio/0/preview.mp3'
  }));
  console.log('Copied audio/1/preview.mp3 to audio/0/preview.mp3');

  await client.send(new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/audio/1/std.mp3`,
    Key: 'audio/0/std.mp3'
  }));
  console.log('Copied audio/1/std.mp3 to audio/0/std.mp3');

  await client.send(new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/audio/1/hq.mp3`,
    Key: 'audio/0/hq.mp3'
  }));
  console.log('Copied audio/1/hq.mp3 to audio/0/hq.mp3');

  console.log('Done! Files are now at audio/0/ and audio/1/');
}

copyFiles().catch(console.error);