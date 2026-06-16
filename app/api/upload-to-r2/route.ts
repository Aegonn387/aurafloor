export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const sql = neon(process.env.DATABASE_URL!);

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const paymentId = formData.get('paymentId') as string;
    const fileType = formData.get('type') as string || 'audio';

    if (!file || !paymentId) {
      return NextResponse.json({ error: 'File and paymentId required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileUuid = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const r2Key = `${fileType}/${paymentId}/${fileUuid}.${fileExtension}`;

    await R2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`;

    // Update NEW columns: audio_r2_url and cover_r2_url
    if (fileType === 'audio') {
      await sql`
        UPDATE pending_nft_mints
        SET 
          audio_r2_url = ${publicUrl},
          audio_filename = ${file.name},
          audio_content_type = ${file.type}
        WHERE payment_id = ${paymentId}
      `;
    } else if (fileType === 'cover') {
      await sql`
        UPDATE pending_nft_mints
        SET 
          cover_r2_url = ${publicUrl},
          cover_filename = ${file.name},
          cover_content_type = ${file.type}
        WHERE payment_id = ${paymentId}
      `;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      r2Key,
      filename: file.name,
    });
  } catch (error) {
    console.error('[R2 Upload]:', error);
    return NextResponse.json({
      error: 'Failed to upload to R2',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    r2_configured: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
    bucket: process.env.R2_BUCKET_NAME || 'not set',
    publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'not set'
  });
}
