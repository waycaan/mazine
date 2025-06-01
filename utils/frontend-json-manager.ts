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

import { ImageIndex, ImageIndexItem } from '@/types/image-index';
import { getCSRFToken } from '@/utils/auth-client';
const logResult = (action: string, totalCount: number, likedCount: number) => {
  console.log(`📊 ${action}: 总数 ${totalCount}, 收藏 ${likedCount}`);
};
export interface JsonUpdateOperation {
  type: 'upload' | 'delete' | 'like' | 'unlike';
  data: any;
}
export interface JsonUpdateResult {
  success: boolean;
  newJson: ImageIndex;
  error?: string;
  clearCache?: boolean;
}
class FrontendJsonManager {
  private currentJson: ImageIndex | null = null;
  constructor() {
    if (typeof window !== 'undefined') {
      this.handlePageRefresh();
    }
  }
  private handlePageRefresh(): void {
    const isPageRefresh = (performance as any).navigation?.type === 1 ||
                         (performance.getEntriesByType('navigation')[0] as any)?.type === 'reload';
    if (isPageRefresh) {
      this.currentJson = null;
    }
  }
  setCurrentJson(json: ImageIndex): void {
    this.currentJson = null;
    this.currentJson = { ...json };
    logResult('数据加载', json.totalCount, json.likedCount);
  }
  clearCurrentJson(): void {
    this.currentJson = null;
  }
  clearCache(): void {
    this.currentJson = null;
    this.clearMetadataCaches();
  }
  getCurrentJson(): ImageIndex | null {
    return this.currentJson ? { ...this.currentJson } : null;
  }
  calculateUploadIncrement(newImages: ImageIndexItem[]): ImageIndex {
    if (!this.currentJson) {
      throw new Error('当前JSON数据为空，无法计算增量');
    }
    const updatedJson: ImageIndex = {
      ...this.currentJson,
      images: [...this.currentJson.images],
      lastUpdated: new Date().toISOString()
    };
    const existingFileNames = new Set(updatedJson.images.map(img => img.fileName));
    const uniqueNewImages = newImages.filter(img => !existingFileNames.has(img.fileName));
    updatedJson.images.unshift(...uniqueNewImages);
    updatedJson.totalCount = updatedJson.images.length;
    updatedJson.likedCount = updatedJson.images.filter(img => img.isLiked).length;
    logResult('上传完成', updatedJson.totalCount, updatedJson.likedCount);
    return updatedJson;
  }
  calculateDeleteDecrement(fileNamesToDelete: string[]): ImageIndex {
    if (!this.currentJson) {
      throw new Error('当前JSON数据为空，无法计算减量');
    }
    const updatedJson: ImageIndex = {
      ...this.currentJson,
      images: [...this.currentJson.images],
      lastUpdated: new Date().toISOString()
    };
    const filesToDeleteSet = new Set(fileNamesToDelete);
    updatedJson.images = updatedJson.images.filter(img => !filesToDeleteSet.has(img.fileName));
    updatedJson.totalCount = updatedJson.images.length;
    updatedJson.likedCount = updatedJson.images.filter(img => img.isLiked).length;
    logResult('删除完成', updatedJson.totalCount, updatedJson.likedCount);
    return updatedJson;
  }
  calculateLikeToggle(fileName: string, isLiked: boolean): ImageIndex {
    if (!this.currentJson) {
      throw new Error('当前JSON数据为空，无法计算收藏变更');
    }
    const updatedJson: ImageIndex = {
      ...this.currentJson,
      images: [...this.currentJson.images],
      lastUpdated: new Date().toISOString()
    };
    const imageIndex = updatedJson.images.findIndex(img => img.fileName === fileName);
    if (imageIndex === -1) {
      throw new Error(`图片 ${fileName} 在JSON中不存在`);
    }
    updatedJson.images[imageIndex] = {
      ...updatedJson.images[imageIndex],
      isLiked
    };
    updatedJson.likedCount = updatedJson.images.filter(img => img.isLiked).length;
    logResult(isLiked ? '收藏' : '取消收藏', updatedJson.totalCount, updatedJson.likedCount);
    return updatedJson;
  }
  calculateBatchLikeToggle(fileNames: string[], isLiked: boolean): ImageIndex {
    if (!this.currentJson) {
      throw new Error('当前JSON数据为空，无法计算批量收藏变更');
    }
    const updatedJson: ImageIndex = {
      ...this.currentJson,
      images: [...this.currentJson.images],
      lastUpdated: new Date().toISOString()
    };
    const fileNameSet = new Set(fileNames);
    updatedJson.images.forEach((img, index) => {
      if (fileNameSet.has(img.fileName) && img.isLiked !== isLiked) {
        updatedJson.images[index] = { ...img, isLiked };
      }
    });
    updatedJson.likedCount = updatedJson.images.filter(img => img.isLiked).length;
    logResult(`批量${isLiked ? '收藏' : '取消收藏'}`, updatedJson.totalCount, updatedJson.likedCount);
    return updatedJson;
  }
  private clearMetadataCaches(): void {
    if (typeof window === 'undefined') return;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('_status') ||
        key.includes('image_index') ||
        key.includes('managed_images') ||
        key.includes('liked_images') ||
        key.includes('recent_modification') ||
        key.endsWith('_cache') && !key.includes('image_preview')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }
  async sendJsonToServer(updatedJson: ImageIndex, operation: string): Promise<JsonUpdateResult> {
    try {
      const csrfToken = getCSRFToken();
      if (!csrfToken) {
        throw new Error('CSRF token not found');
      }
      const response = await fetch('/api/json/overwrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          json: updatedJson,
          operation
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        if (result.clearCache) {
          this.clearMetadataCaches();
        }
        this.setCurrentJson(result.newJson);
        return {
          success: true,
          newJson: result.newJson,
          clearCache: result.clearCache || false
        };
      } else {
        throw new Error(result.error || 'JSON覆盖失败');
      }
    } catch (error: any) {
      return {
        success: false,
        newJson: updatedJson,
        error: error.message
      };
    }
  }
  getStats(): { totalCount: number; likedCount: number; lastUpdated: string } | null {
    if (!this.currentJson) return null;
    return {
      totalCount: this.currentJson.totalCount,
      likedCount: this.currentJson.likedCount,
      lastUpdated: this.currentJson.lastUpdated
    };
  }
}
export const frontendJsonManager = new FrontendJsonManager();