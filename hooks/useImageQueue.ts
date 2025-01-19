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
  id: 'mazine-hook-imagequeue-v1.0.0',
  name: 'useImageQueue',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import { useState, useEffect } from 'react'

const MAX_CONCURRENT_LOADS = 5

interface QueueItem {
  url: string
  resolve: (dimensions: { width: number; height: number }) => void
  reject: (error: Error) => void
}

const queue: QueueItem[] = []
let activeLoads = 0

const loadImage = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (activeLoads >= MAX_CONCURRENT_LOADS) {
      queue.push({ url, resolve, reject })
      return
    }

    activeLoads++
    const img = new Image()
    img.src = url

    img.onload = () => {
      activeLoads--
      resolve({ width: img.width, height: img.height })
      processQueue()
    }

    img.onerror = () => {
      activeLoads--
      reject(new Error('图片加载失败'))
      processQueue()
    }
  })
}

const processQueue = () => {
  if (queue.length === 0 || activeLoads >= MAX_CONCURRENT_LOADS) return

  const next = queue.shift()
  if (next) {
    loadImage(next.url)
      .then(next.resolve)
      .catch(next.reject)
  }
}

export const useImageQueue = (url: string) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    loadImage(url)
      .then(dims => {
        setDimensions(dims)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err)
        setIsLoading(false)
      })
  }, [url])

  return { dimensions, isLoading, error }
} 