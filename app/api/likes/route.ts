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

const messages = {
  en: {
    unauthorized: 'Unauthorized',
    getFailed: 'Failed to get favorites list'
  },
  zh: {
    unauthorized: '未登录',
    getFailed: '获取收藏列表失败'
  }
}

const getCurrentLang = () => process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' ? 'en' : 'zh'

const API_INFO = {
  id: 'mazine-api-likes-file-v1.0.0',
  endpoint: '/api/likes/[fileName]',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

if (process.env.NODE_ENV === 'development') {
  console.log(
    "%c Mazine API Endpoint %c /api/likes %c",
    "background: #059669; color: white; padding: 5px 0 5px 5px; border-radius: 3px 0 0 3px;",
    "background: #047857; color: white; padding: 5px; border-radius: 0 3px 3px 0;",
    "background: transparent"
  );
}

import { NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { cookies } from 'next/headers'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || ''
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true
})

export async function GET() {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth')
  if (!auth) {
    return NextResponse.json({ 
      error: messages[getCurrentLang()].unauthorized 
    }, { status: 401 })
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Prefix: 'likes/',
      MaxKeys: 1000
    })

    const response = await s3Client.send(command)
    if (!response.Contents) {
      return NextResponse.json([])
    }

    const likedFiles = response.Contents
      .filter(item => item.Key && !item.Key.endsWith('/'))
      .map(item => item.Key!.replace('likes/', ''))

    return NextResponse.json(likedFiles)
  } catch (error: any) {
    console.error('Failed to get favorites list:', {
      error: error.message
    })
    return NextResponse.json(
      { error: messages[getCurrentLang()].getFailed },
      { status: 500 }
    )
  }
} 
