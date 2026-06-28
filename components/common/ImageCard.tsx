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

const COMPONENT_INFO = {
  id: 'mazine-core-imagecard-v1.0.0',
  name: 'ImageCard',
  author: 'waycaan',
  version: '1.0.0',
  license: 'MIT'
} as const;
import React from 'react'
import styles from '@/app/styles/shared.module.css'
import { formatDate, formatFileSize } from '@/utils/format'
import { copyToClipboard } from '@/utils/clipboard'
import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import { useI18n } from '@/i18n/context'
import { useLazyImageLoading } from '@/hooks/useLazyImageLoading'

function truncName(str: string, maxW = 24): string {
  if (!str) return str
  const w = (s: string) => { let v = 0; for (const c of s) v += /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/.test(c) ? 2 : 1; return v }
  if (w(str) <= maxW) return str
  const d = str.lastIndexOf('.')
  const ext = d > 0 ? str.slice(d) : ''
  const base = ext ? str.slice(0, str.length - ext.length) : str
  const extW = w(ext)
  const keep = maxW - extW - 3
  if (keep < 4) return str.slice(0, maxW - 3) + '...'
  let si = 0, sw = 0
  while (si < base.length && sw < Math.ceil(keep / 2)) { sw += /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/.test(base[si]) ? 2 : 1; si++ }
  let ei = base.length, ew = 0
  while (ei > si && ew < Math.floor(keep / 2)) { ew += /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/.test(base[ei - 1]) ? 2 : 1; ei-- }
  return base.slice(0, si) + '...' + base.slice(ei) + ext
}
interface ImageCardProps {
  fileName: string
  url: string
  previewUrl?: string
  markdown: string
  bbcode: string
  uploadTime: string
  size: number
  isLiked: boolean
  isSelectable?: boolean
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  onLike?: (e: React.MouseEvent) => Promise<void> | void
  dimensions?: {
    width: number
    height: number
  }
  isLoading?: boolean
  error?: Error
}
export function ImageCard({
  fileName,
  url,
  previewUrl,
  markdown,
  bbcode,
  uploadTime,
  size,
  isLiked,
  isSelectable,
  isSelected,
  onClick,
  onLike,
  dimensions,
  isLoading,
  error
}: ImageCardProps) {
  const { t } = useI18n()
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [fallbackToOriginal, setFallbackToOriginal] = useState(false)
  const primaryImageUrl = previewUrl && !previewError && !fallbackToOriginal ? previewUrl : url
  const {
    imgRef,
    isLoaded: imageLoaded,
    isLoading: imageLoading,
    error: imageError,
    forceLoad
  } = useLazyImageLoading(primaryImageUrl, {
    rootMargin: '300px', 
    threshold: 0.1,
    enablePreload: true
  })
  useEffect(() => {
    if (imageError && previewUrl && !fallbackToOriginal) {
      console.log(`🔄 预览图加载失败，回退到原图: ${fileName}`)
      setFallbackToOriginal(true)
      setPreviewError(true)
    }
  }, [imageError, previewUrl, fallbackToOriginal, fileName])
  const finalDimensions = dimensions
  const finalIsLoading = isLoading || imageLoading
  const finalError = error || imageError
  const handleCopy = async (e: React.MouseEvent, text: string, type: string) => {
    e.stopPropagation()
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    }
  }
  const handleCheckboxChange = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e)
    }
  }
  const handlePreviewError = () => {
    setPreviewError(true)
  }
  return (
    <div
      ref={imgRef}
      className={`${styles.imageCard}
        ${isLiked ? styles.liked : ''}
        ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.imagePreview}>
        {imageLoaded ? (
          <Image
            src={primaryImageUrl}
            alt={fileName}
            width={finalDimensions?.width || 400}
            height={finalDimensions?.height || 400}
            className={styles.image}
            onError={handlePreviewError}
            priority={false}
            loading="eager" 
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        ) : (
          <div
            className={`${styles.imagePlaceholder} ${
              imageLoading ? styles.loading : finalError ? styles.error : ''
            }`}
            style={{
              width: finalDimensions?.width || 400,
              height: finalDimensions?.height || 400,
              aspectRatio: finalDimensions ? `${finalDimensions.width}/${finalDimensions.height}` : '1'
            }}
            onClick={forceLoad} 
          >
            {imageLoading ? (
              <div className={styles.loadingSpinner}>
                <span>⏳</span>
                <small>加载中...</small>
              </div>
            ) : finalError ? (
              <div className={styles.placeholderContent}>
                <span>❌</span>
                <small>加载失败，点击重试</small>
              </div>
            ) : (
              <div className={styles.placeholderContent}>
                <span>📷</span>
                <small>{t('imageCard.clickToLoad')}</small>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.imageInfo}>
        <div className={styles.fileName} title={fileName}>{truncName(fileName)}</div>
        <div className={styles.detailsGroup}>
          <div className={styles.detailItem}>
            <span>
              {t('imageCard.size')}: {formatFileSize(size)}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span>
              {t('imageCard.uploadTime')}: {formatDate(uploadTime)}
            </span>
          </div>
          {finalDimensions && (
            <div className={styles.detailItem}>
              <span>
                {t('imageCard.dimensions')}: {finalDimensions.width} x {finalDimensions.height}
              </span>
            </div>
          )}
        </div>
        <div className={styles.buttonGroup}>
          <button
            onClick={(e) => handleCopy(e, markdown, 'MD')}
            className={`${styles.button} ${styles.buttonMarkdown}`}
          >
            {copiedType === 'MD' ? '✓' : 'MD'}
          </button>
          <button
            onClick={(e) => handleCopy(e, url, 'URL')}
            className={`${styles.button} ${styles.buttonUrl}`}
          >
            {copiedType === 'URL' ? '✓' : 'URL'}
          </button>
          <button
            onClick={(e) => handleCopy(e, bbcode, 'BB')}
            className={`${styles.button} ${styles.buttonBbcode}`}
          >
            {copiedType === 'BB' ? '✓' : 'BB'}
          </button>
        </div>
      </div>
    </div>
  )
}