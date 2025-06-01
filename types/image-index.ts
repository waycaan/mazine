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

export interface ImageIndexItem {
  fileName: string;
  size: number;
  uploadTime: string;
  isLiked: boolean;
  width?: number;
  height?: number;
}
export interface ImageIndex {
  version: string;
  lastUpdated: string;
  totalCount: number;
  images: ImageIndexItem[];
  likedCount: number;
}
export interface ImageIndexResponse {
  success: boolean;
  data?: ImageIndex;
  error?: string;
}
export interface ProcessedImageItem extends ImageIndexItem {
  url: string;
  previewUrl: string;
  markdown: string;
  bbcode: string;
}
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  preloadedPages: Set<number>;
}
export interface ImageLoadState {
  loadedImages: Set<string>;
  loadingImages: Set<string>;
  failedImages: Set<string>;
}