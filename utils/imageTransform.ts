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

import { ImageFile } from '@/types/image'

export function getPublicUrl(fileName: string): string {
  if (process.env.NEXT_PUBLIC_CDN) {
    return `${process.env.NEXT_PUBLIC_CDN.replace(/\/$/, '')}/${fileName}`
  }
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '')
  const bucket = process.env.S3_BUCKET_NAME
  return `${endpoint}/${bucket}/${fileName}`
}

export function separateImagesAndLikes(files: any[]): {
  imageFiles: any[]
  likedFiles: Set<string>
} {
  const likedFiles = new Set<string>()
  const imageFiles = files.filter(item => {
    const key = item.Key
    if (key.startsWith('likes/')) {
      likedFiles.add(key.replace('likes/', ''))
      return false
    }
    return true
  })

  return { imageFiles, likedFiles }
}

export function processImageMetadata(file: any): ImageFile {
  const fileName = file.Key
  const url = getPublicUrl(fileName)

  return {
    originalName: fileName,
    fileName,
    url,
    size: file.Size,
    uploadTime: file.LastModified?.toISOString(),
    markdown: `![${fileName}](${url})`,
    bbcode: `[img]${url}[/img]`,
    dimensions: {
      width: 0,
      height: 0
    }
  }
}

export function processImages(files: any[]): {
  images: ImageFile[]
  likedFiles: string[]
} {
  const { imageFiles, likedFiles } = separateImagesAndLikes(files)
  const images = imageFiles.map(file => processImageMetadata(file))

  return {
    images,
    likedFiles: Array.from(likedFiles)
  }
}

export function transformImages(rawData: any) {
  const { Contents = [] } = rawData;
  
  const images = Contents.map((item: any) => ({
    fileName: item.Key,
    originalName: item.Key,
    url: `/api/images/${encodeURIComponent(item.Key)}`,
    markdown: `![${item.Key}](/api/images/${encodeURIComponent(item.Key)})`,
    bbcode: `[img]/api/images/${encodeURIComponent(item.Key)}[/img]`,
    uploadTime: item.LastModified,
    size: item.Size,
    isLiked: false
  }));

  return {
    images,
    likedFiles: []
  };
} 
