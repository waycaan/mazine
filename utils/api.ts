import { ImageFile, ManagedImage, LikedImage, ImageUploadResponse } from '@/types/image'
import { ApiResponse } from '@/types/api'

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

const UTIL_INFO = {
  id: 'mazine-util-api-v1.0.0',
  name: 'APIClient',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

interface GetImagesParams {
  cursor?: string | null;
  limit?: number;
}

interface CachedData<T> {
  data: T[];
  version: string;
}

const CACHE_CONFIG = {
  version: '1.0.0',
  managed: {
    data: 'managed_images',
    status: 'managed_images_status'
  },
  liked: {
    data: 'liked_images',
    status: 'liked_images_status'
  }
} as const;

export const API_CONFIG = {
  ITEMS_PER_PAGE: 15,
  MAX_UPLOAD_SIZE: 4.4 * 1024 * 1024, // 4.4MB
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp']
} as const;

const handleApiError = (error: unknown, defaultMessage: string): never => {
  console.error(defaultMessage, error);
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(defaultMessage);
};

const fileNameUtils = {
  encode: (fileName: string): string => {
    try {
      return encodeURIComponent(fileName)
    } catch (e) {
      console.error('文件名编码失败:', { fileName, error: e })
      return fileName
    }
  },

  decode: (fileName: string): string => {
    try {
      return decodeURIComponent(fileName)
    } catch (e) {
      console.error('文件名解码失败:', { fileName, error: e })
      return fileName
    }
  }
}

const cacheUtils = {
  getCache<T>(key: string): T[] | null {
    try {
      const cached = localStorage.getItem(`${key}_cache`)
      if (!cached) {
        return null;
      }

      const parsedCache: CachedData<T> = JSON.parse(cached)
      const isModified = localStorage.getItem(`${key}_status`) === 'modified'
      
      if (parsedCache.version !== CACHE_CONFIG.version || isModified) {
        localStorage.removeItem(`${key}_cache`)
        return null
      }

      console.log(`使用缓存: ${key}`, { dataLength: parsedCache.data.length });
      return parsedCache.data
    } catch (error) {
      return null
    }
  },

  setCache<T>(key: string, data: T[]) {
    console.log(`设置缓存: ${key}`, { dataLength: data.length });
    const cacheData: CachedData<T> = {
      data,
      version: CACHE_CONFIG.version
    }
    localStorage.setItem(`${key}_cache`, JSON.stringify(cacheData))
    localStorage.removeItem(`${key}_status`)
  },

  markManagedModification() {
    localStorage.setItem(`${CACHE_CONFIG.managed.data}_status`, 'modified')
  },

  markLikedModification() {
    localStorage.setItem(`${CACHE_CONFIG.liked.data}_status`, 'modified')
  },

  clearManagedModification() {
    localStorage.removeItem(`${CACHE_CONFIG.managed.data}_status`)
  },

  clearLikedModification() {
    localStorage.removeItem(`${CACHE_CONFIG.liked.data}_status`)
  }
}

const apiRequest = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      console.error(`请求失败:`, {
        url,
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('请求失败: ' + response.statusText);
    }

    return response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

export const api = {
  images: {
    get: async (cursor?: string | null): Promise<ManagedImage[]> => {
      try {
        if (!cursor) {
          const cached = cacheUtils.getCache<ManagedImage>(CACHE_CONFIG.managed.data);
          if (cached) {
            return cached;
          }
        }

        const response = await apiRequest<{ files: ManagedImage[], likedFiles: string[] }>('/api/images');

        if (!response || !response.files) {
          return [];
        }

        const data = response.files;

        if (!cursor) {
          cacheUtils.setCache(CACHE_CONFIG.managed.data, data);
          cacheUtils.clearManagedModification();
        }

        if (response.likedFiles) {
          const likedImages = data
            .filter(img => response.likedFiles.includes(img.fileName))
            .map(img => ({
              ...img,
              isLiked: true
            }));
          cacheUtils.setCache(CACHE_CONFIG.liked.data, likedImages);
          cacheUtils.clearLikedModification();
        }

        return data;
      } catch (error) {
        console.error('获取图片列表失败:', {
          error,
          cursor,
          stack: new Error().stack
        });
        throw error;
      }
    },

    delete: async (fileNames: string[]): Promise<ApiResponse> => {
      const response = await apiRequest<ApiResponse>('/api/images/batch', {
        method: 'DELETE',
        body: JSON.stringify({ fileNames })
      })
      
      if (response.success) {
        const likedCache = cacheUtils.getCache<LikedImage>(CACHE_CONFIG.liked.data);
        const deletedLikedImages = likedCache?.some(img => fileNames.includes(img.fileName));
        
        cacheUtils.markManagedModification();
        if (deletedLikedImages) {
          cacheUtils.clearManagedModification();
        }
        
        api.images.get().catch(console.error);
      }
      
      return response;
    }
  },

  likes: {
    get: async (cursor?: string | null): Promise<LikedImage[]> => {
      try {
        if (!cursor) {
          const cached = cacheUtils.getCache<LikedImage>(CACHE_CONFIG.liked.data);
          if (cached) {
            return cached;
          }
        }

        const response = await apiRequest<{ files: ManagedImage[], likedFiles: string[] }>('/api/images');
        if (!response || !response.files || !response.likedFiles) {
          return [];
        }

        const likedImages = response.files
          .filter(img => response.likedFiles.includes(img.fileName))
          .map(img => ({
            ...img,
            isLiked: true
          }));

        if (!cursor) {
          cacheUtils.setCache(CACHE_CONFIG.liked.data, likedImages);
          cacheUtils.clearLikedModification();
        }

        return likedImages;
      } catch (error) {
        throw new Error('获取收藏列表失败');
      }
    },

    toggle: async (fileName: string, method: 'POST' | 'DELETE'): Promise<ApiResponse> => {
      const response = await apiRequest<ApiResponse>(`/api/likes/${fileNameUtils.encode(fileName)}`, { method })
      
      if (response.success) {
        cacheUtils.markLikedModification();
        api.likes.get().catch(console.error);
      }
      
      return response;
    },

    batch: async (fileNames: string[]): Promise<ApiResponse> => {
      const results = await Promise.allSettled(
        fileNames.map(fileName =>
          apiRequest<ApiResponse>(`/api/likes/${fileNameUtils.encode(fileName)}`, {
            method: 'POST'
          })
        )
      )

      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason)

      if (errors.length > 0) {
        return {
          success: false,
          error: '部分收藏失败',
          details: errors.map(e => e.message).join('; ')
        }
      }

      cacheUtils.markLikedModification(); 
      api.likes.get().catch(console.error)
      
      return { success: true }
    }
  },

  upload: async (formData: FormData): Promise<ImageUploadResponse> => {
    const files = formData.getAll('files') as File[]
    
    const newFormData = new FormData()
    files.forEach(file => {
      newFormData.append('files', file)
      newFormData.append(`encoded_${file.name}`, fileNameUtils.encode(file.name))
    })

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: newFormData
    })

    if (!response.ok) {
      throw new Error('上传失败')
    }

    const data = await response.json()
    
    if (data.success) {
      cacheUtils.markManagedModification();
      const images = await api.images.get();
      cacheUtils.clearManagedModification();
    }

    return data
  },

  auth: {
    logout: async (): Promise<void> => {
      await apiRequest('/api/auth', { method: 'DELETE' })
    }
  },

  cache: {
    markManagedModification: cacheUtils.markManagedModification,
    markLikedModification: cacheUtils.markLikedModification
  }
} 
