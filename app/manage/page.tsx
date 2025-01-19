'use client'

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

const PAGE_INFO = {
  id: 'mazine-page-manage-v1.0.0',
  name: 'ManagePage',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import styles from '@/app/styles/shared.module.css'
import { useTheme } from '@/hooks/useTheme'
import { useSelection } from '@/hooks/useSelection'
import { useImageLoad } from '@/hooks/useImageLoad'
import { ImageCard } from '@/components/common/ImageCard'
import { Header } from '@/components/common/Header'
import { ImageModal } from '@/components/common/ImageModal'
import { SearchBar } from '@/components/common/SearchBar'
import { SelectionBar } from '@/components/common/SelectionBar'
import { api, API_CONFIG } from '@/utils/api'
import type { ManagedImage, ImageDimensions } from '@/types/image'
import { useI18n } from '@/i18n/context'

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

/**
 * 图片卡片加载组件
 * @param props 组件属性
 */
function ImageCardWithLoad({ 
  image, 
  isSelectable, 
  isSelected, 
  onSelect, 
  onPreview 
}: {
  image: ManagedImage
  isSelectable: boolean
  isSelected: boolean
  onSelect: () => void
  onPreview: (url: string) => void
}) {
  const { dimensions, isLoading, error } = useImageLoad(image.url)

  const handleClick = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    if ('ctrlKey' in e && e.ctrlKey) {
      e.preventDefault();
      onPreview(image.url);
    } else {
      onSelect();
    }
  }

  return (
    <ImageCard
      fileName={image.fileName}
      originalName={image.originalName}
      url={image.url}
      previewUrl={image.previewUrl}
      markdown={image.markdown}
      bbcode={image.bbcode}
      uploadTime={image.uploadTime}
      size={image.size}
      isLiked={image.isLiked}
      isSelectable={isSelectable}
      isSelected={isSelected}
      onClick={handleClick}
      dimensions={dimensions}
      isLoading={isLoading}
      error={error}
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
  const [images, setImages] = useState<ManagedImage[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    initial: true,
    scroll: false
  })
  const [scrollState, setScrollState] = useState<ScrollState>({
    cursor: null,
    hasMore: true,
    loading: false
  })
  const [showFooter, setShowFooter] = useState(false)
  const [showLiked, setShowLiked] = useState(false)
  
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    try {
      await api.auth.logout()
      router.push('/login')
    } catch (error) {
      alert('登出失败')
    }
  }

  const likeSelected = async () => {
    if (!selectedImages.size) return;
    if (!confirm(t('manage.confirmLike', { count: selectedImages.size }))) return;

    try {
      setImages(prev => prev.map(img => 
        selectedImages.has(img.fileName) 
          ? { ...img, isLiked: true } 
          : img
      ));

      await api.likes.batch(Array.from(selectedImages));

      api.cache.markLikedModification();
      fetchImages();
      deselectAll();
    } catch (error) {
      console.error('批量收藏失败:', error);
      alert(t('manage.likeFailed'));
      fetchImages();
    }
  };

  const deleteSelected = async () => {
    if (!selectedImages.size) return;
    if (!confirm(t('manage.confirmDelete', { count: selectedImages.size }))) return;

    try {
      setImages(prev => prev.filter(img => !selectedImages.has(img.fileName)));

      await api.images.delete(Array.from(selectedImages));

      api.cache.markManagedModification();
      api.cache.markLikedModification();
      
      fetchImages();
      api.likes.get();
      
      deselectAll();
    } catch (error) {
      console.error('批量删除失败:', error);
      alert(t('manage.deleteFailed'));
      fetchImages();
    }
  };

  const openPreview = (url: string) => setPreviewImage(url)
  const closePreview = () => setPreviewImage(null)

  const fetchImages = async (cursor?: string | null) => {
    if (!scrollState.hasMore || scrollState.loading) return;
     
    if (cursor) {
      setLoadingState(prev => ({ ...prev, scroll: true }));
      setScrollState(prev => ({ ...prev, loading: true }));
    } else {
      setLoadingState(prev => ({ ...prev, initial: true }));
    }

    try {
      const [data, likedImages] = await Promise.all([
        api.images.get(cursor),
        api.likes.get()
      ]);

      const filteredData = data.filter(img => !img.fileName.startsWith('thumbs/'));
      
      const likedFileNames = likedImages.map(img => img.fileName);
      const newImages = filteredData.map(img => ({
        ...img,
        isLiked: likedFileNames.includes(img.fileName)
      })).sort((a, b) => 
        new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
      );
      
      setImages(prev => {
        if (!cursor) return newImages;
        const combined = [...prev, ...newImages];
        return Array.from(new Map(combined.map(img => [img.fileName, img])).values())
          .sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
      });

      setScrollState({
        cursor: newImages[newImages.length - 1]?.uploadTime || null,
        hasMore: newImages.length === API_CONFIG.ITEMS_PER_PAGE,
        loading: false
      });

      setLoadingState({ initial: false, scroll: false });

    } catch (error) {
      console.error('获取图片列表失败:', error);
      setScrollState(prev => ({ ...prev, loading: false }));
      setLoadingState({ initial: false, scroll: false });
    }
  };

  const groupImagesByDate = (images: ManagedImage[]) => {
    const groups: { [date: string]: ManagedImage[] } = {}

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

    Object.values(groups).forEach(group => {
      group.sort((a, b) => 
        new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
      )
    })

    return Object.entries(groups)
      .sort(([dateA], [dateB]) => 
        new Date(dateB).getTime() - new Date(dateA).getTime()
      )
      .reduce((acc, [date, images]) => {
        acc[date] = images
        return acc
      }, {} as { [date: string]: ManagedImage[] })
  }

  const getFilteredImages = (images: ManagedImage[]) => {
    const nonThumbnailImages = images.filter(image => !image.fileName.startsWith('thumbs/'));
    
    const searchFiltered = nonThumbnailImages.filter(image => {
      const matchesSearch = image.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.originalName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    const result = !showLiked 
      ? searchFiltered.filter(img => !img.isLiked)
      : searchFiltered;

    return result.sort((a, b) => 
      new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
    );
  };

  const filteredImages = getFilteredImages(images)

  useEffect(() => {
    fetchImages()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !scrollState.loading && scrollState.hasMore) {
          fetchImages(scrollState.cursor);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [scrollState.loading, scrollState.hasMore, scrollState.cursor]);

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.containerDark : ''}`}>
      <Header 
        currentPage="manage"
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />

      {/* 主内容区 */}
      <main className={styles.main}>
        {loadingState.initial ? (
          <div className={styles.loading}>{t('common.loading')}</div>
        ) : (
          <div className={styles.previewArea}>
            <div className={styles.controlBar}>
              <SelectionBar
                selectedCount={selectedImages.size}
                onSelectAll={() => selectAll(images.map((img: ManagedImage) => img.fileName))}
                onDeselectAll={deselectAll}
                onInvertSelection={() => invertSelection(images.map((img: ManagedImage) => img.fileName))}
                onDeleteSelected={deleteSelected}
                onLikeSelected={likeSelected}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showLiked={showLiked}
                onShowLikedChange={setShowLiked}
              />
              
              <div className={styles.searchGroup}>
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onSearch={() => {/* 如果需要立即搜索的话 */}}
                />
              </div>
            </div>

            {/* 图片网格 */}
            {viewMode === 'grid' ? (
              <>
                <div className={styles.imageGrid}>
                  {filteredImages.map((image) => (
                    <ImageCardWithLoad
                      key={image.fileName}
                      image={image}
                      isSelectable={true}
                      isSelected={selectedImages.has(image.fileName)}
                      onSelect={() => toggleSelect(image.fileName)}
                      onPreview={openPreview}
                    />
                  ))}
                </div>
                
                {/* 添加加载触发器 */}
                <div 
                  ref={loadMoreRef}
                  className={styles.loadMoreTrigger}
                  style={{ height: '20px', margin: '20px 0' }}
                >
                  {loadingState.scroll && <div className={styles.loading}>{t('common.loading')}</div>}
                </div>
              </>
            ) : (
              <div className={styles.timelineView}>
                {Object.entries(groupImagesByDate(filteredImages)).map(([date, images]) => (
                  <div key={date} className={styles.dateGroup}>
                    <h2 className={styles.dateTitle}>{date}</h2>
                    <div className={styles.imageGrid}>
                      {images.map((image: ManagedImage) => (
                        <ImageCardWithLoad
                          key={image.fileName}
                          image={image}
                          isSelectable={true}
                          isSelected={selectedImages.has(image.fileName)}
                          onSelect={() => toggleSelect(image.fileName)}
                          onPreview={openPreview}
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

      {/* 预览模态框 */}
      {previewImage && (
        <ImageModal
          imageUrl={previewImage}
          onClose={closePreview}
        />
      )}

      {/* Copyright Footer */}
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

