/**
 * Mazine - 美真图床
 * https://github.com/waycaan/mazine
 * 
 * @file Core Hook - Image Load
 * @description 图片加载状态管理钩子
 * @copyright (C) 2024 Mazine by waycaan
 * @license GNU GPL v3.0
 * @version 1.0.0
 * @author waycaan
 */

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

const HOOK_INFO = {
  id: 'mazine-hook-imageload-v1.0.0',
  name: 'useImageLoad',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import { useState, useEffect } from 'react'
import { getImageDimensions } from '@/utils/imageProcess'

interface ImageDimensions {
  width: number
  height: number
}

const dimensionsCache = new Map<string, ImageDimensions>()

export function useImageLoad(imageUrl: string | null) {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!imageUrl) {
      setDimensions(null)
      setError(null)
      return
    }

    if (dimensionsCache.has(imageUrl)) {
      setDimensions(dimensionsCache.get(imageUrl)!)
      return
    }

    setIsLoading(true)
    setError(null)

    getImageDimensions(imageUrl)
      .then(dims => {
        dimensionsCache.set(imageUrl, dims)
        setDimensions(dims)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err)
        setIsLoading(false)
      })
  }, [imageUrl])

  return {
    dimensions: dimensions || undefined,
    isLoading,
    error: error || undefined
  }
} 
