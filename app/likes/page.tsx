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
  id: 'mazine-page-likes-v1.0.0',
  name: 'likesPage',
  author: 'waycaan',
  version: '1.0.0',
  license: 'MIT'
} as const;
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/styles/shared.module.css'
import { Header } from '@/components/common/Header'
import { ImageCard } from '@/components/common/ImageCard'
import { ImageModal } from '@/components/common/ImageModal'
import { SearchBar } from '@/components/common/SearchBar'
import { SelectionBar } from '@/components/common/SelectionBar'
import { useTheme } from '@/hooks/useTheme'
import { useSelection } from '@/hooks/useSelection'
import { useOptimizedImageIndex } from '@/hooks/useOptimizedImageIndex'
import { frontendJsonManager } from '@/utils/frontend-json-manager'

import type { ProcessedImageItem } from '@/types/image-index'
import { useI18n } from '@/i18n/context'
import { LogoutService } from '@/utils/logout-service'
type ViewMode = 'grid' | 'timeline'
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
      onPreview(image.url)
    } else {
      onSelect()
    }
  }
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
    />
  )
}
console.log(
  "%c Powered by Mazine - Copyright (C) 2024 waycaan ",
  "background: #3B82F6; color: white; padding: 5px; border-radius: 3px;"
);
export default function LikesPage() {
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
  useEffect(() => {
    if (index) {
      frontendJsonManager.setCurrentJson(index);
    } else {
      frontendJsonManager.clearCurrentJson();
    }
  }, [index]);
  const getLikedImages = () => {
    if (!index) return []
    let likedImages = index.images.filter(img => img.isLiked)
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      likedImages = likedImages.filter(image =>
        image.fileName.toLowerCase().includes(lowerSearchTerm)
      )
    }
    return likedImages
  }
  const likedImages = getLikedImages()
  const allLikedDisplayImages = likedImages.map(item => {
    const encodedFileName = encodeURIComponent(item.fileName)
    const encodedPreviewFileName = encodeURIComponent(`thumbs/${item.fileName.replace(/\.[^/.]+$/, '.webp')}`)
    const originalUrl = `${process.env.NEXT_PUBLIC_CDN}/${encodedFileName}`
    const previewUrl = `${process.env.NEXT_PUBLIC_CDN}/${encodedPreviewFileName}`
    return {
      ...item,
      url: originalUrl,
      previewUrl: previewUrl,
      markdown: `![${item.fileName}](${originalUrl})`,
      bbcode: `[img]${originalUrl}[/img]`
    }
  })
  const [loadedGroups, setLoadedGroups] = useState(0)
  useEffect(() => {
    if (allLikedDisplayImages.length === 0) return
    const initialGroups = Math.min(1, Math.ceil(allLikedDisplayImages.length / 10))
    setLoadedGroups(initialGroups)
  }, [allLikedDisplayImages.length])
  const handleLogout = () => LogoutService.logout()
  const unlikeSelected = async () => {
    if (!selectedImages.size) return;
    if (!confirm(t('likes.confirmUnlike', { count: selectedImages.size }))) return;
    const selectedArray = Array.from(selectedImages);
    const unlikeOperations = selectedArray.map(fileName => ({
      type: 'toggleLike' as const,
      fileName,
      data: { isLiked: false }
    }));
    updateIndexOptimistically(unlikeOperations);
    deselectAll();
    try {
      const res = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileNames: selectedArray, isLiked: false })
      });
      const result = await res.json();
      if (result.success) {
        prefetchIndex();
      } else {
        alert(`批量取消收藏失败: ${result.error}`);
        selectedArray.forEach(fileName => {
          updateIndexOptimistically({ type: 'toggleLike', fileName, data: { isLiked: true } });
        });
      }
    } catch (error: any) {
      alert(`批量取消收藏失败: ${error.message}`);
      selectedArray.forEach(fileName => {
        updateIndexOptimistically({ type: 'toggleLike', fileName, data: { isLiked: true } });
      });
    }
  };
  const openPreview = (url: string) => setPreviewImage(url)
  const closePreview = () => setPreviewImage(null)

  const groupImagesByDate = (images: ProcessedImageItem[]) => {
    const groups: { [date: string]: ProcessedImageItem[] } = {}
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
      }, {} as { [date: string]: ProcessedImageItem[] })
  }
  const groupedLikedImages = groupImagesByDate(allLikedDisplayImages)
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const isBottom = mainElement.scrollHeight - mainElement.scrollTop <= mainElement.clientHeight + 100;
        setShowFooter(isBottom);
      }
    };
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, []);
  return (
    <div className={`${styles.container} ${isDarkMode ? styles.containerDark : ''}`}>
      <Header
        currentPage="likes"
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />
      <main className={styles.main}>
        {indexLoading ? (
          <div className={styles.loading}>{t('likes.loading')}</div>
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
                onSelectAll={() => selectAll(allLikedDisplayImages.map(img => img.fileName))}
                onDeselectAll={deselectAll}
                onInvertSelection={() => invertSelection(allLikedDisplayImages.map(img => img.fileName))}
                onUnlikeSelected={unlikeSelected}
                showDeleteButton={false}
                showLikeButton={false}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
              <div className={styles.searchGroup}>
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onSearch={() => {}}
                  placeholder={t('likes.searchPlaceholder')}
                />
              </div>
            </div>
            {allLikedDisplayImages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>暂无收藏的图片</p>
              </div>
            ) : (
              <>
                {}
                {viewMode === 'grid' ? (
                  <div className={styles.imageGrid}>
                    {allLikedDisplayImages.map((image, index) => (
                      <ImageCardWithLoad
                        key={image.fileName}
                        image={image}
                        isSelectable={true}
                        isSelected={selectedImages.has(image.fileName)}
                        onSelect={() => toggleSelect(image.fileName)}
                        onPreview={openPreview}
                        shouldLoadPreview={index < loadedGroups * 10} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.timelineView}>
                    {Object.entries(groupedLikedImages).map(([date, images]) => (
                      <div key={date} className={styles.dateGroup}>
                        <h3 className={styles.dateTitle}>{date}</h3>
                        <div className={styles.imageGrid}>
                          {images.map((image, index) => (
                            <ImageCardWithLoad
                              key={image.fileName}
                              image={image}
                              isSelectable={true}
                              isSelected={selectedImages.has(image.fileName)}
                              onSelect={() => toggleSelect(image.fileName)}
                              onPreview={openPreview}
                              shouldLoadPreview={index < loadedGroups * 10}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {}
                <div className={styles.statsInfo}>
                  <p>
                    显示 {allLikedDisplayImages.length} 张收藏图片，已加载前 {loadedGroups * 10} 张预览图
                    {loadedGroups * 10 < allLikedDisplayImages.length && (
                      <button
                        onClick={() => setLoadedGroups(prev => prev + 1)}
                        style={{ marginLeft: '10px' }}
                      >
                        加载更多预览图
                      </button>
                    )}
                  </p>
                </div>
              </>
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
        <p>{t('likes.copyright', { year: new Date().getFullYear() })}{' '}
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