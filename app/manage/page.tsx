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

'use client'
const PAGE_INFO = {
  id: 'mazine-page-manage-v1.0.0',
  name: 'ManagePage',
  author: 'waycaan',
  version: '1.0.0',
  license: 'MIT'
} as const;
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import styles from '@/app/styles/shared.module.css'
import { useTheme } from '@/hooks/useTheme'
import { useSelection } from '@/hooks/useSelection'
import { useOptimizedImageIndex } from '@/hooks/useOptimizedImageIndex'
import { frontendJsonManager } from '@/utils/frontend-json-manager'
import { ImageCard } from '@/components/common/ImageCard'
import { Header } from '@/components/common/Header'
import { ImageModal } from '@/components/common/ImageModal'
import { SearchBar } from '@/components/common/SearchBar'
import { SelectionBar } from '@/components/common/SelectionBar'
import { api, API_CONFIG } from '@/utils/api'
import type { ManagedImage, ImageDimensions } from '@/types/image'
import type { ProcessedImageItem } from '@/types/image-index'
import { useI18n } from '@/i18n/context'
import { LogoutService } from '@/utils/logout-service'
type ViewMode = 'grid' | 'timeline'
interface ScrollState {
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
}
interface LoadingState {
  initial: boolean;
  scroll: boolean;
}
function ImageCardWithLoad({
  image,
  isSelectable,
  isSelected,
  onSelect,
  onPreview,
  shouldLoadPreview = true
}: {
  image: ProcessedImageItem
  isSelectable: boolean
  isSelected: boolean
  onSelect: () => void
  onPreview: (url: string) => void
  shouldLoadPreview?: boolean
}) {
  const handleClick = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    if ('ctrlKey' in e && e.ctrlKey) {
      e.preventDefault();
      onPreview(image.url);
    } else {
      onSelect();
    }
  }
  const imageDimensions = (image.width && image.height) ? {
    width: image.width,
    height: image.height
  } : undefined;
  return (
    <ImageCard
      fileName={image.fileName}
      url={image.url}
      previewUrl={shouldLoadPreview ? image.previewUrl : image.url} 
      markdown={image.markdown}
      bbcode={image.bbcode}
      uploadTime={image.uploadTime}
      size={image.size}
      isLiked={image.isLiked}
      isSelectable={isSelectable}
      isSelected={isSelected}
      onClick={handleClick}
      dimensions={imageDimensions} 
    />
  )
}
console.log(
  "%c Powered by Mazine - Copyright (C) 2024 waycaan ",
  "background: #3B82F6; color: white; padding: 5px; border-radius: 3px;"
);
export default function ManagePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  const { selectedItems: selectedImages, toggleSelect, selectAll, deselectAll, invertSelection } = useSelection<string>()
  const {
    index,
    isLoading: indexLoading,
    error: indexError,
    refreshIndex,
    prefetchIndex,
    updateIndexOptimistically,
    invalidateCache,
    updateMetadataSilently
  } = useOptimizedImageIndex()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showFooter, setShowFooter] = useState(false)
  const [showLiked, setShowLiked] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    if (index) {
      frontendJsonManager.setCurrentJson(index);
    } else {
      frontendJsonManager.clearCurrentJson();
    }
  }, [index]);
  const getFilteredImages = () => {
    if (!index) return []
    let filteredImages = index.images
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filteredImages = filteredImages.filter(image =>
        image.fileName.toLowerCase().includes(lowerSearchTerm)
      )
    }
    if (!showLiked) {
      filteredImages = filteredImages.filter(img => !img.isLiked)
    }
    return filteredImages
  }
  const filteredImages = getFilteredImages()
  const sortedImages = [...filteredImages].sort((a, b) => {
    const timeA = new Date(a.uploadTime).getTime()
    const timeB = new Date(b.uploadTime).getTime()
    return timeB - timeA 
  })
  const allDisplayImages = sortedImages.map(item => {
    const baseFileName = item.fileName.replace(/\.[^/.]+$/, '') 
    const encodedFileName = encodeURIComponent(item.fileName)
    const encodedPreviewFileName = encodeURIComponent(`thumbs/${baseFileName}.webp`)
    const previewUrl = `${process.env.NEXT_PUBLIC_CDN}/${encodedPreviewFileName}`
    const originalUrl = `${process.env.NEXT_PUBLIC_CDN}/${encodedFileName}`
    return {
      ...item,
      url: originalUrl,
      previewUrl: previewUrl,
      markdown: `![${item.fileName}](${originalUrl})`,
      bbcode: `[img]${originalUrl}[/img]`
    }
  })
  const groupImagesByDate = (images: typeof allDisplayImages) => {
    const groups: { [date: string]: typeof allDisplayImages } = {}
    images.forEach(image => {
      const date = new Date(image.uploadTime).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(image)
    })
    return Object.entries(groups)
      .sort(([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime()
      )
      .reduce((acc, [date, images]) => {
        acc[date] = images
        return acc
      }, {} as { [date: string]: typeof allDisplayImages })
  }
  const groupedImages = groupImagesByDate(allDisplayImages)
  const handleLogout = () => LogoutService.logout()
  const likeSelected = async () => {
    if (!selectedImages.size) return;
    if (!confirm(t('manage.confirmLike', { count: selectedImages.size }))) return;
    const selectedArray = Array.from(selectedImages);
    const likeOperations = selectedArray.map(fileName => ({
      type: 'toggleLike' as const,
      fileName,
      data: { isLiked: true }
    }));
    updateIndexOptimistically(likeOperations);
    deselectAll();
    try {
      const res = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileNames: selectedArray, isLiked: true })
      });
      const result = await res.json();
      if (result.success) {
        prefetchIndex();
      } else {
        alert(`批量收藏失败: ${result.error}`);
        selectedArray.forEach(fileName => {
          updateIndexOptimistically({ type: 'toggleLike', fileName, data: { isLiked: false } });
        });
      }
    } catch (error: any) {
      alert(`批量收藏失败: ${error.message}`);
      selectedArray.forEach(fileName => {
        updateIndexOptimistically({ type: 'toggleLike', fileName, data: { isLiked: false } });
      });
    }
  };
  const deleteSelected = async () => {
    if (!selectedImages.size) return;
    if (!confirm(t('manage.confirmDelete', { count: selectedImages.size }))) return;
    const selectedArray = Array.from(selectedImages);
    const removeOperations = selectedArray.map(fileName => ({
      type: 'remove' as const,
      fileName,
      data: {}
    }));
    updateIndexOptimistically(removeOperations);
    deselectAll();
    try {
      const res = await fetch('/api/images/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileNames: selectedArray })
      });
      const result = await res.json();
      if (result.success) {
        prefetchIndex();
      } else {
        alert(`删除失败: ${result.error}`);
        await refreshIndex();
      }
    } catch (error: any) {
      alert(`删除操作失败: ${error.message}`);
      await refreshIndex();
    }
  };
  const openPreview = (url: string) => setPreviewImage(url)
  const closePreview = () => setPreviewImage(null)

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.containerDark : ''}`}>
      <Header
        currentPage="manage"
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />
      {}
      <main className={styles.main}>
        {indexLoading ? (
          <div className={styles.loading}>{t('common.loading')}</div>
        ) : indexError ? (
          <div className={styles.error}>
            <p>加载失败: {indexError}</p>
            <button onClick={refreshIndex}>重试</button>
          </div>
        ) : (
          <div className={styles.previewArea}>
            <div className={styles.controlBar}>
              <SelectionBar
                selectedCount={selectedImages.size}
                totalImages={index?.images.length || 0}
                totalLikes={index?.likedCount || 0}
                onSelectAll={() => selectAll(filteredImages.map(img => img.fileName))}
                onDeselectAll={deselectAll}
                onInvertSelection={() => invertSelection(filteredImages.map(img => img.fileName))}
                onDeleteSelected={deleteSelected}
                onLikeSelected={likeSelected}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showLiked={showLiked}
                onShowLikedChange={setShowLiked}
              />
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearch={() => {}}
              />
            </div>
            {}
            {viewMode === 'grid' ? (
              <div className={styles.imageGrid}>
                {allDisplayImages.map((image) => (
                  <ImageCardWithLoad
                    key={image.fileName}
                    image={image}
                    isSelectable={true}
                    isSelected={selectedImages.has(image.fileName)}
                    onSelect={() => toggleSelect(image.fileName)}
                    onPreview={openPreview}
                    shouldLoadPreview={true} 
                  />
                ))}
              </div>
            ) : (
              <div className={styles.timelineView}>
                {Object.entries(groupedImages).map(([date, images]) => (
                  <div key={date} className={styles.dateGroup}>
                    <h3 className={styles.dateTitle}>{date}</h3>
                    <div className={styles.imageGrid}>
                      {images.map((image) => (
                        <ImageCardWithLoad
                          key={image.fileName}
                          image={image}
                          isSelectable={true}
                          isSelected={selectedImages.has(image.fileName)}
                          onSelect={() => toggleSelect(image.fileName)}
                          onPreview={openPreview}
                          shouldLoadPreview={true}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {}
      {previewImage && (
        <ImageModal
          imageUrl={previewImage}
          onClose={closePreview}
        />
      )}
      {}
      <footer className={`${styles.footer} ${showFooter ? styles.visible : ''}`}>
        <p>© {new Date().getFullYear()} Mazine by{' '}
          <a
            href="https://github.com/waycaan/mazine"
            target="_blank"
            rel="noopener noreferrer"
          >
            waycaan
          </a>
        </p>
      </footer>
    </div>
  )
}