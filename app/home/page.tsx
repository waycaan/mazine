'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import styles from './home.module.css'

// 网站标题和图标配置
const SITE_CONFIG = {
  title: "图床服务",
  favicon: "/favicon.ico"
}

// 定义上传文件类型
interface UploadedFile {
  originalName: string
  fileName: string
  url: string
  markdown: string
  bbcode: string
  html: string
  size: number
  type: string
  uploadTime: string
}

// 将超时时间提取为常量
const UPLOAD_TIMEOUT = 30000 // 30 seconds

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [currentImages, setCurrentImages] = useState<UploadedFile[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // 初始化主题
  useEffect(() => {
    // 从 localStorage 获取主题设置
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  // 主题切换
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      return newTheme
    })
  }

  // 处理拖拽事件
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // 处理文件拖放
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleUpload(files)
    }
  }

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      await handleUpload(files)
    }
  }

  // 处理文件上传
  const handleUpload = async (files: File[]) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      const totalSize = files.reduce((acc, file) => acc + file.size, 0)
      let uploadedSize = 0

      // 创建 XMLHttpRequest 来跟踪上传进度
      const xhr = new XMLHttpRequest()
      
      // 处理上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          if (progress !== uploadProgress) {
            setUploadProgress(progress)
          }
        }
      })

      // 创建 Promise 包装 XHR
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open('POST', '/api/upload')
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error('上传失败'))
          }
        }
        
        xhr.onerror = () => reject(new Error('网络错误'))
        
        // 添加文件到 FormData
        files.forEach(file => {
          formData.append('files', file)
        })
        
        // 发送请求
        xhr.send(formData)
      })

      // 设置超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('上传超时')), UPLOAD_TIMEOUT)
      })

      // 等待上传完成或超时
      const data = await Promise.race([uploadPromise, timeoutPromise])
      
      // 更新预览
      setCurrentImages(prev => [...(data as any).files, ...prev])
      setUploadProgress(100)
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Upload error:', error)
      }
      if (error instanceof Error) {
        alert(error.message || '上传失败，请重试')
      } else {
        alert('上传失败，请重试')
      }
    } finally {
      // 延迟重置上传状态，让用户看到100%的进度
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  // 复制到剪贴板
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      })
      .catch(() => {})
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = (bytes / Math.pow(k, i)).toFixed(2)
    return `${size} ${sizes[i]}`
  }

  // 修改退出登录按钮的处理函数
  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    
    try {
      const res = await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        router.push('/login')
      } else {
        throw new Error('登出失败')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', error)
      }
      alert('登出失败，请重试')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.containerDark : ''}`}>
      {/* 顶栏 */}
      <header className={`${styles.header} ${isDarkMode ? styles.headerDark : ''}`}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Image 
              src={SITE_CONFIG.favicon} 
              alt="Logo" 
              width={32} 
              height={32} 
              className="rounded"
            />
            <h1 className={styles.title}>{SITE_CONFIG.title}</h1>
          </div>
          
          <nav className={styles.nav}>
            <button className={styles.button}>
              上传图片
            </button>
            
            <Link 
              href="/manage"
              className={styles.button}
            >
              图片管理
            </Link>
            
            <button
              onClick={handleLogout}
              className={styles.button}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? '退出中...' : '退出登录'}
            </button>
            
            <button
              onClick={toggleTheme}
              className={styles.button}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className={styles.main}>
        {/* 上传区域 */}
        <div className={styles.uploadArea}>
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
              onChange={handleFileChange}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
            />
            {isUploading ? (
              <div className={styles.uploadingState}>
                <p>上传中...</p>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className={styles.uploadIcon} />
                <p className={styles.uploadText}>点击或拖拽图片到这里上传</p>
              </>
            )}
          </div>
        </div>

        {/* 预览区域 */}
        {currentImages.length > 0 && (
          <div className={styles.previewArea}>
            <div className={styles.previewGrid}>
              {currentImages.map((image, index) => (
                <div key={image.fileName} className={styles.previewCard}>
                  <div className={styles.imagePreview}>
                    <img
                      src={image.url}
                      alt={image.originalName}
                    />
                  </div>
                  <div className={styles.urlGroup}>
                    {[
                      { label: '直链', value: image.url },
                      { label: 'Markdown', value: image.markdown },
                      { label: 'BBCode', value: image.bbcode }
                    ].map(({ label, value }) => (
                      <div key={label} className={styles.urlItem}>
                        <span className={styles.urlLabel}>{label}</span>
                        <input
                          type="text"
                          value={value}
                          readOnly
                          className={styles.urlInput}
                        />
                        <button
                          onClick={() => copyToClipboard(value, index)}
                          className={styles.copyButton}
                        >
                          {copiedIndex === index ? '已复制' : '复制'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
