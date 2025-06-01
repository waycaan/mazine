/*
 * MIT License
 * 
 * Copyright (c) 2024 waycaan
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || ''
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true
})
function getPublicUrl(fileName: string): string {
  const endpoint = process.env.S3_ENDPOINT || ''
  const bucket = process.env.S3_BUCKET_NAME || ''
  const encodedFileName = encodeURIComponent(fileName)
  if (endpoint.includes('amazonaws.com')) {
    return `https:
  }
  return `${endpoint}/${bucket}/${encodedFileName}`
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
const getMessage = (key: MessageKey): string => messages[getCurrentLang()][key];
export async function GET(request: NextRequest) {
  try {
    const data = await s3Client.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 1000
    }))
    if (data.IsTruncated) {
      const nextData = await s3Client.send(new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        MaxKeys: 1000,
        ContinuationToken: data.NextContinuationToken
      }))
      if (nextData.Contents) {
        data.Contents = [...(data.Contents || []), ...nextData.Contents]
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('S3 response items count:', data.Contents?.length || 0)
    }
    const likedFiles = new Set<string>()
    const imageFiles = (data.Contents || []).filter(item => {
      const key = item.Key!
      if (key.startsWith('likes/')) {
        likedFiles.add(key.replace('likes/', ''))
        return false
      }
      return true
    })
    const images = await Promise.all(imageFiles.map(async item => {
      const fileName = item.Key!
      const url = getPublicUrl(fileName)
      const previewUrl = getPublicUrl(`thumbs/${fileName}`)
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Processed files:', {
        images: images.length,
        likedFiles: likedFiles.size
      })
    }
    return NextResponse.json({
      files: images,
      likedFiles: Array.from(likedFiles)
    })
  } catch (error) {
    console.error('Failed to get image list:', error)
    return NextResponse.json({
      error: getMessage('listFailed')
    }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: '上传成功'
  })
}