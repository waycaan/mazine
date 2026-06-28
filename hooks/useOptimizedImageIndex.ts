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

import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageIndex, ImageIndexResponse } from '@/types/image-index';

interface UseOptimizedImageIndexOptions {
  enableCache?: boolean;
}

export interface UseOptimizedImageIndexReturn {
  index: ImageIndex | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refreshIndex: () => Promise<void>;
  prefetchIndex: () => Promise<void>;
  setIndexData: (data: ImageIndex) => void;
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
        return { index: JSON.parse(cached), etag };
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
      const headers: HeadersInit = { 'Cache-Control': 'no-cache' };
      if (lastETagRef.current && !rebuild) {
        headers['If-None-Match'] = lastETagRef.current;
      }

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers
      });

      if (response.status === 304) {
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

      setCachedIndex(newIndex, newETag);
      lastETagRef.current = newETag;

      setIndex(null);
      setError(null);
      setTimeout(() => {
        setIndex(newIndex);
        setLastUpdated(newIndex.lastUpdated);
      }, 10);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
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

  const prefetchIndex = useCallback(async (): Promise<void> => {
    try {
      const headers: HeadersInit = { 'Cache-Control': 'no-cache' };
      if (lastETagRef.current) {
        headers['If-None-Match'] = lastETagRef.current;
      }

      const response = await fetch('/api/images/index', { headers });

      if (response.status === 304) return;
      if (!response.ok) return;

      const result: ImageIndexResponse = await response.json();
      if (!result.success || !result.data) return;

      const newIndex = result.data;
      const newETag = response.headers.get('ETag') || Date.now().toString();

      setCachedIndex(newIndex, newETag);
      lastETagRef.current = newETag;
      setIndex(newIndex);
      setLastUpdated(newIndex.lastUpdated);
    } catch (error) {
      // 后台预取失败静默处理
    }
  }, [setCachedIndex]);

  const updateIndexOptimistically = useCallback((operation: IndexOperation | IndexOperation[]) => {
    if (!index) return;
    const operations = Array.isArray(operation) ? operation : [operation];
    if (operations.length === 0) return;

    const newIndex = { ...index, images: [...index.images] };
    operations.forEach(op => {
      switch (op.type) {
        case 'add':
          newIndex.images.unshift({
            fileName: op.fileName,
            size: op.data.size || 0,
            uploadTime: new Date().toISOString(),
            isLiked: false
          });
          break;
        case 'remove':
          newIndex.images = newIndex.images.filter(img => img.fileName !== op.fileName);
          break;
        case 'toggleLike':
          const idx = newIndex.images.findIndex(img => img.fileName === op.fileName);
          if (idx !== -1) {
            newIndex.images[idx] = { ...newIndex.images[idx], isLiked: op.data.isLiked };
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
  }, [index, setCachedIndex]);

  const updateMetadataSilently = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/images/index', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) return;

      const result: ImageIndexResponse = await response.json();
      if (!result.success || !result.data) return;

      const newIndex = result.data;
      const newETag = response.headers.get('ETag') || Date.now().toString();
      lastETagRef.current = newETag;
      setCachedIndex(newIndex, newETag);

      if (index) {
        setIndex({
          ...index,
          totalCount: newIndex.totalCount,
          likedCount: newIndex.likedCount,
          lastUpdated: newIndex.lastUpdated
        });
        setLastUpdated(newIndex.lastUpdated);
      }
    } catch (error) {
      // 静默失败
    }
  }, [index, setCachedIndex]);

  const setIndexData = useCallback((data: ImageIndex) => {
    const newETag = Date.now().toString();
    setCachedIndex(data, newETag);
    lastETagRef.current = newETag;
    setIndex(data);
    setLastUpdated(data.lastUpdated);
  }, [setCachedIndex]);

  const refreshIndex = useCallback(async (): Promise<void> => {
    await fetchIndex(false, true);
  }, [fetchIndex]);

  const forceRebuild = useCallback(async (): Promise<void> => {
    invalidateCache();
    await fetchIndex(true);
  }, [fetchIndex, invalidateCache]);

  useEffect(() => {
    const isPageRefresh = (performance as any).navigation?.type === 1 ||
                         (performance.getEntriesByType('navigation')[0] as any)?.type === 'reload';
    if (isPageRefresh) {
      fetchIndex(false, true);
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
    prefetchIndex,
    setIndexData,
    forceRebuild,
    invalidateCache,
    updateIndexOptimistically,
    updateMetadataSilently
  };
}
