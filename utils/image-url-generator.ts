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
export function generateMarkdownLink(fileName: string): string {
  const url = generateImageUrl(fileName);
  return `![${fileName}](${url})`;
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
    markdown: generateMarkdownLink(item.fileName),
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