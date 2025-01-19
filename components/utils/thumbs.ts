/**
 * 预览图生成工具
 * 在文件名解码和重名处理后，处理照片前生成预览图
 */
export async function createPreviewImage(file: File, finalFileName: string): Promise<File> {
  const previewBlob = await generatePreviewBlob(file)
  return new File([previewBlob], `preview_${finalFileName}`, {
    type: 'image/webp'
  })
}

// 内部函数：生成预览图 Blob
async function generatePreviewBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      // 计算等比缩放的尺寸
      const maxSize = 200
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // 绘制图像到画布
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转换为 WebP 格式的 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create thumb blob'))
          }
        },
        'image/webp',
        0.8  // 质量参数
      )
    }

    img.onerror = () => reject(new Error('Failed to load image for preview'))
    img.src = URL.createObjectURL(file)
  })
} 