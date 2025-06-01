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
import { batchOperationManager } from '@/utils/batch-operation-manager'

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
    const isPageRefresh = (performance as any).navigation?.type === 1 ||
                         (performance.getEntriesByType('navigation')[0] as any)?.type === 'reload';
    if (isPageRefresh) {
      console.log('🔄 [Manage] 检测到页面刷新，清空UI状态');
      setSearchTerm('');
      setPreviewImage(null);
      setShowLiked(false);
      deselectAll();
      console.log('🚀 [Manage] 页面刷新清理完成，JSON获取由useOptimizedImageIndex处理');
    }
  }, [deselectAll]);
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
      const updatedJson = frontendJsonManager.calculateBatchLikeToggle(selectedArray, true);
      const result = await frontendJsonManager.sendJsonToServer(updatedJson, 'batch-like');
      if (result.success) {
        console.log(`📋 [Manage] 收藏成功，使用返回的最新JSON`);
        console.log(`   - 新的收藏总数: ${result.newJson.likedCount}`);
      } else {
        alert(`批量收藏失败: ${result.error}`);
        selectedArray.forEach(fileName => {
          updateIndexOptimistically({
            type: 'toggleLike',
            fileName,
            data: { isLiked: false }
          });
        });
      }
    } catch (error: any) {
      alert(`批量收藏失败: ${error.message}`);
      selectedArray.forEach(fileName => {
        updateIndexOptimistically({
          type: 'toggleLike',
          fileName,
          data: { isLiked: false }
        });
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
      const updatedJson = frontendJsonManager.calculateDeleteDecrement(selectedArray);
      const result = await frontendJsonManager.sendJsonToServer(updatedJson, 'delete');
      if (result.success) {
        const deleteResponse = await api.images.delete(selectedArray);
        if (!deleteResponse.success) {
          alert(`S3文件删除失败: ${deleteResponse.error}`);
          await refreshIndex();
        } else {
          console.log(`📋 [Manage] 删除成功，使用返回的最新JSON`);
          console.log(`   - 新的总数: ${result.newJson.totalCount}`);
        }
      } else {
        alert(`JSON删除失败: ${result.error}`);
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
            {}
            <div className={styles.statsInfo}>
              <p>显示 {allDisplayImages.length} 张图片</p>
              {}
              {index && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                  <p>🔍 调试信息:</p>
                  <p>JSON总数: {index.totalCount} | 数组长度: {index.images.length}</p>
                  <p>JSON收藏: {index.likedCount} | 实际收藏: {index.images.filter(img => img.isLiked).length}</p>
                  <p>最后更新: {new Date(index.lastUpdated).toLocaleTimeString()}</p>
                  <p>显示收藏: {showLiked ? '是' : '否'} | 搜索词: "{searchTerm}"</p>
                </div>
              )}
            </div>
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