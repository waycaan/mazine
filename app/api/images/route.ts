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

const API_INFO = {
  id: 'mazine-api-images-list-v1.0.0',
  endpoint: '/api/images',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { cookies } from 'next/headers'

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});

function getPublicUrl(fileName: string) {
  if (process.env.NEXT_PUBLIC_CDN) {
    return `${process.env.NEXT_PUBLIC_CDN.replace(/\/$/, '')}/${fileName}`
  }
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '')
  const bucket = process.env.S3_BUCKET_NAME
  return `${endpoint}/${bucket}/${fileName}`
}

async function checkIsLiked(fileName: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `likes/${fileName}`
    }))
    return true
  } catch (error) {
    return false
  }
}

const messages = {
  en: {
    unauthorized: 'Unauthorized',
    listFailed: 'Failed to get image list'
  },
  zh: {
    unauthorized: '未登录',
    listFailed: '获取列表失败'
  }
} as const;

type MessageKey = keyof typeof messages.en
type Locale = 'en' | 'zh'

const getCurrentLang = (): Locale => process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' ? 'en' : 'zh'

// Helper function to get message
const getMessage = (key: MessageKey): string => messages[getCurrentLang()][key];

export async function GET() {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth')
  if (!auth) {
    return NextResponse.json({ 
      error: getMessage('unauthorized')
    }, { status: 401 })
  }

  try {
    const data = await s3Client.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 1000
    }))

    // 如果有更多数据，继续获取
    if (data.IsTruncated) {
      const nextData = await s3Client.send(new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        MaxKeys: 1000,
        ContinuationToken: data.NextContinuationToken
      }))
      
      // 合并到 data.Contents
      if (nextData.Contents) {
        data.Contents = [...(data.Contents || []), ...nextData.Contents]
      }
    }

    console.log('S3 response:', data)

    // Separate images and like records
    const likedFiles = new Set<string>()
    const imageFiles = (data.Contents || []).filter(item => {
      const key = item.Key!
      if (key.startsWith('likes/')) {
        // Extract original filename from likes directory
        likedFiles.add(key.replace('likes/', ''))
        return false
      }
      return true
    })

    // Process image files
    const images = await Promise.all(imageFiles.map(async item => {
      const fileName = item.Key!
      const url = getPublicUrl(fileName)
      const previewUrl = getPublicUrl(`thumbs/${fileName}`)

      // Get file metadata
      const headObject = await s3Client.send(new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName
      }))

      return {
        originalName: fileName,
        fileName,
        url,
        previewUrl,
        size: item.Size,
        uploadTime: item.LastModified?.toISOString(),
        markdown: `![${fileName}](${url})`,
        bbcode: `[img]${url}[/img]`
      }
    }))

    console.log('Processed files:', {
      images: images.length,
      likedFiles: Array.from(likedFiles)
    })

    return NextResponse.json({
      files: images,
      likedFiles: Array.from(likedFiles)
    })

  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json({ 
      error: getMessage('listFailed')
    }, { status: 500 })
  }
} 
