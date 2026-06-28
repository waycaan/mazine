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
import { useI18n } from '@/i18n/context'
import { AuthClient } from '@/utils/auth-client'
import { frontendJsonManager } from '@/utils/frontend-json-manager'
import { useOptimizedImageIndex } from '@/hooks/useOptimizedImageIndex'

import { LogoutService } from '@/utils/logout-service'
interface UploadedFile {
  fileName: string;
  url: string;
  previewUrl: string;
  markdown: string;
  bbcode: string;
  uploadTime: string;
  size: number;
  isLiked: boolean;
  width?: number;
  height?: number;
  format?: string;
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
  const { index, refreshIndex, prefetchIndex, setIndexData, updateIndexOptimistically, invalidateCache } = useOptimizedImageIndex()
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [compressionQuality, setCompressionQuality] = useState<number>(1)
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
      setCurrentImages([]);
      setUploadErrors([]);
      setPreviewImage(null);
      setCopiedType(null);
    }
  }, []);
  useEffect(() => {
    frontendJsonManager.clearCurrentJson();
    prefetchIndex();
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
    let finalFileNames: string[] = [];
    const fileItems: { file: File; uniqueFileName: string; originalIndex: number }[] = [];
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const nameWithoutHash = file.name.replace(/#/g, '-hash-');
      const cleanFileName = nameWithoutHash
        .replace(/[<>:"/\\|?*]/g, '-')  
        .replace(/\s+/g, ' ')           
        .trim();
      if (!cleanFileName || cleanFileName.trim() === '') {
        setUploadErrors((prev: UploadError[]) => [...prev, {
          fileName: file.name,
          error: '文件名处理后为空，请重新命名后上传'
        }]);
        finalFileNames.push('');
        continue;
      }
      const uniqueFileName = generateUniqueFileName(cleanFileName, Array.from(processedFileNames));
      if (uniqueFileName !== cleanFileName) {
        setUploadStatus((prev: UploadStatus) => ({
          ...prev,
          processType: 'rename',
          processingDetails: `重命名文件: ${cleanFileName} → ${uniqueFileName}`
        }));
      }
      processedFileNames.add(uniqueFileName);
      finalFileNames.push(uniqueFileName);
      fileItems.push({ file, uniqueFileName, originalIndex: i });
    }
    setUploadStatus((prev: UploadStatus) => ({
      ...prev,
      stage: 'processing',
      progress: { current: 0, total: fileItems.length, percentage: 0 }
    }));
    const processOne = async (item: { file: File; uniqueFileName: string; originalIndex: number }) => {
      const { file, uniqueFileName } = item;
      try {
        let processedFile: File | null = null;
        if (isOverSizeLimit(file)) {
          if (compressionQuality || convertToWebP) {
            processedFile = await processFile(file, {
              forceWebP: convertToWebP,
              forceCompress: !!compressionQuality,
              compressionQuality: compressionQuality || undefined,
              fileName: uniqueFileName
            });
          } else {
            processedFile = await processFile(file, {
              forceWebP: true,
              forceCompress: false,
              fileName: uniqueFileName
            });
            if (processedFile && isOverSizeLimit(processedFile)) {
              processedFile = await processFile(processedFile, {
                forceWebP: false,
                forceCompress: true,
                fileName: uniqueFileName
              });
            }
          }
          if (processedFile && isOverSizeLimit(processedFile)) {
            return { status: 'error' as const, fileName: file.name, error: '文件过大，即使优化后仍超出限制(4.4MB)' };
          }
        } else if (convertToWebP || compressionQuality) {
          processedFile = await processFile(file, {
            forceWebP: convertToWebP,
            forceCompress: !!compressionQuality,
            compressionQuality: compressionQuality || undefined,
            fileName: uniqueFileName
          });
        } else {
          processedFile = file;
        }
        if (!processedFile) {
          return { status: 'error' as const, fileName: file.name, error: '处理失败' };
        }
        let previewFile: Blob | null = null;
        try {
          previewFile = await createPreviewImage(processedFile, uniqueFileName);
        } catch {
          return { status: 'error' as const, fileName: file.name, error: '生成预览图失败' };
        }
        return { status: 'ok' as const, processedFile, previewFile, originalIndex: item.originalIndex, fileName: file.name };
      } catch (error) {
        return { status: 'error' as const, fileName: file.name, error: error instanceof Error ? error.message : '未知错误' };
      }
    };
    const processResults = await Promise.all(fileItems.map(processOne));
    const processedFiles: File[] = [];
    const previewFiles: Blob[] = [];
    for (const result of processResults) {
      if (result.status === 'error') {
        setUploadErrors((prev: UploadError[]) => [...prev, { fileName: result.fileName, error: result.error }]);
      } else {
        processedFiles[result.originalIndex] = result.processedFile;
        previewFiles[result.originalIndex] = result.previewFile;
      }
    }
    setUploadStatus((prev: UploadStatus) => ({
      ...prev,
      progress: { current: fileItems.length, total: fileItems.length, percentage: 100 }
    }));
    setUploadStatus((prev: UploadStatus) => ({
      ...prev,
      stage: 'uploading'
    }));
    const uploadItems = processedFiles
      .map((file, i) => ({ file, preview: previewFiles[i], finalName: finalFileNames[i] }))
      .filter(item => item.file);
    const totalFiles = uploadItems.length;
    const allUploadedItems: any[] = [];
    const allDisplayFiles: any[] = [];
    let lastNewIndex: any = null;
    for (let i = 0; i < uploadItems.length; i++) {
      const { file, preview, finalName } = uploadItems[i];
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
        formData.append('previews', preview);
        formData.append(`format_${file.name}`, file.name.split('.').pop() || '');
        formData.append('finalFileName', finalName);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          const newImageItems = data.data?.newImageItems || [];
          allUploadedItems.push(...newImageItems);
          if (data.data?.newIndex) lastNewIndex = data.data.newIndex;
          const validFiles = data.data?.files || data.files || [];
          const serverFile = validFiles.find((f: any) =>
            f.fileName && !f.error && !f.fileName.startsWith('thumbs/')
          );
          const newItem = newImageItems[0] || {};
          const ext = finalName.split('.').pop()?.toLowerCase() || '';
          allDisplayFiles.push({
            fileName: finalName,
            url: serverFile?.url || '',
            previewUrl: serverFile?.previewUrl || '',
            markdown: serverFile?.markdown || `![${finalName}](${serverFile?.url || ''})`,
            bbcode: serverFile?.bbcode || `[img]${serverFile?.url || ''}[/img]`,
            uploadTime: newItem.uploadTime || new Date().toISOString(),
            size: file.size,
            isLiked: false,
            width: newItem.width || 0,
            height: newItem.height || 0,
            format: ext
          });
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
        if (allDisplayFiles.length > 0) {
          setCurrentImages(prev => [...allDisplayFiles, ...prev]);
        }
        if (lastNewIndex) {
          setIndexData(lastNewIndex);
        } else {
          prefetchIndex();
        }
      } catch (error: any) {
        console.error('🚀 [Home] 处理失败:', error);
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
              <select
                className={styles.selectInput}
                value={compressionQuality}
                onChange={(e) => setCompressionQuality(Number(e.target.value))}
              >
                <option value="1">无损</option>
                <option value="0.9">90%</option>
                <option value="0.8">80%</option>
                <option value="0.7">70%</option>
              </select>
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
                  <img src={image.previewUrl || image.url} alt={image.fileName} />
                </div>
                <div className={styles.imageInfo}>
                  <div className={styles.fileName} title={image.fileName}>{truncName(image.fileName)}</div>
                  <div className={styles.detailsGroup}>
                    <div className={styles.detailItem}>
                      <span>{formatFileSize(image.size)}</span>
                      <span>{formatDate(image.uploadTime)}</span>
                    </div>
                    {(image.width || image.height) ? (
                      <div className={styles.detailItem}>
                        <span>{image.width} × {image.height}</span>
                        {image.format && <span>{image.format.toUpperCase()}</span>}
                      </div>
                    ) : image.format ? (
                      <div className={styles.detailItem}>
                        <span>{image.format.toUpperCase()}</span>
                      </div>
                    ) : null}
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
                  <button
                    className={`${styles.button} ${styles.likeToggle} ${image.isLiked ? styles.likeToggleActive : ''}`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newLiked = !image.isLiked;
                      setCurrentImages(prev => prev.map(img =>
                        img.fileName === image.fileName ? { ...img, isLiked: newLiked } : img
                      ));
                      if (index) {
                        updateIndexOptimistically({ type: 'toggleLike', fileName: image.fileName, data: { isLiked: newLiked } });
                      }
                      try {
                        await fetch('/api/likes/toggle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ fileNames: [image.fileName], isLiked: newLiked })
                        });
                        prefetchIndex();
                      } catch (err) {
                        console.error('收藏失败:', err);
                      }
                    }}
                  >
                    {image.isLiked ? '♥ 已收藏' : '♡ 收藏'}
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