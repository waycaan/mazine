'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { createPreviewImage } from '@/components/utils/thumbs'
import styles from '@/app/styles/shared.module.css'

interface ImageUploaderProps {
  onUpload: (files: File[], previews: File[]) => void
  isUploading: boolean
}

export default function ImageUploader({ onUpload, isUploading }: ImageUploaderProps) {
  const [compress, setCompress] = useState(false)
  const [convertToWebP, setConvertToWebP] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (isUploading) return

    try {
      const formData = new FormData()
      acceptedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/filename', {
        method: 'POST',
        body: formData
      })
      const { finalFileNames } = await response.json()

      const previewFiles = await Promise.all(
        acceptedFiles.map(async (file, index) => {
          const previewBlob = await createPreviewImage(file, finalFileNames[index])
          return new File([previewBlob], `preview_${finalFileNames[index]}`, {
            type: 'image/webp'
          })
        })
      )

      const processedFiles = await Promise.all(
        acceptedFiles.map(async (file): Promise<File> => {
          let processedFile = file

          if (compress) {
            const options = {
              maxSizeMB: 1,
              useWebWorker: true,
              quality: 0.85
            }
            processedFile = await imageCompression(processedFile, options)
          }

          if (convertToWebP && file.type.startsWith('image/')) {
            const img = new Image()
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            return new Promise<File>((resolve) => {
              img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height
                ctx?.drawImage(img, 0, 0)
                canvas.toBlob(
                  (blob) => {
                    if (blob) {
                      resolve(new File([blob], `${file.name.split('.')[0]}.webp`, {
                        type: 'image/webp'
                      }))
                    }
                  },
                  'image/webp',
                  0.9
                )
              }
              img.src = URL.createObjectURL(processedFile)
            })
          }

          return processedFile
        })
      )

      // 5. 最后一起上传原图和预览图
      onUpload(processedFiles, previewFiles)
    } catch (error) {
      console.error('图片处理失败:', error)
    }
  }, [onUpload, compress, convertToWebP, isUploading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    disabled: isUploading
  })

  return (
    <div className={styles.uploaderContainer}>
      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
      >
        <input {...getInputProps()} />
        <p>{isDragActive ? '松开鼠标上传' : '拖拽文件到此处或点击上传'}</p>
      </div>

      <div className={styles.uploadOptions}>
        <label className={styles.uploadOptionLabel}>
          <input
            type="checkbox"
            checked={compress}
            onChange={(e) => setCompress(e.target.checked)}
            className={styles.uploadOptionCheckbox}
          />
          压缩
        </label>

        <label className={styles.uploadOptionLabel}>
          <input
            type="checkbox"
            checked={convertToWebP}
            onChange={(e) => setConvertToWebP(e.target.checked)}
            className={styles.uploadOptionCheckbox}
          />
          WebP
        </label>
      </div>
    </div>
  )
} 
