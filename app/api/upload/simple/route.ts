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
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { withErrorHandler, createApiResponse, ValidationError } from '@/lib/error-handler'
import { validateAndSanitizeFilename, validateImageType } from '@/utils/imageProcess'
import type { NextRequest } from 'next/server'

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

function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false

  const apiKey = process.env.UPLOAD_API_KEY
  if (!apiKey) return false

  const token = authHeader.slice(7)
  return timingSafeEquals(token, apiKey)
}

const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 10

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  if (recent.length >= RATE_LIMIT_MAX) return false
  recent.push(now)
  rateLimitMap.set(ip, recent)
  return true
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const POST = withErrorHandler(async (request: NextRequest) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      createApiResponse(false, null, 'Rate limit exceeded. Max 10 uploads per minute.'),
      { status: 429 }
    )
  }

  if (!verifyApiKey(request)) {
    return NextResponse.json(
      createApiResponse(false, null, 'Invalid or missing API key'),
      { status: 401 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    throw new ValidationError('No file provided')
  }

  if (!(file instanceof File)) {
    throw new ValidationError('Invalid file')
  }

  if (!validateImageType(file)) {
    throw new ValidationError(`Unsupported file type: ${file.type}`)
  }

  const maxFileSize = 10 * 1024 * 1024
  if (file.size > maxFileSize) {
    throw new ValidationError('File too large. Maximum size is 10MB')
  }

  const timestamp = Date.now()
  const sanitizedName = validateAndSanitizeFilename(file.name)
  const ext = sanitizedName.split('.').pop() || 'png'
  const fileName = `upload_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  let imageDimensions = { width: 0, height: 0 }
  try {
    imageDimensions = await getImageDimensionsFromHeader(buffer)
  } catch {}

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
    Metadata: {
      'original-name': sanitizedName,
      'final-name': fileName,
      'upload-time': new Date().toISOString(),
      'is-liked': 'false',
      'width': imageDimensions.width.toString(),
      'height': imageDimensions.height.toString()
    }
  }))

  const url = getPublicUrl(fileName)

  try {
    let index = { version: '1.0.0', lastUpdated: new Date().toISOString(), totalCount: 0, images: [] as any[], likedCount: 0 }
    try {
      const getRes = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: 'index.json'
      }))
      const content = await getRes.Body?.transformToString()
      if (content) index = JSON.parse(content)
    } catch {}

    index.images.unshift({
      fileName,
      uploadTime: new Date().toISOString(),
      size: file.size,
      width: imageDimensions.width,
      height: imageDimensions.height,
      isLiked: false
    })
    index.totalCount = index.images.length
    index.lastUpdated = new Date().toISOString()

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: 'index.json',
      Body: JSON.stringify(index),
      ContentType: 'application/json'
    }))
  } catch (e) {
    console.warn('Index update failed:', e)
  }

  return NextResponse.json(createApiResponse(true, {
    url,
    markdown: `![${fileName}](${url})`,
    html: `<img src="${url}" alt="${fileName}" />`
  }))
})

async function getImageDimensionsFromHeader(buffer: Buffer): Promise<{ width: number; height: number }> {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    for (let i = 2; i < buffer.length - 8; i++) {
      if (buffer[i] === 0xFF && (buffer[i + 1] === 0xC0 || buffer[i + 1] === 0xC2)) {
        const height = (buffer[i + 5] << 8) | buffer[i + 6]
        const width = (buffer[i + 7] << 8) | buffer[i + 8]
        return { width, height }
      }
    }
  }
  if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height }
  }
  return { width: 0, height: 0 }
}
