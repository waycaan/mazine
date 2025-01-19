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

import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { cookies } from 'next/headers'

const API_INFO = {
  id: 'mazine-api-image-operations-v1.0.0',
  endpoint: '/api/images/[fileName]',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

if (process.env.NODE_ENV === 'development') {
  console.log(
    "%c Mazine API Endpoint %c /api/images/[fileName] %c",
    "background: #059669; color: white; padding: 5px 0 5px 5px; border-radius: 3px 0 0 3px;",
    "background: #047857; color: white; padding: 5px; border-radius: 0 3px 3px 0;",
    "background: transparent"
  );
}

const createS3Client = () => {
  const config = {
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || ''
    },
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true
  }

  return new S3Client(config)
}

const s3Client = createS3Client()

const checkS3Connection = async () => {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: 'test-connection'
    })
    await s3Client.send(command)
    return true
  } catch (error: any) {
    if (error.$metadata?.httpStatusCode === 404) {
      return true
    }
    console.error('S3 连接测试失败:', {
      error: error.message,
      code: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    })
    return false
  }
}

type MessageKey = keyof typeof messages.en
type Locale = 'en' | 'zh'

const getCurrentLang = (): Locale => process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' ? 'en' : 'zh'

const messages = {
  en: {
    unauthorized: 'Unauthorized',
    s3ConnectionFailed: 'S3 service connection failed',
    invalidFileName: 'Invalid filename format',
    originalNotFound: 'Original image not found',
    createMarkFailed: 'Failed to create favorite mark',
    checkOriginalFailed: 'Failed to check original image',
    likeFailed: 'Failed to like',
    unlikeFailed: 'Failed to unlike',
    likeMarkNotFound: 'Like mark not found',
    deleteLikeMarkFailed: 'Failed to delete like mark'
  },
  zh: {
    unauthorized: '未登录',
    s3ConnectionFailed: 'S3 服务连接失败',
    invalidFileName: '文件名格式错误',
    originalNotFound: '原始图片不存在',
    createMarkFailed: '创建收藏标记失败',
    checkOriginalFailed: '检查原始图片失败',
    likeFailed: '收藏失败',
    unlikeFailed: '取消收藏失败',
    likeMarkNotFound: '收藏记录不存在',
    deleteLikeMarkFailed: '删除收藏标记失败'
  }
} as const;

const getMessage = (key: MessageKey): string => messages[getCurrentLang()][key];

export async function POST(
  request: Request,
  { params }: { params: { fileName: string } }
) {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth')
  if (!auth) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    if (!await checkS3Connection()) {
      return NextResponse.json(
        { success: false, error: getMessage('s3ConnectionFailed') },
        { status: 500 }
      )
    }

    let fileName = params.fileName
    try {
      fileName = decodeURIComponent(fileName)
      
      if (fileName.includes('/') || fileName.includes('\\')) {
        throw new Error('文件名不能包含路径分隔符')
      }
    } catch (e) {
      console.error('Failed to decode filename:', e)
      return NextResponse.json(
        { success: false, error: getMessage('invalidFileName') },
        { status: 400 }
      )
    }

    console.log('Like image - params:', {
      originalFileName: params.fileName,
      decodedFileName: fileName,
      bucket: process.env.S3_BUCKET_NAME,
      endpoint: process.env.S3_ENDPOINT
    })

    const headCommand = new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName
    })

    try {
      console.log('Checking if original image exists...')
      const originalObject = await s3Client.send(headCommand)
      console.log('Original image metadata:', {
        metadata: originalObject.Metadata,
        contentType: originalObject.ContentType,
        lastModified: originalObject.LastModified
      })

      const putCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `likes/${fileName}`,
        Body: '',
        ContentType: 'application/json',
        Metadata: {
          'original-key': fileName,
          'liked-at': new Date().toISOString(),
          'original-name': originalObject.Metadata?.['original-name'] || fileName
        }
      })

      console.log('Creating favorite mark file...')
      try {
        await s3Client.send(putCommand)
        console.log(`Favorite added: ${fileName}`)
        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Failed to create favorite mark:', {
          fileName,
          error: error.message,
          code: error.$metadata?.httpStatusCode,
          requestId: error.$metadata?.requestId,
          stack: error.stack
        })
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create favorite mark',
            details: error.message
          },
          { status: 500 }
        )
      }
    } catch (error: any) {
      console.error('Error checking original image:', {
        fileName,
        error: error.message,
        name: error.name,
        code: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
        stack: error.stack
      })

      if (error.$metadata?.httpStatusCode === 404 || error.name === 'NotFound') {
        return NextResponse.json(
          { success: false, error: 'Original image not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to check original image',
          details: error.message
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Failed to like image:', {
      originalFileName: params.fileName,
      error: error.message,
      name: error.name,
      code: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      stack: error.stack
    })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to like image',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { fileName: string } }
) {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth')
  if (!auth) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    if (!await checkS3Connection()) {
      return NextResponse.json(
        { success: false, error: 'S3 服务连接失败' },
        { status: 500 }
      )
    }

    let fileName = params.fileName
    try {
      fileName = decodeURIComponent(fileName)
    } catch (e) {
      console.error('文件名解码失败:', e)
      return NextResponse.json(
        { success: false, error: '文件名格式错误' },
        { status: 400 }
      )
    }

    console.log('取消收藏 - 参数:', {
      originalFileName: params.fileName,
      decodedFileName: fileName,
      bucket: process.env.S3_BUCKET_NAME,
      endpoint: process.env.S3_ENDPOINT
    })

    try {
      console.log('删除收藏标记文件...')
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `likes/${fileName}`
      }))
      console.log(`取消收藏成功: ${fileName}`)

      const previewFileName = `thumbs/${fileName}`
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: previewFileName
      }))

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('删除收藏标记时出错:', {
        fileName,
        error: error.message,
        name: error.name,
        code: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
        stack: error.stack
      })

      if (error.$metadata?.httpStatusCode === 404 || error.name === 'NotFound') {
        return NextResponse.json(
          { success: false, error: '收藏记录不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          error: '删除收藏标记失败',
          details: error.message
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('取消收藏失败:', {
      originalFileName: params.fileName,
      error: error.message,
      name: error.name,
      code: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      stack: error.stack
    })

    return NextResponse.json(
      { 
        success: false, 
        error: '取消收藏失败',
        details: error.message
      },
      { status: 500 }
    )
  }
} 
