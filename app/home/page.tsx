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
  id: 'mazine-page-home-v1.0.0',
  name: 'HomePage',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import styles from '@/app/styles/shared.module.css'
import { Header } from '@/components/common/Header'
import { ImageModal } from '@/components/common/ImageModal'
import { useTheme } from '@/hooks/useTheme'
import { useCopy } from '@/hooks/useCopy'
import { useImageLoad } from '@/hooks/useImageLoad'
import { ImageFile } from '@/types/image'
import { 
  checkFileSize, 
  isImageFile, 
  createPreviewUrl, 
  revokePreviewUrl, 
  compressImage,
  FILE_SIZE_LIMITS,
  isOverSizeLimit,
  calculateTotalSize,
  generateUniqueFileName,
  convertToWebP,
  processFile
} from '@/utils/imageProcess'
import { createPreviewImage } from '@/components/utils/thumbs'
import { api, API_CONFIG } from '@/utils/api'
import { useI18n } from '@/i18n/context'

// Define upload file type
interface UploadedFile {
  fileName: string;
  originalName: string;
  url: string;
  markdown: string;
  bbcode: string;
  uploadTime: string;
  size: number;
  isLiked: boolean;
}

// Define upload error type
interface UploadError {
  fileName: string;
  error: string;
}

// Extract timeout as constant
const UPLOAD_TIMEOUT = 120000 // 2 minutes

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Code watermark
console.log(
  "%c Powered by Mazine - Copyright (C) 2024 waycaan ",
  "background: #3B82F6; color: white; padding: 5px; border-radius: 3px;"
);

// 修改 UploadStatus 类型定义
interface UploadStatus {
  stage: 'idle' | 'checking' | 'processing' | 'uploading' | 'complete';
  totalFiles: number;
  completedFiles: number;
  processType?: 'rename' | 'compress' | 'convert';
  processingDetails?: string;
  currentFile?: string;
  totalSteps: number;
  completedSteps: number;
  currentStep: string;
  errors: UploadError[];
}

// Simplify filename validation function
const isValidFileName = (fileName: string): boolean => {
  try {
    // 防止路径穿越
    if (fileName.includes('/') || fileName.includes('\\')) {
      return false;
    }
    
    // 检查长度限制
    const encoded = encodeURIComponent(fileName);
    return encoded.length <= 1024; // S3的限制
  } catch (error) {
    return false;
  }
};

// 添加文件名清理函数
const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/#/g, '-');
};

// Add total progress calculation function
const calculateTotalProgress = (status: UploadStatus): number => {
  const totalSteps = status.totalFiles * 3; // Each file has three steps: check, process, upload
  let completedSteps = 0;

  switch (status.stage) {
    case 'checking':
      // Progress in checking phase
      completedSteps = status.completedFiles * 3;
      break;
    case 'processing':
      // Progress in processing phase
      completedSteps = (status.completedFiles * 3) + 1;
      break;
    case 'uploading':
      // Progress in uploading phase
      completedSteps = (status.completedFiles * 3) + 2;
      break;
    case 'complete':
      completedSteps = totalSteps;
      break;
  }

  return (completedSteps / totalSteps) * 100;
};

