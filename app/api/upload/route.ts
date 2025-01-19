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
  id: 'mazine-api-upload-v1.0.0',
  endpoint: '/api/upload',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { cookies } from 'next/headers'
import { createPreviewImage } from '@/components/utils/thumbs'

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
})

function getPublicUrl(fileName: string) {
  const encodedFileName = encodeURIComponent(fileName)
  
  if (process.env.NEXT_PUBLIC_CDN) {
    return `${process.env.NEXT_PUBLIC_CDN.replace(/\/$/, '')}/${encodedFileName}`
  }

  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '')
  const bucket = process.env.S3_BUCKET_NAME
  return `${endpoint}/${bucket}/${encodedFileName}`
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function sanitizeMetadataValue(value: string): string {
  if (/[^\x00-\x7F]/.test(value)) {
    return `base64:${Buffer.from(value).toString('base64')}`;
  }
  return value;
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth')
  if (!auth) {
    return NextResponse.json(
      { success: false, message: '未登录' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const previewFiles = formData.getAll('previews') as File[]

    console.log('Debug upload:', {
      filesCount: files.length,
      previewsCount: previewFiles.length,
      previewFiles
    })

    const uploadedFiles = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const previewFile = previewFiles[i]
      
      if (!(file instanceof File)) continue
      
      try {
        const decodedName = decodeURIComponent(file.name)
        const targetFormat = formData.get(`format_${file.name}`) as string
        const finalFileName = await generateFileName(decodedName, targetFormat)

        const buffer = Buffer.from(await file.arrayBuffer())
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: finalFileName,
          Body: buffer,
          ContentType: file.type,
          ACL: 'public-read',
          Metadata: {
            'original-name': sanitizeMetadataValue(file.name),
            'final-name': sanitizeMetadataValue(finalFileName),
            'upload-time': new Date().toISOString(),
            'is-liked': 'false',
            'liked-at': ''
          }
        }))

        if (!(previewFile instanceof File)) {
          throw new Error('预览图文件无效')
        }

        const previewBuffer = Buffer.from(await previewFile.arrayBuffer())
        const previewFileName = `thumbs/${finalFileName}`
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: previewFileName,
          Body: previewBuffer,
          ContentType: 'image/webp',
          ACL: 'public-read'
        }))

        const url = getPublicUrl(finalFileName)
        const previewUrl = getPublicUrl(previewFileName)
        uploadedFiles.push({
          originalName: file.name,
          fileName: finalFileName,
          url,
          previewUrl,
          markdown: `![${file.name}](${url})`,
          bbcode: `[img]${url}[/img]`,
          html: `<img src="${url}" alt="${file.name}" />`,
          size: file.size,
          type: file.type,
          uploadTime: new Date().toISOString()
        })
      } catch (uploadError) {
        console.error('Upload failed:', {
          fileName: file.name,
          error: uploadError
        })
        uploadedFiles.push({
          originalName: file.name,
          error: '上传失败'
        })
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '上传失败' },
      { status: 500 }
    )
  }
}

async function generateFileName(originalName: string, targetFormat?: string): Promise<string> {
  const nameWithoutHash = originalName.replace(/#/g, '-hash-')
  
  const cleanName = nameWithoutHash
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  
  const ext = cleanName.split('.').pop() || ''
  const baseName = cleanName.replace(`.${ext}`, '')
  const finalExt = targetFormat || ext

  let newFileName = `${baseName}.${finalExt}`
  let counter = 1

  while (await checkFileExists(newFileName)) {
    newFileName = `${baseName}_${counter}.${finalExt}`
    counter++
  }

  return newFileName
}

async function checkFileExists(fileName: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName
    }))
    return true
  } catch (error: any) {
    if (error?.$metadata?.httpStatusCode === 404) {
      return false
    }
    console.error('S3 check error:', error)
    return true
  }
}
