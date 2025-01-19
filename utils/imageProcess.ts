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

import imageCompression from 'browser-image-compression'
import type { Options as ImageCompressionOptions } from 'browser-image-compression'

const UTIL_INFO = {
  id: 'mazine-util-imageprocess-v1.0.0',
  name: 'ImageProcess',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

// 获取图片尺寸
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      })
    }
    img.onerror = reject
    img.src = url
  })
}

// 检查文件类型
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// 检查文件大小
export function checkFileSize(file: File, maxSize: number = 5 * 1024 * 1024): boolean {
  return file.size <= maxSize
}

// 生成预览URL
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

// 清理预览URL
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}

// 文件大小限制常量
export const FILE_SIZE_LIMITS = {
  SINGLE_FILE: 4.4 * 1024 * 1024,    // 4.4MB - Vercel限制
  BATCH_UPLOAD: 4.4 * 1024 * 1024,   // 4.4MB - 批量上传限制
  MAX_FILES: 20                       // 最大文件数
} as const

// 检查文件大小是否超出限制
export function isOverSizeLimit(file: File): boolean {
  return file.size > FILE_SIZE_LIMITS.SINGLE_FILE
}

// 计算文件列表总大小
export function calculateTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0)
}

// 处理文件名重复
export function generateUniqueFileName(fileName: string, existingFiles: string[]): string {
  if (!existingFiles.includes(fileName)) return fileName;
  
  const ext = fileName.split('.').pop() || '';
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  let counter = 1;
  let newFileName = `${baseName}_${counter}.${ext}`;
  
  while (existingFiles.includes(newFileName)) {
    counter++;
    newFileName = `${baseName}_${counter}.${ext}`;
  }
  
  return newFileName;
}

// WebP 转换函数
export const convertToWebP = async (file: File, fileName?: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], fileName || file.name, {
              type: 'image/webp'
            }));
          } else {
            reject(new Error('WebP 转换失败'));
          }
        },
        'image/webp',
        1
      );
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
};

const compressionOptions: ImageCompressionOptions = {
  maxSizeMB: 4.4,  // Vercel限制
  useWebWorker: true,
  initialQuality: 0.85,
}

// 修改处理选项接口
interface ProcessOptions {
  forceWebP?: boolean;
  forceCompress?: boolean;
  fileName?: string;
}

// 修改压缩函数，添加尺寸控制
export const compressImage = async (
  file: File, 
  fileName?: string,
  options?: ImageCompressionOptions
): Promise<File> => {
  try {
    const compressedFile = await imageCompression(file, {
      ...compressionOptions,
      ...(options || {})
    })
    return new File([compressedFile], fileName || file.name, {
      type: compressedFile.type
    })
  } catch (error) {
    console.error('图片压缩失败:', error)
    return file
  }
}

// 修改处理函数
export const processFile = async (
  file: File,
  options: ProcessOptions
): Promise<File | null> => {
  let processedFile = file;
  const { forceWebP, forceCompress, fileName } = options;
  
  try {
    // 1. 如果需要转换为WebP
    if (forceWebP && file.type.startsWith('image/')) {
      processedFile = await convertToWebP(processedFile, fileName);
    }
    
    // 2. 如果需要压缩
    if (forceCompress || isOverSizeLimit(processedFile)) {
      processedFile = await compressImage(processedFile, fileName);
      
      if (isOverSizeLimit(processedFile)) {
        console.warn(`压缩后文件仍然过大: ${file.name}`);
        return null;
      }
    }
    
    return processedFile;
  } catch (error) {
    console.error(`处理文件失败: ${file.name}`, error);
    return null;
  }
}

// 创建预览图的函数
export async function createPreviewImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // 计算等比缩放的尺寸
      const maxSize = 200
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // 绘制图像到画布
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转换为 WebP 格式的 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/webp',
        0.8  // 质量参数
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
