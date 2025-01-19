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

const TYPE_INFO = {
  id: 'mazine-types-image-v1.0.0',
  name: 'ImageTypes',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

// 图片尺寸类型
export interface ImageDimensions {
  width: number
  height: number
}

// 基础图片类型
export interface ImageFile {
  originalName: string
  fileName: string
  url: string
  previewUrl?: string
  markdown: string
  bbcode: string
  size: number
  uploadTime: string
  dimensions: {
    width: number
    height: number
  }
}

// 管理页面的图片类型
export interface ManagedImage extends ImageFile {
  isLiked: boolean
}

// 收藏页面的图片类型
export interface LikedImage extends ImageFile {
  isLiked: boolean
  likedAt?: string
}

// 上传响应类型
export interface ImageUploadResponse {
  success: boolean
  error?: string
  files?: ImageFile[]
}

export interface ImageListResponse {
  success: boolean
  data?: ImageFile[]
  error?: string
}

// 新的图片列表响应类型
export interface ImagesResponse {
  images: ImageFile[]
  likedFiles: string[] // likes/目录下的文件名列表
} 
