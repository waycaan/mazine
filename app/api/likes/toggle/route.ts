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

import { NextRequest, NextResponse } from 'next/server';
import { ImageIndex } from '@/types/image-index';
import { withIronAuth } from '@/lib/iron-session';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
export const runtime = 'edge'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});
const bucketName = process.env.S3_BUCKET_NAME!;

async function readIndex(): Promise<ImageIndex> {
  try {
    const res = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: 'index.json' }));
    const content = await res.Body?.transformToString();
    if (content) return JSON.parse(content);
  } catch {}
  return { version: '1.0.0', lastUpdated: new Date().toISOString(), totalCount: 0, images: [], likedCount: 0 };
}

async function writeIndex(index: ImageIndex): Promise<void> {
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'index.json',
    Body: JSON.stringify(index),
    ContentType: 'application/json'
  }));
}

async function handlePOST(request: NextRequest) {
  try {
    const { fileNames, isLiked } = await request.json();

    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json({ success: false, error: 'fileNames required' }, { status: 400 });
    }
    if (typeof isLiked !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isLiked required' }, { status: 400 });
    }

    const index = await readIndex();
    const fileNameSet = new Set(fileNames);
    let changedCount = 0;

    for (const img of index.images) {
      if (fileNameSet.has(img.fileName) && img.isLiked !== isLiked) {
        img.isLiked = isLiked;
        changedCount++;
      }
    }

    index.likedCount = index.images.filter(img => img.isLiked).length;
    index.lastUpdated = new Date().toISOString();

    await writeIndex(index);

    return NextResponse.json({
      success: true,
      changedCount,
      newIndex: index
    });
  } catch (error: any) {
    console.error('Like toggle failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Like toggle failed' },
      { status: 500 }
    );
  }
}

export const POST = withIronAuth(handlePOST);
