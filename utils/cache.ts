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

import { ImageFile } from '@/types/image'interface CacheData {  version: string  data: {    images: ImageFile[]    likedFiles: string[]  }}const CACHE_CONFIG = {  version: '1.0.0',  key: 'mazine_images_cache'}export const imageCache = {  set(data: { images: ImageFile[], likedFiles: string[] }) {    if (typeof window === 'undefined') return    localStorage.setItem(CACHE_CONFIG.key, JSON.stringify({      version: CACHE_CONFIG.version,      data    }))  },  get(): { images: ImageFile[], likedFiles: string[] } | null {    if (typeof window === 'undefined') return null    if (localStorage.getItem('recent_modification')) {      this.clear()      return null    }    const cached = localStorage.getItem(CACHE_CONFIG.key)    if (!cached) return null    const cacheData = JSON.parse(cached) as CacheData    if (cacheData.version !== CACHE_CONFIG.version) {      this.clear()      return null    }    return cacheData.data  },  clear() {    if (typeof window === 'undefined') return    localStorage.removeItem(CACHE_CONFIG.key)  },  markModification() {    if (typeof window === 'undefined') return    localStorage.setItem('recent_modification', 'true')    this.clear()  }}