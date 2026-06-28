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
import { withIronAuth } from '@/lib/iron-session';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
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

async function readIndex() {
  try {
    const res = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: 'index.json' }));
    const content = await res.Body?.transformToString();
    if (content) return JSON.parse(content);
  } catch {}
  return null;
}

async function writeIndex(index: any) {
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'index.json',
    Body: JSON.stringify(index),
    ContentType: 'application/json'
  }));
}

async function handleDELETE(request: NextRequest) {
  try {
    const { fileNames } = await request.json();

    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json({ success: false, error: 'fileNames required' }, { status: 400 });
    }

    const objects = fileNames.flatMap(fileName => [
      { Key: fileName },
      { Key: `thumbs/${fileName}` },
      { Key: `likes/${fileName}` }
    ]);

    await s3Client.send(new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: objects }
    }));

    const index = await readIndex();
    if (index) {
      const deleteSet = new Set(fileNames);
      index.images = index.images.filter((img: any) => !deleteSet.has(img.fileName));
      index.totalCount = index.images.length;
      index.likedCount = index.images.filter((img: any) => img.isLiked).length;
      index.lastUpdated = new Date().toISOString();
      await writeIndex(index);
    }

    return NextResponse.json({
      success: true,
      deletedCount: fileNames.length,
      newIndex: index
    });
  } catch (error: any) {
    console.error('Delete failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}

export const DELETE = withIronAuth(handleDELETE);
