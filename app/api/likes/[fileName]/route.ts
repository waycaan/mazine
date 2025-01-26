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
  id: 'mazine-api-likes-file-v1.0.0',
  endpoint: '/api/likes/[fileName]',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import type { NextRequest } from 'next/server'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || ''
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true
})

export const POST = withAuth(async (request: NextRequest, { params }: { params: { fileName: string } }) => {
  try {
    const fileName = decodeURIComponent(params.fileName)
    console.log('收藏请求:', { 
      原始文件名: params.fileName,
      解码后文件名: fileName 
    })
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: `likes/${fileName}`,
      Body: '',
      ContentType: 'application/json'
    })

    await s3Client.send(putCommand)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('收藏失败:', {
      fileName: params.fileName,
      error: error.message
    })
    return NextResponse.json(
      { success: false, error: '收藏失败' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (request: NextRequest, { params }: { params: { fileName: string } }) => {
  try {
    const fileName = decodeURIComponent(params.fileName)
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: `likes/${fileName}`
    })

    await s3Client.send(deleteCommand)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ success: true })
    }

    console.error('取消收藏失败:', {
      fileName: params.fileName,
      error: error.message
    })
    return NextResponse.json(
      { success: false, error: '取消收藏失败' },
      { status: 500 }
    )
  }
}) 
