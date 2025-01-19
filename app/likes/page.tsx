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
  id: 'mazine-page-likes-v1.0.0',
  name: 'likesPage',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
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
import { useImageLoad } from '@/hooks/useImageLoad'
import { api, API_CONFIG } from '@/utils/api'
import { LikedImage } from '@/types/image'
import { useI18n } from '@/i18n/context'

// ===== Type Definitions =====
type ViewMode = 'grid' | 'timeline'

interface ScrollState {
  cursor: string | null;  // Use uploadTime of last image as cursor
  hasMore: boolean;
  loading: boolean;
}

interface LoadingState {
  initial: boolean;     // Initial loading state
  scroll: boolean;      // Scroll loading state
}

// ===== Component Definitions =====
/**
 * Image Card with Loading Component
 * @param props Component properties
 */
function ImageCardWithLoad({ image, isSelectable, isSelected, onSelect, onPreview }: {
  image: LikedImage
  isSelectable: boolean
  isSelected: boolean
  onSelect: () => void
  onPreview: (url: string) => void
}) {
  const { dimensions, isLoading, error } = useImageLoad(image.url)

  // Handle click events
  const handleClick = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    // If mouse event and Ctrl key is pressed, preview image
    if ('ctrlKey' in e && e.ctrlKey) {
      onPreview(image.url)
    } else {
      // Otherwise select image
      onSelect()
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

// Code watermark
console.log(
  "%c Powered by Mazine - Copyright (C) 2024 waycaan ",
  "background: #3B82F6; color: white; padding: 5px; border-radius: 3px;"
);

// ===== Main Page Component =====
export default function LikesPage() {
  const { t } = useI18n()

  // ----- State Management -----
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  const { selectedItems: selectedImages, toggleSelect, selectAll, deselectAll, invertSelection } = useSelection<string>()
  const [images, setImages] = useState<LikedImage[]>([])
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
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [showFooter, setShowFooter] = useState(false)

  // ----- Event Handlers -----
  const handleLogout = async () => {
    try {
      await api.auth.logout()
      router.push('/login')
    } catch (error) {
      alert(t('likes.logoutFailed'))
    }
  }

  const unlikeSelected = async () => {
    if (!selectedImages.size) return;
    if (!confirm(t('likes.confirmUnlike', { count: selectedImages.size }))) return;

    try {
      // 1. 乐观更新本地状态
      setImages(prev => prev.filter(img => !selectedImages.has(img.fileName)));

      // 2. 执行实际取消收藏
      await Promise.all(
        Array.from(selectedImages).map(fileName => 
          api.likes.toggle(fileName, 'DELETE')
        )
      );

      // 3. 标记缓存需要更新并在后台刷新
      api.cache.markLikedModification();
      api.likes.get();  // 更新收藏列表缓存
      fetchLikedImages();
      
      deselectAll();
    } catch (error) {
      console.error('批量取消收藏失败:', error);
      alert(t('likes.unlikeFailed'));
      fetchLikedImages();
    }
  };

  const openPreview = (url: string) => setPreviewImage(url)
  const closePreview = () => setPreviewImage(null)

  // ----- Side Effects -----
  useEffect(() => {
    fetchLikedImages()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !scrollState.loading && scrollState.hasMore) {
          fetchLikedImages(scrollState.cursor);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [scrollState.loading, scrollState.hasMore, scrollState.cursor])

  // ----- 辅助函数 -----
  const fetchLikedImages = async (cursor?: string | null) => {
    if (!scrollState.hasMore || scrollState.loading) return;
    
    if (cursor) {
      setLoadingState(prev => ({ ...prev, scroll: true }));
    } else {
      setLoadingState(prev => ({ ...prev, initial: true }));
    }

    try {
      const data = await api.likes.get(cursor);
      // 过滤掉预览图记录
      const filteredData = data.filter(img => !img.fileName.startsWith('thumbs/'));
      const sortedImages = filteredData.sort((a, b) => 
        new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
      );
      
      setImages(prev => {
        if (!cursor) return sortedImages;  // 首次加载直接使用
        const combined = [...prev, ...sortedImages];
        return Array.from(new Map(combined.map(img => [img.fileName, img])).values());
      });

      setScrollState({
        cursor: sortedImages[sortedImages.length - 1]?.uploadTime || null,
        hasMore: sortedImages.length === API_CONFIG.ITEMS_PER_PAGE,
        loading: false
      });

      setLoadingState({ initial: false, scroll: false });
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      alert('获取收藏列表失败');
      setLoadingState({ initial: false, scroll: false });
    }
  };

  // Group images by date for timeline view
  const groupImagesByDate = (images: LikedImage[]) => {
    const groups: { [date: string]: LikedImage[] } = {}

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
      }, {} as { [date: string]: LikedImage[] })
  }

  // Filter images based on search term
  const getFilteredImages = (images: LikedImage[]) => {
    return images.filter(image => 
      image.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredImages = getFilteredImages(images)

  // ----- Handle Scroll Events -----
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        // Check if scrolled to bottom
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

  // ----- Render Method -----
  return (
    <div className={`${styles.container} ${isDarkMode ? styles.containerDark : ''}`}>
      <Header 
        currentPage="likes"
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />

      <main className={styles.main}>
        {loadingState.initial ? (
          <div className={styles.loading}>{t('likes.loading')}</div>
        ) : (
          <div className={styles.previewArea}>
            <div className={styles.controlBar}>
              <SelectionBar
                selectedCount={selectedImages.size}
                onSelectAll={() => selectAll(images.map(img => img.fileName))}
                onDeselectAll={deselectAll}
                onInvertSelection={() => invertSelection(images.map(img => img.fileName))}
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
              </>
            ) : (
              <div className={styles.timelineView}>
                {Object.entries(groupImagesByDate(images)).map(([date, images]) => (
                  <div key={date} className={styles.dateGroup}>
                    <h2 className={styles.dateTitle}>{date}</h2>
                    <div className={styles.imageGrid}>
                      {images.map((image) => (
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

      {/* Preview Modal */}
      {previewImage && (
        <ImageModal
          imageUrl={previewImage}
          onClose={closePreview}
        />
      )}

      {/* Copyright Footer */}
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
