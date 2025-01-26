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
  id: 'mazine-api-batch-v1.0.0',
  endpoint: '/api/images/batch',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import { withAuth } from '@/lib/auth-middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || ''
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true
})

export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    console.log('Received delete request body:', body)
    
    if (!body || !body.fileNames || !Array.isArray(body.fileNames)) {
      console.error('Invalid request body:', {
        body,
        hasFileNames: !!body?.fileNames,
        isArray: Array.isArray(body?.fileNames)
      })
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }
    
    const { fileNames } = body
    console.log('Files to delete:', fileNames)
    
    await Promise.all(fileNames.map(async (fileName: string) => {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || '',
        Key: fileName
      }))
      
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || '',
        Key: `thumbs/${fileName}`
      }))
    }))

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Batch delete failed:', error)
    return NextResponse.json(
      { error: '批量删除失败' },
      { status: 500 }
    )
  }
}) 
