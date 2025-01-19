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

import { ImageFile } from '@/types/image'

interface CacheData {
  version: string
  data: {
    images: ImageFile[]
    likedFiles: string[]
  }
}

const CACHE_CONFIG = {
  version: '1.0.0',
  key: 'mazine_images_cache'
}

export const imageCache = {
  set(data: { images: ImageFile[], likedFiles: string[] }) {
    if (typeof window === 'undefined') return
    localStorage.setItem(CACHE_CONFIG.key, JSON.stringify({
      version: CACHE_CONFIG.version,
      data
    }))
  },

  get(): { images: ImageFile[], likedFiles: string[] } | null {
    if (typeof window === 'undefined') return null
    
    if (localStorage.getItem('recent_modification')) {
      this.clear()
      return null
    }

    const cached = localStorage.getItem(CACHE_CONFIG.key)
    if (!cached) return null

    const cacheData = JSON.parse(cached) as CacheData
    
    if (cacheData.version !== CACHE_CONFIG.version) {
      this.clear()
      return null
    }

    return cacheData.data
  },

  clear() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(CACHE_CONFIG.key)
  },

  markModification() {
    if (typeof window === 'undefined') return
    localStorage.setItem('recent_modification', 'true')
    this.clear()
  }
} 