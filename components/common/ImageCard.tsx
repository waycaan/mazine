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
import { useState, useEffect } from 'react'
import { useI18n } from '@/i18n/context'
import { useLazyImageLoading } from '@/hooks/useLazyImageLoading'
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
        <div className={styles.fileName}>{fileName}</div>
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