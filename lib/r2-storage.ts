import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export type AudioQuality = "preview" | "standard" | "hq"

export interface UploadedAudioUrls {
  preview: string // 128kbps for free tier
  standard: string // 256kbps for premium
  hq: string // 320kbps for owners
}

export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000", // 1 year cache
    Metadata: metadata,
  })

  await r2Client.send(command)

  // Return public URL via custom domain or R2 public URL
  return `https://${process.env.R2_PUBLIC_DOMAIN || "cdn.aurafloor.com"}/${key}`
}

export async function getSignedStreamUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

export function getAudioKey(nftId: string, quality: AudioQuality): string {
  return `audio/${nftId}-${quality}.mp3`
}
