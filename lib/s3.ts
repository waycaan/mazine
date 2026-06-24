import { S3Client } from '@aws-sdk/client-s3';

let clientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!clientInstance) {
    clientInstance = new S3Client({
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }
  return clientInstance;
}

export function getBucketName(): string {
  return process.env.S3_BUCKET_NAME!;
}

export function getCdnUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_CDN;
}

export function getPublicUrl(key: string): string {
  const cdn = getCdnUrl();
  if (cdn) {
    return `${cdn.replace(/\/$/, '')}/${encodeURIComponent(key)}`;
  }
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
  const bucket = getBucketName();
  return `${endpoint}/${bucket}/${encodeURIComponent(key)}`;
}
