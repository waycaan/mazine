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

import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageIndex, ImageIndexResponse } from '@/types/image-index';
interface UseOptimizedImageIndexOptions {
  enableCache?: boolean;
}
interface UseOptimizedImageIndexReturn {
  index: ImageIndex | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refreshIndex: () => Promise<void>;
  forceRebuild: () => Promise<void>;
  invalidateCache: () => void;
  updateIndexOptimistically: (operation: IndexOperation | IndexOperation[]) => void;
  updateMetadataSilently: () => Promise<void>;
}
interface IndexOperation {
  type: 'add' | 'remove' | 'toggleLike';
  fileName: string;
  data?: any;
}
const CACHE_KEY = 'optimized_image_index';
const CACHE_ETAG_KEY = 'optimized_index_etag';
export function useOptimizedImageIndex({
  enableCache = true
}: UseOptimizedImageIndexOptions = {}): UseOptimizedImageIndexReturn {
  const [index, setIndex] = useState<ImageIndex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController>();
  const lastETagRef = useRef<string>('');
  const getCachedIndex = useCallback((): { index: ImageIndex; etag: string } | null => {
    if (!enableCache || typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const etag = localStorage.getItem(CACHE_ETAG_KEY);
      if (cached && etag) {
        return {
          index: JSON.parse(cached),
          etag
        };
      }
    } catch (error) {
      console.warn('读取缓存失败:', error);
    }
    return null;
  }, [enableCache]);
  const setCachedIndex = useCallback((data: ImageIndex, etag: string) => {
    if (!enableCache || typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_ETAG_KEY, etag);
    } catch (error) {
      console.warn('保存缓存失败:', error);
    }
  }, [enableCache]);
  const invalidateCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_ETAG_KEY);
      lastETagRef.current = '';
    } catch (error) {
      console.warn('清除缓存失败:', error);
    }
  }, []);
  const fetchIndex = useCallback(async (rebuild: boolean = false, forceRefresh: boolean = false): Promise<void> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      setIsLoading(true);
      setError(null);
      if (!rebuild && !forceRefresh) {
        const cached = getCachedIndex();
        if (cached) {
          setIndex(cached.index);
          setLastUpdated(cached.index.lastUpdated);
          lastETagRef.current = cached.etag;
          setIsLoading(false);
          return;
        }
      }
      const url = rebuild ? '/api/images/index?rebuild=true' : '/api/images/index';
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache'
      };
      if (lastETagRef.current && !rebuild) {
        headers['If-None-Match'] = lastETagRef.current;
      }
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers
      });
      if (response.status === 304) {
        console.log('📋 索引数据未变化，使用缓存');
        setIsLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ImageIndexResponse = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取索引失败');
      }
      const newIndex = result.data;
      const newETag = response.headers.get('ETag') || Date.now().toString();
      setIndex(null); 
      setError(null); 
      setTimeout(() => {
        setIndex(newIndex);
        setLastUpdated(newIndex.lastUpdated);
        lastETagRef.current = newETag;
        setCachedIndex(newIndex, newETag);
      }, 10);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; 
      }
      setError(error.message || '获取索引失败');
      if (!index) {
        const cached = getCachedIndex();
        if (cached) {
          setIndex(cached.index);
          setLastUpdated(cached.index.lastUpdated);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCachedIndex, setCachedIndex]);
  const updateIndexOptimistically = useCallback((operation: IndexOperation | IndexOperation[]) => {
    if (!index) return;
    const operations = Array.isArray(operation) ? operation : [operation];
    if (operations.length === 0) return;
    console.log(`🔄 积极更新: ${operations.length} 个操作`);
    const newIndex = { ...index, images: [...index.images] };
    operations.forEach(op => {
      switch (op.type) {
        case 'add':
          const newItem = {
            fileName: op.fileName,
            originalName: op.data.originalName,
            size: op.data.size,
            uploadTime: new Date().toISOString(),
            isLiked: false
          };
          newIndex.images.unshift(newItem);
          break;
        case 'remove':
          newIndex.images = newIndex.images.filter(img => img.fileName !== op.fileName);
          break;
        case 'toggleLike':
          const imageIndex = newIndex.images.findIndex(img => img.fileName === op.fileName);
          if (imageIndex !== -1) {
            newIndex.images[imageIndex].isLiked = op.data.isLiked;
          }
          break;
      }
    });
    newIndex.totalCount = newIndex.images.length;
    newIndex.likedCount = newIndex.images.filter(img => img.isLiked).length;
    newIndex.lastUpdated = new Date().toISOString();
    setIndex(newIndex);
    setLastUpdated(newIndex.lastUpdated);
    const newETag = Date.now().toString();
    setCachedIndex(newIndex, newETag);
    lastETagRef.current = newETag;
    console.log(`🔄 积极更新完成: ${operations.length} 个操作`);
  }, [index, setCachedIndex]);
  const updateMetadataSilently = useCallback(async (): Promise<void> => {
    console.log('🔄 静默更新元数据，不影响当前UI...');
    try {
      const response = await fetch('/api/images/index', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result: ImageIndexResponse = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || '获取索引失败');
      }
      const newIndex = result.data;
      const newETag = response.headers.get('ETag') || Date.now().toString();
      lastETagRef.current = newETag;
      setCachedIndex(newIndex, newETag);
      if (index) {
        const updatedIndex = {
          ...index,
          totalCount: newIndex.totalCount,
          likedCount: newIndex.likedCount,
          lastUpdated: newIndex.lastUpdated
        };
        setIndex(updatedIndex);
        setLastUpdated(newIndex.lastUpdated);
      }
      console.log(`📊 元数据更新: 总数 ${newIndex.totalCount}, 收藏 ${newIndex.likedCount}`);
    } catch (error) {
    }
  }, [index, setCachedIndex]);
  const refreshIndex = useCallback(async (): Promise<void> => {
    invalidateCache(); 
    await fetchIndex(false, true); 
  }, [fetchIndex, invalidateCache]);
  const forceRebuild = useCallback(async (): Promise<void> => {
    invalidateCache();
    await fetchIndex(true);
  }, [fetchIndex, invalidateCache]);
  useEffect(() => {
    const isPageRefresh = (performance as any).navigation?.type === 1 ||
                         (performance.getEntriesByType('navigation')[0] as any)?.type === 'reload';
    if (isPageRefresh) {
      invalidateCache();
      setIndex(null);
      setError(null);
      setLastUpdated(null);
      lastETagRef.current = '';
      setTimeout(() => {
        fetchIndex(false, true); 
      }, 100);
    } else {
      fetchIndex(false);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  return {
    index,
    isLoading,
    error,
    lastUpdated,
    refreshIndex,
    forceRebuild,
    invalidateCache,
    updateIndexOptimistically,
    updateMetadataSilently
  };
}