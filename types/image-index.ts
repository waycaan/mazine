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