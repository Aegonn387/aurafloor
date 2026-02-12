import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const sql = neon(process.env.DATABASE_URL!);

// Initialize R2 client
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;

export async function POST(req: NextRequest) {
  try {
    console.log('[Upload to R2] Starting file upload...');
    
    // 1. Parse FormData from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const paymentId = formData.get('paymentId') as string;
    const fileType = formData.get('type') as string || 'audio';

    if (!file || !paymentId) {
      return NextResponse.json(
        { error: 'File and paymentId are required' },
        { status: 400 }
      );
    }

    console.log(`[Upload to R2] Processing: ${file.name} (${fileType}) for payment ${paymentId}`);

    // 2. Convert File to Buffer for R2 upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Generate a unique but deterministic path in R2
    // Format: {type}/{paymentId}/{uuid}-{originalName}
    const fileUuid = uuidv4();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileExtension = file.name.split('.').pop() || 'bin';
    const r2Key = `${fileType}/${paymentId}/${fileUuid}.${fileExtension}`;
    
    console.log(`[Upload to R2] Uploading to R2 key: ${r2Key}`);

    // 4. Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'original-filename': file.name,
        'payment-id': paymentId,
        'file-type': fileType,
        'upload-timestamp': Date.now().toString()
      }
    });

    await R2.send(uploadCommand);
    console.log('[Upload to R2] File uploaded to R2 successfully');

    // 5. Construct the public URL for this file
    // Use the stream endpoint as proxy for security
    const audioUrl = `/api/stream/${r2Key}`;
    
    console.log(`[Upload to R2] File URL: ${audioUrl}`);

    // 6. Update the pending_nft_mints record with file reference
    if (fileType === 'audio') {
      await sql`
        UPDATE pending_nft_mints 
        SET 
          audio_data = ${buffer},
          audio_filename = ${file.name},
          audio_content_type = ${file.type}
        WHERE payment_id = ${paymentId}
      `;
      console.log(`[Upload to R2] Audio data saved to database for payment: ${paymentId}`);
    } else if (fileType === 'cover') {
      await sql`
        UPDATE pending_nft_mints 
        SET 
          cover_data = ${buffer},
          cover_filename = ${file.name},
          cover_content_type = ${file.type}
        WHERE payment_id = ${paymentId}
      `;
      console.log(`[Upload to R2] Cover data saved to database for payment: ${paymentId}`);
    }

    // 7. Return success with the URL
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to R2',
      url: audioUrl,
      r2Key: r2Key,
      filename: file.name,
      contentType: file.type,
      size: buffer.length,
      fileType: fileType
    });

  } catch (error) {
    console.error('[Upload to R2] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload file to R2',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Helper endpoint to check if R2 is configured
export async function GET() {
  const isConfigured = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME && process.env.R2_ENDPOINT);
  return NextResponse.json({
    r2_configured: isConfigured,
    bucket: process.env.R2_BUCKET_NAME || 'not set',
    endpoint: process.env.R2_ENDPOINT || 'not set',
    hasPublicUrl: !!process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  });
}