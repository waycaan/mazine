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
  license: 'MIT'
} as const;
import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { createPreviewImage } from '@/components/utils/thumbs'
import { withErrorHandler, createApiResponse, ValidationError } from '@/lib/error-handler'
import { withIronAuth } from '@/lib/iron-session'
import { validateAndSanitizeFilename, validateImageType } from '@/utils/imageProcess'
import { imageIndexManager } from '@/utils/image-index-manager'
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
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
function sanitizeMetadataValue(value: string): string {
  if (/[^\x00-\x7F]/.test(value)) {
    return `base64:${Buffer.from(value).toString('base64')}`;
  }
  return value;
}
export const POST = withIronAuth(withErrorHandler(async (request: NextRequest) => {
  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const previewFiles = formData.getAll('previews') as File[]
  if (process.env.NODE_ENV === 'development') {
    console.log('Upload request:', {
      filesCount: files.length,
      previewsCount: previewFiles.length
    })
  }
  if (files.length === 0) {
    throw new ValidationError('No files provided for upload')
  }
  const uploadedFiles = []
  const allUploadedFileInfo = [] 
  const maxFileSize = 10 * 1024 * 1024 
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const previewFile = previewFiles[i]
    const fileStartTime = Date.now(); 
    if (!(file instanceof File)) {
      throw new ValidationError(`Invalid file at index ${i}`)
    }
    console.log(`🚀 [上传API] 开始处理文件 ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    try {
      if (!validateImageType(file)) {
        throw new ValidationError(`Unsupported file type: ${file.type}`)
      }
      if (file.size > maxFileSize) {
        throw new ValidationError(`File too large: ${file.name}. Maximum size is 10MB`)
      }
      const finalFileName = formData.get('finalFileName') as string
      if (!finalFileName) {
        throw new ValidationError('Final file name not provided by frontend')
      }
      // Validate finalFileName: no path traversal
      if (finalFileName.includes('..') || finalFileName.startsWith('/') || finalFileName.includes('\\')) {
        throw new ValidationError('Invalid file name: path traversal detected')
      }
      console.log(`🔍 [服务器] 文件 ${i + 1}/${files.length}:`);
      console.log(`   - 原始文件名: ${file.name}`);
      console.log(`   - 前端传递的最终文件名: ${finalFileName}`);
      const sanitizedName = validateAndSanitizeFilename(file.name)
      if (!(previewFile instanceof File)) {
        throw new ValidationError('Preview file is required')
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      let imageDimensions = { width: 0, height: 0 };
      try {
        imageDimensions = await getImageDimensionsFromHeader(buffer);
      } catch (error) {
        console.warn('Failed to get image dimensions:', error);
      }
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: finalFileName,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          'original-name': sanitizeMetadataValue(sanitizedName),
          'final-name': sanitizeMetadataValue(finalFileName),
          'upload-time': new Date().toISOString(),
          'is-liked': 'false',
          'liked-at': '',
          'width': imageDimensions.width.toString(),
          'height': imageDimensions.height.toString()
        }
      }))
      const previewBuffer = Buffer.from(await previewFile.arrayBuffer())
      const baseFileName = finalFileName.replace(/\.[^/.]+$/, '') 
      const previewFileName = `thumbs/${baseFileName}.webp` 
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: previewFileName,
        Body: previewBuffer,
        ContentType: 'image/webp'
      }))
      const url = getPublicUrl(finalFileName)
      const previewUrl = getPublicUrl(previewFileName)
      uploadedFiles.push({
        fileName: finalFileName,
        url,
        previewUrl,
        markdown: `![${finalFileName}](${url})`,
        bbcode: `[img]${url}[/img]`,
        html: `<img src="${url}" alt="${finalFileName}" />`,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toISOString()
      })
      allUploadedFileInfo.push({
        fileName: finalFileName,
        size: file.size,
        width: imageDimensions.width,
        height: imageDimensions.height
      })
      const fileProcessingTime = Date.now() - fileStartTime;
      console.log(`✅ [上传API] 文件处理完成: ${file.name} (总耗时: ${fileProcessingTime}ms)`);
      if (fileProcessingTime > 10000) { 
        console.warn(`⚠️ [上传API] 文件处理耗时过长: ${fileProcessingTime}ms，文件: ${file.name}`);
      }
    } catch (uploadError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Individual file upload failed:', {
          fileName: file.name,
          error: uploadError.message
        })
      }
      uploadedFiles.push({
        originalName: file.name,
        error: uploadError.message || 'Upload failed'
      })
    }
  }
  console.log(`🚀 [上传API] 成功上传 ${allUploadedFileInfo.length} 个文件`);
  const newImageItems = allUploadedFileInfo.map(info => ({
    fileName: info.fileName,
    uploadTime: new Date().toISOString(),
    size: info.size,
    width: info.width,
    height: info.height,
    isLiked: false
  }));

  // Server-side index update: read index.json via S3Client, append new images, write back
  let newIndex = null;
  if (newImageItems.length > 0) {
    try {
      let index = { version: '1.0.0', lastUpdated: new Date().toISOString(), totalCount: 0, images: [] as any[], likedCount: 0 };
      try {
        const getRes = await s3Client.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: 'index.json'
        }));
        const content = await getRes.Body?.transformToString();
        if (content) index = JSON.parse(content);
      } catch {}

      const existingNames = new Set(index.images.map((img: any) => img.fileName));
      const unique = newImageItems.filter(item => !existingNames.has(item.fileName));
      index.images.unshift(...unique);
      index.totalCount = index.images.length;
      index.likedCount = index.images.filter((img: any) => img.isLiked).length;
      index.lastUpdated = new Date().toISOString();

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: 'index.json',
        Body: JSON.stringify(index),
        ContentType: 'application/json'
      }));
      newIndex = index;
    } catch (e) {
      console.warn('Server-side index update failed:', e);
    }
  }

  return NextResponse.json(createApiResponse(true, {
    files: uploadedFiles,
    newImageItems: newImageItems,
    newIndex: newIndex
  }))
}))
async function getImageDimensionsFromHeader(buffer: Buffer): Promise<{ width: number; height: number }> {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    for (let i = 2; i < buffer.length - 8; i++) {
      if (buffer[i] === 0xFF && (buffer[i + 1] === 0xC0 || buffer[i + 1] === 0xC2)) {
        const height = (buffer[i + 5] << 8) | buffer[i + 6];
        const width = (buffer[i + 7] << 8) | buffer[i + 8];
        return { width, height };
      }
    }
  }
  if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }
  return { width: 0, height: 0 };
}