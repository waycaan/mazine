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

import { useEffect, useRef, useState, useCallback } from 'react'
interface LazyImageState {
  isLoaded: boolean
  isLoading: boolean
  error: boolean
}
interface UseLazyImageLoadingOptions {
  rootMargin?: string 
  threshold?: number  
  enablePreload?: boolean 
}
export function useLazyImageLoading(
  imageUrl: string,
  options: UseLazyImageLoadingOptions = {}
) {
  const {
    rootMargin = '200px',
    threshold = 0.1,
    enablePreload = true
  } = options
  const [state, setState] = useState<LazyImageState>({
    isLoaded: false,
    isLoading: false,
    error: false
  })
  const imgRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadImage = useCallback(() => {
    if (state.isLoaded || state.isLoading) return
    setState(prev => ({ ...prev, isLoading: true, error: false }))
    const img = new Image()
    const timeout = setTimeout(() => {
      setState({
        isLoaded: false,
        isLoading: false,
        error: true
      })
    }, 10000) 
    img.onload = () => {
      clearTimeout(timeout)
      setState({
        isLoaded: true,
        isLoading: false,
        error: false
      })
    }
    img.onerror = () => {
      clearTimeout(timeout)
      setState({
        isLoaded: false,
        isLoading: false,
        error: true
      })
    }
    img.src = imageUrl
  }, [imageUrl, state.isLoaded, state.isLoading])
  useEffect(() => {
    if (!imgRef.current || !enablePreload) {
      if (!enablePreload) {
        loadImage()
      }
      return
    }
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage()
            if (observerRef.current) {
              observerRef.current.unobserve(entry.target)
            }
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )
    observerRef.current.observe(imgRef.current)
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadImage, rootMargin, threshold, enablePreload])
  const forceLoad = useCallback(() => {
    setState({
      isLoaded: false,
      isLoading: false,
      error: false
    })
    setTimeout(() => {
      loadImage()
    }, 100)
  }, [loadImage])
  return {
    imgRef,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    forceLoad
  }
}
export function useBatchImageLoading() {
  const [loadedCount, setLoadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())
  const registerImage = useCallback((imageId: string) => {
    setTotalCount(prev => prev + 1)
  }, [])
  const markImageLoaded = useCallback((imageId: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
    setLoadedCount(prev => prev + 1)
  }, [])
  const markImageLoading = useCallback((imageId: string) => {
    setLoadingImages(prev => new Set([...Array.from(prev), imageId]))
  }, [])
  const getLoadingProgress = useCallback(() => {
    if (totalCount === 0) return 0
    return Math.round((loadedCount / totalCount) * 100)
  }, [loadedCount, totalCount])
  return {
    loadedCount,
    totalCount,
    loadingImages,
    registerImage,
    markImageLoaded,
    markImageLoading,
    getLoadingProgress,
    isAllLoaded: loadedCount === totalCount && totalCount > 0
  }
}