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

import { ImageIndexItem, ProcessedImageItem } from '@/types/image-index';
function getCDNBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_CDN || '';
  }
  return process.env.NEXT_PUBLIC_CDN || '';
}
export function generateImageUrl(fileName: string): string {
  const baseUrl = getCDNBaseUrl();
  if (!baseUrl) {
    console.warn('CDN URL未配置');
    return '';
  }
  const encodedFileName = encodeURIComponent(fileName);
  return `${baseUrl.replace(/\/$/, '')}/${encodedFileName}`;
}
export function generatePreviewUrl(fileName: string): string {
  const baseUrl = getCDNBaseUrl();
  if (!baseUrl) {
    console.warn('CDN URL未配置');
    return '';
  }
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const previewFileName = `thumbs/${nameWithoutExt}.webp`;
  const encodedPreviewFileName = encodeURIComponent(previewFileName);
  return `${baseUrl.replace(/\/$/, '')}/${encodedPreviewFileName}`;
}
export function generateDisplayUrl(fileName: string): string {
  const baseUrl = getCDNBaseUrl();
  if (!baseUrl) {
    console.warn('CDN URL未配置');
    return '';
  }
  return `${baseUrl.replace(/\/$/, '')}/${fileName}`;
}
export function generateMarkdownLink(fileName: string, originalName: string): string {
  const url = generateImageUrl(fileName);
  return `![${originalName}](${url})`;
}
export function generateBBCodeLink(fileName: string): string {
  const url = generateImageUrl(fileName);
  return `[img]${url}[/img]`;
}
export function processImageItem(item: ImageIndexItem): ProcessedImageItem {
  return {
    ...item,
    url: generateImageUrl(item.fileName),
    previewUrl: generatePreviewUrl(item.fileName),
    markdown: generateMarkdownLink(item.fileName, item.originalName),
    bbcode: generateBBCodeLink(item.fileName)
  };
}
export function processImageItems(items: ImageIndexItem[]): ProcessedImageItem[] {
  return items.map(processImageItem);
}
export function getPaginatedImages(
  items: ImageIndexItem[],
  page: number,
  pageSize: number = 10
): {
  images: ProcessedImageItem[];
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
} {
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  return {
    images: processImageItems(paginatedItems),
    totalPages: Math.ceil(items.length / pageSize),
    currentPage: page,
    hasMore: endIndex < items.length
  };
}
export function getLikedImages(items: ImageIndexItem[]): ProcessedImageItem[] {
  const likedItems = items.filter(item => item.isLiked);
  return processImageItems(likedItems);
}
export function searchImages(
  items: ImageIndexItem[],
  query: string
): ProcessedImageItem[] {
  if (!query.trim()) {
    return processImageItems(items);
  }
  const lowerQuery = query.toLowerCase();
  const filteredItems = items.filter(item => 
    item.originalName.toLowerCase().includes(lowerQuery) ||
    item.fileName.toLowerCase().includes(lowerQuery)
  );
  return processImageItems(filteredItems);
}
export function filterImagesByDateRange(
  items: ImageIndexItem[],
  startDate: string,
  endDate: string
): ProcessedImageItem[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const filteredItems = items.filter(item => {
    const uploadDate = new Date(item.uploadTime);
    return uploadDate >= start && uploadDate <= end;
  });
  return processImageItems(filteredItems);
}
export function hasPreviewImage(fileName: string): boolean {
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return supportedExtensions.includes(ext);
}