export default function HomePage() {
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  const { t } = useI18n()

  // 上传相关状态
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [compress, setCompress] = useState(false)
  const [convertToWebP, setConvertToWebP] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 预览相关状态
  const [currentImages, setCurrentImages] = useState<UploadedFile[]>([])
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 添加收藏相关状态
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set())

  // 在状态部分添加错误列表状态
  const [uploadErrors, setUploadErrors] = useState<Array<{
    fileName: string;
    error: string;
  }>>([]);

  // 在组件中添加状态
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    stage: 'idle',
    totalFiles: 0,
    completedFiles: 0,
    totalSteps: 0,
    completedSteps: 0,
    currentStep: '',
    errors: []
  });

  // 添加新的状态
  const [maxImageSize, setMaxImageSize] = useState<number | null>(null);

  // 处理文件上传
  const handleUpload = async (files: File[] | FileList) => {
    if (files.length === 0) return;

    const fileArray = Array.from(files);

    // 检查文件数量限制
    if (fileArray.length > FILE_SIZE_LIMITS.MAX_FILES) {
      alert(`Maximum ${FILE_SIZE_LIMITS.MAX_FILES} files can be uploaded at once`);
      return;
    }

    // 重置状态
    setUploadErrors([]);
    setIsUploading(true);
    setUploadStatus({
      stage: 'checking',
      totalFiles: fileArray.length,
      completedFiles: 0,
      processingDetails: 'Checking files...',
      totalSteps: fileArray.length * 3, // 每个文件有三个步骤：检查、处理、上传
      completedSteps: 0,
      currentStep: '检查文件',
      errors: []
    });

    // 获取现有文件名列表用于查重
    const existingFileNames = currentImages.map(img => img.fileName);
    let processedFiles: File[] = [];
    let previewFiles: File[] = [];

    // 处理每个文件
    for (const file of fileArray) {
      // 清理文件名中的特殊字符
      const cleanFileName = sanitizeFileName(file.name);
      // 更新当前处理的文件名
      setUploadStatus((prev: UploadStatus) => ({
        ...prev,
        currentFile: file.name,
        processingDetails: 'Checking files...',
        currentStep: '检查文件'
      }));

      // 检查文件名是否合法
      if (!isValidFileName(file.name)) {
        setUploadErrors((prev: UploadError[]) => [...prev, {
          fileName: file.name,
          error: '文件名不合法（不能包含#符号、特殊字符或过长），请重新命名后上传'
        }]);
        continue; // 跳过这个文件的后续处理
      }

      // 生成唯一文件名
      const uniqueFileName = generateUniqueFileName(file.name, existingFileNames);
      if (uniqueFileName !== file.name) {
        setUploadStatus((prev: UploadStatus) => ({
          ...prev,
          processType: 'rename',
          processingDetails: `重命名文件: ${file.name} → ${uniqueFileName}`
        }));
      }

      try {
        let processedFile: File | null = null;

        // 检查文件大小是否超出限制
        if (isOverSizeLimit(file)) {
          // 如果用户手动选择了处理方式（压缩或转换webp）
          if (compress || convertToWebP) {
            setUploadStatus((prev: UploadStatus) => ({
              ...prev,
              stage: 'processing',
              processType: convertToWebP && compress ? 'convert' : (convertToWebP ? 'convert' : 'compress'),
              processingDetails: `正在${convertToWebP ? '转换' : ''}${convertToWebP && compress ? '并' : ''}${compress ? '压缩' : ''}: ${file.name}`,
              currentStep: '处理图片',
              completedSteps: prev.completedSteps + 1
            }));

            processedFile = await processFile(file, {
              forceWebP: convertToWebP,
              forceCompress: compress,
              fileName: uniqueFileName
            });
          } else {
            // 如果用户没有选择处理方式，进行渐进式自动优化
            // 1. 首先尝试转换为WebP
            setUploadStatus((prev: UploadStatus) => ({
              ...prev,
              stage: 'processing',
              processType: 'convert',
              processingDetails: `正在转换为WebP: ${file.name}`,
              currentStep: '转换格式',
              completedSteps: prev.completedSteps + 1
            }));

            processedFile = await processFile(file, {
              forceWebP: true,
              forceCompress: false,
              fileName: uniqueFileName
            });

            // 2. 如果转换为WebP后仍然超限，尝试压缩
            if (processedFile && isOverSizeLimit(processedFile)) {
              setUploadStatus((prev: UploadStatus) => ({
                ...prev,
                stage: 'processing',
                processType: 'compress',
                processingDetails: `WebP转换后仍超出限制，正在压缩: ${file.name}`,
                currentStep: '压缩图片',
                completedSteps: prev.completedSteps + 1
              }));

              processedFile = await processFile(processedFile, {
                forceWebP: false,
                forceCompress: true,
                fileName: uniqueFileName
              });
            }
          }
          
          // 如果所有处理后仍然超出限制，返回错误
          if (processedFile && isOverSizeLimit(processedFile)) {
            setUploadErrors((prev: UploadError[]) => [...prev, {
              fileName: file.name,
              error: '文件过大，即使优化后仍超出限制(4.4MB)'
            }]);
            continue;
          }
        } else if (convertToWebP || compress) {
          // 如果文件大小在限制内，且用户选择了处理方式
          setUploadStatus((prev: UploadStatus) => ({
            ...prev,
            stage: 'processing',
            processType: convertToWebP && compress ? 'convert' : (convertToWebP ? 'convert' : 'compress'),
            processingDetails: `正在${convertToWebP ? '转换' : ''}${convertToWebP && compress ? '并' : ''}${compress ? '压缩' : ''}: ${file.name}`,
            currentStep: '处理图片',
            completedSteps: prev.completedSteps + 1
          }));

          processedFile = await processFile(file, {
            forceWebP: convertToWebP,
            forceCompress: compress,
            fileName: uniqueFileName
          });
        } else {
          processedFile = file;
        }

        if (processedFile) {
          processedFiles.push(processedFile);
          // 生成预览图
          try {
            const previewFile = await createPreviewImage(processedFile, uniqueFileName);
            previewFiles.push(previewFile);
          } catch (previewError) {
            console.error('生成预览图失败:', previewError);
            setUploadErrors((prev: UploadError[]) => [...prev, {
              fileName: file.name,
              error: '生成预览图失败'
            }]);
            continue;
          }
        }
      } catch (error) {
        console.error(`处理文件失败: ${file.name}`, error);
        setUploadErrors((prev: UploadError[]) => [...prev, {
          fileName: file.name,
          error: error instanceof Error ? error.message : '未知错误'
        }]);
      }
    }

    // 开始上传阶段
    setUploadStatus((prev: UploadStatus) => ({
      ...prev,
      stage: 'uploading',
      processingDetails: '准备开始上传...',
      currentStep: '上传文件',
      completedSteps: prev.completedSteps + 1
    }));

    // 逐个上传处理后的文件
    const totalFiles = processedFiles.length;
    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i];
      try {
        setUploadStatus((prev: UploadStatus) => ({
          ...prev,
          currentFile: file.name,
          processingDetails: `正在上传: ${file.name} (${i + 1}/${totalFiles}张)`,
          currentStep: '上传文件',
          completedSteps: prev.completedSteps + 1
        }));

        const formData = new FormData();
        formData.append('files', file);
        formData.append('previews', previewFiles[i]); // 添加预览图
        formData.append(`format_${file.name}`, file.name.split('.').pop() || '');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (data.success) {
          // 1. 乐观更新UI
          const newFiles = data.files.filter((file: any) => !file.fileName.startsWith('thumbs/'))
          setCurrentImages(prev => [...newFiles, ...prev])
          
          // 2. 标记缓存需要更新
          api.cache.markManagedModification()
          
          setUploadStatus((prev: UploadStatus) => ({
            ...prev,
            completedFiles: prev.completedFiles + 1,
            completedSteps: prev.completedSteps + 1
          }));
        } else {
          setUploadErrors((prev: UploadError[]) => [...prev, {
            fileName: file.name,
            error: data.error || '上传失败'
          }])
        }
      } catch (error) {
        console.error('上传失败:', error)
        setUploadErrors((prev: UploadError[]) => [...prev, {
          fileName: file.name,
          error: '网络错误，请重试'
        }])
      }
    }

    // 完成所有上传
    setUploadStatus((prev: UploadStatus) => ({
      ...prev,
      stage: 'complete',
      processingDetails: `上传完成 (${totalFiles}/${totalFiles}张)`,
      completedSteps: prev.completedSteps + 1
    }));

    setTimeout(() => {
      setIsUploading(false);
      setUploadStatus({
        stage: 'idle',
        totalFiles: 0,
        completedFiles: 0,
        totalSteps: 0,
        completedSteps: 0,
        currentStep: '',
        errors: []
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500);
  };

  // 处理拖放
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files // 直接使用 FileList
    if (files.length > 0) await handleUpload(files)
  }

  // 复制到剪贴板
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedType(type)
        setTimeout(() => setCopiedType(null), 2000)
      })
  }

  // 获取图片列表 - home页面不需要获取所有图片
  const fetchImages = async () => {
    try {
      const data = await api.images.get()
      setCurrentImages(data)
    } catch (error) {
      console.error('获取图片列表失败:', error)
      alert('获取图片列表失败')
    }
  }

  // 处理收藏/取消收藏
  const handleLike = async (fileName: string) => {
    const currentImage = currentImages.find(img => img.fileName === fileName)
    const wasLiked = currentImage?.isLiked ?? false

    try {
      // 1. 乐观更新UI
      setCurrentImages(prev => prev.map(img => 
        img.fileName === fileName 
          ? { ...img, isLiked: !wasLiked }
          : img
      ))

      // 2. 执行实际操作
      const response = await api.likes.toggle(
        fileName, 
        wasLiked ? 'DELETE' : 'POST'
      )

      if (!response.success) {
        // 如果失败，回滚到原始状态
        setCurrentImages(prev => prev.map(img => 
          img.fileName === fileName 
            ? { ...img, isLiked: wasLiked }
            : img
        ))
        alert(response.error || '收藏操作失败')
        return
      }

      // 3. 标记缓存需要更新并在后台刷新
      api.cache.markLikedModification();
      api.likes.get();  // 更新收藏列表缓存
    } catch (error) {
      // 发生错误时回滚到原始状态
      setCurrentImages(prev => prev.map(img => 
        img.fileName === fileName 
          ? { ...img, isLiked: wasLiked }
          : img
      ))
      alert('收藏操作失败')
    }
  }

  // ----- 事件处理 -----
  const handleLogout = async () => {
    try {
      await api.auth.logout()
      router.push('/login')
    } catch (error) {
      alert('登出失败')
    }
  }

  const [showFooter, setShowFooter] = useState(false);

  // 处理滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        // 检查是否滚动到底部
        const isBottom = mainElement.scrollHeight - mainElement.scrollTop <= mainElement.clientHeight + 100; // 提前100px显示
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
        currentPage="home"
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />

      <main className={styles.main}>
        <div className={styles.uploadArea}>
          <div className={styles.uploadOptions}>
            <label className={styles.uploadOptionLabel}>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${compress ? styles.checked : ''}`}
                onClick={() => setCompress(!compress)}
                aria-label={t('home.options.compress')}
              />
              {t('home.options.compress')}
            </label>
            <label className={styles.uploadOptionLabel}>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${convertToWebP ? styles.checked : ''}`}
                onClick={() => setConvertToWebP(!convertToWebP)}
                aria-label={t('home.options.webp')}
              />
              {t('home.options.webp')}
            </label>
          </div>
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => e.target.files && handleUpload(e.target.files)}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
            />
            {isUploading ? (
              <div className={styles.uploadingState}>
                <p className={`${styles.statusText} ${uploadStatus.stage === 'complete' ? styles.complete : ''}`}>
                  {uploadStatus.stage !== 'complete' && (
                    <span className={styles.loadingSpinner} />
                  )}
                  {uploadStatus.stage === 'checking' && t('home.upload.checking')}
                  {uploadStatus.stage === 'processing' && (
                    uploadStatus.processType === 'rename' ? t('home.upload.rename') :
                    uploadStatus.processType === 'compress' ? t('home.upload.compress') :
                    uploadStatus.processType === 'convert' ? t('home.upload.convert') : t('home.upload.processing')
                  )}
                  {uploadStatus.stage === 'uploading' && t('home.upload.uploading')}
                  {uploadStatus.stage === 'complete' && t('home.upload.complete')}
                </p>

                {uploadStatus.currentFile && (
                  <p className={styles.fileName}>
                    {uploadStatus.currentFile}
                  </p>
                )}

                {uploadStatus.stage === 'uploading' && (
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressBarTotal}
                      style={{ 
                        width: `${(uploadStatus.completedFiles / uploadStatus.totalFiles) * 100}%` 
                      }}
                    />
                    <div 
                      className={styles.progressBarCurrent}
                      style={{ 
                        width: '100%'
                      }}
                    />
                  </div>
                )}

                <p className={styles.progressText}>
                  {uploadStatus.stage !== 'complete' && 
                    `${uploadStatus.completedFiles}/${uploadStatus.totalFiles}`
                  }
                </p>
              </div>
            ) : (
              <>
                <div className={styles.uploadIcon} />
                <p className={styles.uploadText}>{t('home.dropzone.title')}</p>
              </>
            )}
          </div>
        </div>

        {currentImages.length > 0 && (
          <div className={styles.currentImagesGrid}>
            {currentImages.map((image, index) => (
              <div key={image.fileName} className={`${styles.imageCard} ${image.isLiked ? styles.liked : ''}`}>
                <div 
                  className={styles.imagePreview}
                  onClick={() => setPreviewImage(image.url)}
                >
                  <img src={image.url} alt={image.originalName} />
                </div>

                <div className={styles.imageInfo}>
                  <div className={styles.fileName}>{image.originalName}</div>
                  <div className={styles.detailsGroup}>
                    <div className={styles.detailItem}>
                      <span>{formatFileSize(image.size)}</span>
                      <span>{formatDate(image.uploadTime)}</span>
                    </div>
                  </div>
                  <div className={styles.urlGroup}>
                    {[
                      { value: image.url, label: 'URL', className: styles.buttonUrl },
                      { value: image.markdown, label: 'MD', className: styles.buttonMarkdown },
                      { value: image.bbcode, label: 'BB', className: styles.buttonBbcode }
                    ].map(({ label, value, className }) => (
                      <div key={label} className={styles.urlItem}>
                        <input
                          type="text"
                          value={value}
                          readOnly
                          className={styles.urlInput}
                        />
                        <button
                          onClick={() => copyToClipboard(value, label)}
                          className={`${styles.button} ${className}`}
                        >
                          {copiedType === label ? '✓' : label}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className={`${styles.prelikebutton} ${image.isLiked ? styles.greenButton : ''}`}
                    onClick={() => handleLike(image.fileName)}
                  >
                    {image.isLiked ? t('manage.actions.unlike') : t('manage.actions.like')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {previewImage && (
        <div className={styles.modal} onClick={() => setPreviewImage(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt={t('imageModal.preview')} />
            <button 
              className={styles.modalClose}
              onClick={() => setPreviewImage(null)}
              aria-label={t('imageModal.close')}
            >
              ×
            </button>
          </div>
        </div>
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

      {/* 在上传区域和预览区域之间添加错误列表 */}
      {uploadErrors.length > 0 && (
        <div className={styles.errorList}>
          <h3 className={styles.errorTitle}>{t('home.upload.errors.title')}</h3>
          <ul className={styles.errorItems}>
            {uploadErrors.map((error, index) => (
              <li key={index} className={styles.errorItem}>
                <span className={styles.errorFileName}>{error.fileName}</span>
                <span className={styles.errorMessage}>{error.error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
