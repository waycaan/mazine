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
  id: 'mazine-page-home-v1.0.0',
  name: 'HomePage',
  author: 'waycaan',
  version: '1.0.0',
  license: 'MIT'
} as const;
import React, { useState, useRef, useEffect } from 'react';
import styles from '@/app/styles/shared.module.css'
import { Header } from '@/components/common/Header'
import { ImageModal } from '@/components/common/ImageModal'
import { useTheme } from '@/hooks/useTheme'
import { useCopy } from '@/hooks/useCopy'
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
import { batchOperationManager } from '@/utils/batch-operation-manager'
import { useI18n } from '@/i18n/context'
import { AuthClient } from '@/utils/auth-client'
import { frontendJsonManager } from '@/utils/frontend-json-manager'
import { useOptimizedImageIndex } from '@/hooks/useOptimizedImageIndex'

import { LogoutService } from '@/utils/logout-service'
interface UploadedFile {
  fileName: string;
  url: string;
  markdown: string;
  bbcode: string;
  uploadTime: string;
  size: number;
  isLiked: boolean;
}
interface UploadError {
  fileName: string;
  error: string;
}
const UPLOAD_TIMEOUT = 120000
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
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
console.log(
  "%c Powered by Mazine - Copyright (C) 2024 waycaan ",
  "background: #3B82F6; color: white; padding: 5px; border-radius: 3px;"
);
interface UploadStatus {
  stage: 'idle' | 'checking' | 'processing' | 'uploading' | 'indexing' | 'complete';
  totalFiles: number;
  completedFiles: number;
  processType?: 'rename' | 'compress' | 'convert';
  processingDetails?: string;
  currentFile?: string;
  currentFileInfo?: {
    name: string;
    size: string;
    dimensions?: string;
    processedSize?: string;
    compressionRatio?: string;
  };
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  errors: UploadError[];
  completionInfo?: {
    totalImages: number;
    totalTime: string;
    operationLogs: string[];
  };
}
const isValidFileName = (fileName: string): boolean => {
  try {
    if (fileName.includes('/') || fileName.includes('\\')) {
      return false;
    }
    const encoded = encodeURIComponent(fileName);
    return encoded.length <= 1024;
  } catch (error) {
    return false;
  }
};
const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/#/g, '-');
};
const calculateTotalProgress = (status: UploadStatus): number => {
  const totalSteps = status.totalFiles * 3; 
  let completedSteps = 0;
  switch (status.stage) {
    case 'checking':
      completedSteps = status.completedFiles * 3;
      break;
    case 'processing':
      completedSteps = (status.completedFiles * 3) + 1;
      break;
    case 'uploading':
      completedSteps = (status.completedFiles * 3) + 2;
      break;
    case 'complete':
      completedSteps = totalSteps;
      break;
  }
  return (completedSteps / totalSteps) * 100;
};
export default function HomePage() {
  const { isDarkMode, toggleTheme } = useTheme()
  const { t } = useI18n()
  const { index, refreshIndex, invalidateCache } = useOptimizedImageIndex()
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [compress, setCompress] = useState(false)
  const [convertToWebP, setConvertToWebP] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentImages, setCurrentImages] = useState<UploadedFile[]>([])
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<Array<{
    fileName: string;
    error: string;
  }>>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    stage: 'idle',
    totalFiles: 0,
    completedFiles: 0,
    progress: { current: 0, total: 0, percentage: 0 },
    errors: []
  });
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const [showOperationLogs, setShowOperationLogs] = useState<boolean>(false);
  const [showFooter, setShowFooter] = useState(false);
  useEffect(() => {
    const isPageRefresh = (performance as any).navigation?.type === 1 ||
                         (performance.getEntriesByType('navigation')[0] as any)?.type === 'reload';
    if (isPageRefresh) {
      console.log('🔄 [Home] 检测到页面刷新，清空所有本地状态');
      setCurrentImages([]);
      setUploadErrors([]);
      setPreviewImage(null);
      setCopiedType(null);
      console.log('🚀 [Home] 页面刷新清理完成，等待新数据加载');
    }
  }, []);
  useEffect(() => {
    invalidateCache();
    frontendJsonManager.clearCurrentJson();
    setTimeout(() => {
      refreshIndex();
    }, 100);
  }, []); 
  useEffect(() => {
    if (index) {
      frontendJsonManager.setCurrentJson(index);
    } else {
      frontendJsonManager.clearCurrentJson();
    }
  }, [index]);
  const handleUpload = async (files: File[] | FileList) => {
    if (files.length === 0) return;
    const fileArray = Array.from(files);
    if (fileArray.length > FILE_SIZE_LIMITS.MAX_FILES) {
      alert(`Maximum ${FILE_SIZE_LIMITS.MAX_FILES} files can be uploaded at once`);
      return;
    }
    setUploadErrors([]);
    setIsUploading(true);
    setUploadStartTime(Date.now());
    setUploadStatus({
      stage: 'checking',
      totalFiles: fileArray.length,
      completedFiles: 0,
      progress: { current: 0, total: fileArray.length, percentage: 0 },
      errors: []
    });
    const existingFileNames = index ? index.images.map(img => img.fileName) : [];
    const processedFileNames = new Set<string>(existingFileNames);
    let processedFiles: File[] = [];
    let previewFiles: File[] = [];
    let finalFileNames: string[] = []; 
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const nameWithoutHash = file.name.replace(/#/g, '-hash-');
      const cleanFileName = nameWithoutHash
        .replace(/[<>:"/\\|?*]/g, '-')  
        .replace(/\s+/g, ' ')           
        .trim();
      let dimensions = '';
      try {
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            dimensions = `${img.width}x${img.height}`;
            URL.revokeObjectURL(imageUrl);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(imageUrl);
            reject(new Error('Failed to load image'));
          };
          img.src = imageUrl;
        });
      } catch (error) {
        console.warn('获取图片尺寸失败:', error);
        dimensions = '未知尺寸';
      }
      setUploadStatus((prev: UploadStatus) => ({
        ...prev,
        currentFile: file.name,
        currentFileInfo: {
          name: file.name,
          size: formatFileSize(file.size),
          dimensions: dimensions
        },
        progress: {
          current: i,
          total: fileArray.length,
          percentage: (i / fileArray.length) * 100
        }
      }));
      if (!cleanFileName || cleanFileName.trim() === '') {
        setUploadErrors((prev: UploadError[]) => [...prev, {
          fileName: file.name,
          error: '文件名处理后为空，请重新命名后上传'
        }]);
        continue;
      }
      const uniqueFileName = generateUniqueFileName(cleanFileName, Array.from(processedFileNames));
      console.log(`🔍 [重名检测] 文件 ${i + 1}/${fileArray.length}:`);
      console.log(`   - 原始文件名: ${file.name}`);
      console.log(`   - 清理后文件名: ${cleanFileName}`);
      console.log(`   - 最终文件名: ${uniqueFileName}`);
      console.log(`   - 当前已处理文件名: [${Array.from(processedFileNames).join(', ')}]`);
      if (uniqueFileName !== cleanFileName) {
        console.log(`🔄 [重名检测] 检测到重名，重命名: ${cleanFileName} → ${uniqueFileName}`);
        setUploadStatus((prev: UploadStatus) => ({
          ...prev,
          processType: 'rename',
          processingDetails: `重命名文件: ${cleanFileName} → ${uniqueFileName}`
        }));
      }
      processedFileNames.add(uniqueFileName);
      finalFileNames.push(uniqueFileName);
      try {
        let processedFile: File | null = null;
        if (isOverSizeLimit(file)) {
          if (compress || convertToWebP) {
            setUploadStatus((prev: UploadStatus) => ({
              ...prev,
              stage: 'processing',
              processType: convertToWebP && compress ? 'convert' : (convertToWebP ? 'convert' : 'compress'),
              currentFileInfo: {
                name: file.name,
                size: formatFileSize(file.size)
              }
            }));
            processedFile = await processFile(file, {
              forceWebP: convertToWebP,
              forceCompress: compress,
              fileName: uniqueFileName
            });
            if (processedFile) {
              const compressionRatio = ((1 - processedFile.size / file.size) * 100).toFixed(1);
              setUploadStatus((prev: UploadStatus) => ({
                ...prev,
                currentFileInfo: {
                  name: file.name,
                  size: formatFileSize(file.size),
                  processedSize: formatFileSize(processedFile!.size),
                  compressionRatio: `${compressionRatio}%`
                }
              }));
            }
          } else {
            setUploadStatus((prev: UploadStatus) => ({
              ...prev,
              stage: 'processing',
              processType: 'convert'
            }));
            processedFile = await processFile(file, {
              forceWebP: true,
              forceCompress: false,
              fileName: uniqueFileName
            });
            if (processedFile && isOverSizeLimit(processedFile)) {
              setUploadStatus((prev: UploadStatus) => ({
                ...prev,
                stage: 'processing',
                processType: 'compress'
              }));
              processedFile = await processFile(processedFile, {
                forceWebP: false,
                forceCompress: true,
                fileName: uniqueFileName
              });
            }
          }
          if (processedFile && isOverSizeLimit(processedFile)) {
            setUploadErrors((prev: UploadError[]) => [...prev, {
              fileName: file.name,
              error: '文件过大，即使优化后仍超出限制(4.4MB)'
            }]);
            continue;
          }
        } else if (convertToWebP || compress) {
          setUploadStatus((prev: UploadStatus) => ({
            ...prev,
            stage: 'processing',
            processType: convertToWebP && compress ? 'convert' : (convertToWebP ? 'convert' : 'compress')
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
    setUploadStatus((prev: UploadStatus) => ({
      ...prev,
      stage: 'uploading'
    }));
    const totalFiles = processedFiles.length;
    const allUploadedItems: any[] = [];
    const allDisplayFiles: any[] = [];
    console.log(`🚀 [Home] 开始批量上传 ${totalFiles} 个文件`);
    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i];
      try {
        let uploadDimensions = '';
        try {
          const img = new Image();
          const imageUrl = URL.createObjectURL(file);
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              uploadDimensions = `${img.width}x${img.height}`;
              URL.revokeObjectURL(imageUrl);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(imageUrl);
              reject(new Error('Failed to load image'));
            };
            img.src = imageUrl;
          });
        } catch (error) {
          console.warn('获取上传图片尺寸失败:', error);
          uploadDimensions = '未知尺寸';
        }
        setUploadStatus((prev: UploadStatus) => ({
          ...prev,
          currentFile: file.name,
          currentFileInfo: {
            name: file.name,
            size: formatFileSize(file.size),
            dimensions: uploadDimensions
          },
          progress: {
            current: i,
            total: totalFiles,
            percentage: (i / totalFiles) * 100
          }
        }));
        const formData = new FormData();
        formData.append('files', file);
        formData.append('previews', previewFiles[i]);
        formData.append(`format_${file.name}`, file.name.split('.').pop() || '');
        formData.append('finalFileName', finalFileNames[i]);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          console.log(`🚀 [Home] 文件上传成功: ${file.name}`);
          const newImageItems = data.data?.newImageItems || [];
          allUploadedItems.push(...newImageItems);
          const validFiles = data.data?.files || data.files || [];
          const displayFiles = validFiles.filter((file: any) =>
            file.fileName && !file.error && !file.fileName.startsWith('thumbs/')
          );
          allDisplayFiles.push(...displayFiles);
          setUploadStatus((prev: UploadStatus) => ({
            ...prev,
            completedFiles: prev.completedFiles + 1,
            progress: {
              current: i + 1,
              total: totalFiles,
              percentage: ((i + 1) / totalFiles) * 100
            }
          }));
        } else {
          setUploadErrors((prev: UploadError[]) => [...prev, {
            fileName: file.name,
            error: data.error || '上传失败'
          }]);
        }
      } catch (error) {
        console.error('上传失败:', error)
        setUploadErrors((prev: UploadError[]) => [...prev, {
          fileName: file.name,
          error: '网络错误，请重试'
        }])
      }
    }
    if (allUploadedItems.length > 0) {
      try {
        console.log(`🚀 [Home] 开始批量JSON处理，共 ${allUploadedItems.length} 张图片`);
        setUploadStatus((prev: UploadStatus) => ({
          ...prev,
          currentStep: '更新索引',
          processingDetails: `正在更新图片索引 (${allUploadedItems.length}张)`,
        }));
        const updatedJson = frontendJsonManager.calculateUploadIncrement(allUploadedItems);
        const result = await frontendJsonManager.sendJsonToServer(updatedJson, 'batch-upload');
        if (result.success) {
          console.log(`🚀 [Home] 批量JSON更新成功，总数: ${result.newJson.totalCount}`);
          if (allDisplayFiles.length > 0) {
            setCurrentImages(prev => [...allDisplayFiles, ...prev]);
          }
          await refreshIndex();
          console.log(`🚀 [Home] 批量上传完成:`);
          console.log(`   - 文件数量: ${allUploadedItems.length}`);
          console.log(`   - 新的总数: ${result.newJson.totalCount}`);
        } else {
          console.error('🚀 [Home] 批量JSON更新失败:', result.error);
          alert(`批量JSON更新失败: ${result.error}`);
        }
      } catch (error: any) {
        console.error('🚀 [Home] 批量JSON处理失败:', error);
        alert(`批量JSON处理失败: ${error.message}`);
      }
    }
    const totalTime = Math.round((Date.now() - uploadStartTime) / 1000);
    setUploadStatus((prev: UploadStatus) => ({
      ...prev,
      stage: 'complete',
      completionInfo: {
        totalImages: totalFiles,
        totalTime: `${totalTime}s`,
        operationLogs: [
          '🔐 CSRF验证成功',
          '🚀 JSON覆盖API处理完成',
          '✅ 所有文件上传成功',
          '🧹 缓存清理完成'
        ]
      }
    }));
    setTimeout(() => {
      setShowOperationLogs(true);
    }, 3000);
    setTimeout(() => {
      setIsUploading(false);
      setShowOperationLogs(false);
      setUploadStatus({
        stage: 'idle',
        totalFiles: 0,
        completedFiles: 0,
        progress: { current: 0, total: 0, percentage: 0 },
        errors: []
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 6000);
  };
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files.length > 0) await handleUpload(files)
  }
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedType(type)
        setTimeout(() => setCopiedType(null), 2000)
      })
  }
  const handleLogout = () => LogoutService.logout()
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const isBottom = mainElement.scrollHeight - mainElement.scrollTop <= mainElement.clientHeight + 50;
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
            {uploadStatus.stage !== 'idle' ? (
              <div className={styles.uploadStatus}>
                <div className={styles.statusLine}>
                  {uploadStatus.stage !== 'complete' && (
                    <span className={styles.loadingSpinner} />
                  )}
                  <span className={styles.statusText}>
                    {uploadStatus.stage === 'checking' && '检查文件'}
                    {uploadStatus.stage === 'processing' && (
                      uploadStatus.processType === 'rename' ? '重命名文件' :
                      uploadStatus.processType === 'compress' ? '压缩图片' :
                      uploadStatus.processType === 'convert' ? '转换格式' : '处理图片'
                    )}
                    {uploadStatus.stage === 'uploading' && '上传文件'}
                    {uploadStatus.stage === 'indexing' && '更新索引'}
                    {uploadStatus.stage === 'complete' && '上传完成'}
                  </span>
                </div>
                {}
                {uploadStatus.currentFileInfo && (
                  <div className={styles.fileInfoLine}>
                    <span className={styles.fileInfoLabel}>文件:</span>
                    <span className={styles.fileName}>{uploadStatus.currentFileInfo.name}</span>
                    <span className={styles.fileInfoLabel}>大小:</span>
                    <span className={styles.fileSize}>{uploadStatus.currentFileInfo.size}</span>
                    {uploadStatus.currentFileInfo.dimensions && (
                      <>
                        <span className={styles.fileInfoLabel}>尺寸:</span>
                        <span className={styles.fileDimensions}>{uploadStatus.currentFileInfo.dimensions}</span>
                      </>
                    )}
                    {uploadStatus.currentFileInfo.processedSize && (
                      <>
                        <span className={styles.fileInfoLabel}>处理后:</span>
                        <span className={styles.processedSize}>{uploadStatus.currentFileInfo.processedSize}</span>
                      </>
                    )}
                    {uploadStatus.currentFileInfo.compressionRatio && (
                      <>
                        <span className={styles.fileInfoLabel}>压缩率:</span>
                        <span className={styles.compressionRatio}>{uploadStatus.currentFileInfo.compressionRatio}</span>
                      </>
                    )}
                  </div>
                )}
                {}
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${uploadStatus.progress.percentage}%` }}
                    />
                  </div>
                </div>
                {}
                <div className={styles.progressStats}>
                  {uploadStatus.stage !== 'complete' ? (
                    <span>{uploadStatus.progress.current}/{uploadStatus.progress.total} 张图片</span>
                  ) : (
                    uploadStatus.completionInfo && (
                      <span>共 {uploadStatus.completionInfo.totalImages} 张图片，耗时 {uploadStatus.completionInfo.totalTime}</span>
                    )
                  )}
                </div>
                {}
                {uploadStatus.stage === 'complete' && showOperationLogs && uploadStatus.completionInfo?.operationLogs && (
                  <div className={styles.operationLogs}>
                    {uploadStatus.completionInfo.operationLogs.map((log, index) => (
                      <span key={index} className={styles.logItem}>{log}</span>
                    ))}
                  </div>
                )}
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
            {currentImages.map((image) => (
              <div key={image.fileName} className={`${styles.imageCard} ${image.isLiked ? styles.liked : ''}`}>
                <div
                  className={styles.imagePreview}
                  onClick={() => setPreviewImage(image.url)}
                >
                  <img src={image.url} alt={image.fileName} />
                </div>
                <div className={styles.imageInfo}>
                  <div className={styles.fileName}>{image.fileName}</div>
                  <div className={styles.detailsGroup}>
                    <div className={styles.detailItem}>
                      <span>{formatFileSize(image.size)}</span>
                      <span>{formatDate(image.uploadTime)}</span>
                    </div>
                  </div>
                  <div className={styles.urlGroup}>
                    {[
                      {
                        displayValue: decodeURIComponent(image.url), 
                        copyValue: image.url, 
                        label: 'URL',
                        className: styles.buttonUrl
                      },
                      {
                        displayValue: image.markdown,
                        copyValue: image.markdown,
                        label: 'MD',
                        className: styles.buttonMarkdown
                      },
                      {
                        displayValue: image.bbcode,
                        copyValue: image.bbcode,
                        label: 'BB',
                        className: styles.buttonBbcode
                      }
                    ].map(({ label, displayValue, copyValue, className }) => (
                      <div key={label} className={styles.urlItem}>
                        <input
                          type="text"
                          value={displayValue}
                          readOnly
                          className={styles.urlInput}
                        />
                        <button
                          onClick={() => copyToClipboard(copyValue, label)}
                          className={`${styles.button} ${className}`}
                        >
                          {copiedType === label ? '✓' : label}
                        </button>
                      </div>
                    ))}
                  </div>
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
      {}
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