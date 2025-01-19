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
  license: 'Apache-2.0'
} as const;

import React from 'react'
import styles from '@/app/styles/shared.module.css'
import { formatDate, formatFileSize } from '@/utils/format'
import { copyToClipboard } from '@/utils/clipboard'
import Image from 'next/image'
import { useState } from 'react'
import { useImageQueue } from '@/hooks/useImageQueue'
import { useI18n } from '@/i18n/context'

interface ImageCardProps {
  fileName: string
  originalName: string
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
  originalName,
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
  const { dimensions: imageDimensions, isLoading: imageIsLoading, error: imageError } = useImageQueue(url)

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
      className={`${styles.imageCard} 
        ${isLiked ? styles.liked : ''} 
        ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.imagePreview}>
        <Image
          src={previewUrl && !previewError ? previewUrl : url}
          alt={originalName}
          width={imageDimensions?.width || 400}
          height={imageDimensions?.height || 400}
          className={styles.image}
          onError={handlePreviewError}
        />
      </div>

      <div className={styles.imageInfo}>
        <div className={styles.fileName}>{originalName}</div>
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
          {imageDimensions && (
            <div className={styles.detailItem}>
              <span>
                {t('imageCard.dimensions')}: {imageDimensions.width} x {imageDimensions.height}
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
