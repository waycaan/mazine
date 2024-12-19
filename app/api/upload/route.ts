import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { cookies } from 'next/headers'

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
})

function getPublicUrl(fileName: string) {
  if (process.env.USE_R2_SUBDOMAIN === 'true' && process.env.R2_CUSTOM_DOMAIN) {
    return `${process.env.R2_CUSTOM_DOMAIN.replace(/\/$/, '')}/${fileName}`
  }
  if (process.env.PUBLIC_DOMAIN) {
    return `${process.env.PUBLIC_DOMAIN.replace(/\/$/, '')}/${fileName}`
  }
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '')
  const bucket = process.env.S3_BUCKET_NAME
  return `${endpoint}/${bucket}/${fileName}`
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth')
  if (!auth) {
    return NextResponse.json(
      { success: false, message: '未登录' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    const MAX_FILE_SIZE = 50 * 1024 * 1024
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: `文件 ${file.name} 超过50MB限制` },
          { status: 400 }
        )
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有上传文件' },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      if (!(file instanceof File)) continue

      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const ext = file.name.split('.').pop()
      const fileName = `${timestamp}-${randomStr}.${ext}`

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
          CacheControl: 'public, max-age=31536000',
          ACL: 'public-read',
          Metadata: {
            'original-name': file.name,
            'upload-time': new Date().toISOString()
          }
        }))

        const url = getPublicUrl(fileName)
        uploadedFiles.push({
          originalName: file.name,
          fileName,
          url,
          markdown: `![${file.name}](${url})`,
          bbcode: `[img]${url}[/img]`,
          html: `<img src="${url}" alt="${file.name}" />`,
          size: file.size,
          type: file.type,
          uploadTime: new Date().toISOString()
        })
      } catch (uploadError) {
        throw uploadError
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: '上传失败', error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
