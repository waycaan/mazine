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

import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
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

export async function DELETE(request: Request) {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth')
  if (!auth) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const { fileNames } = await request.json()

    // 并行删除所有文件
    await Promise.all(
      fileNames.map(async (fileName: string) => {
        // 删除原始图片
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName
        }))

        // 同时删除收藏标记（如果存在）
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `likes/${fileName}`
          }))
        } catch (error) {
          // 忽略收藏标记不存在的错误
        }
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Batch delete error:', error)
    return NextResponse.json(
      { success: false, error: '批量删除失败' },
      { status: 500 }
    )
  }
} 
