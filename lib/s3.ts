/**
 * Copyright 2024 waycaan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
