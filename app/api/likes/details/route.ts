import { NextResponse } from 'next/server'
import { LikedImage } from '@/types/image'
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'
import { cookies } from 'next/headers'

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || ''
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true
})

const messages = {
  en: {
    unauthorized: 'Unauthorized',
    getFailed: 'Failed to get favorite images'
  },
  zh: {
    unauthorized: '未登录',
    getFailed: '获取收藏图片失败'
  }
}

const getCurrentLang = () => process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' ? 'en' : 'zh'

async function getLikedImagesFromDB(): Promise<LikedImage[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: 'likes/',
      MaxKeys: 1000
    })
    
    const response = await s3Client.send(command)
    
    if (!response.Contents) {
      return []
    }

    const likedImages = await Promise.all(
      response.Contents
        .filter(item => item.Key && !item.Key.endsWith('/'))
        .map(async item => {
          const fileName = item.Key!.replace('likes/', '')
          
          try {
            const headCommand = new HeadObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: fileName
            })
            
            const headResponse = await s3Client.send(headCommand)
            const likeMetadata = await s3Client.send(new HeadObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: item.Key!
            }))
            
            const image: LikedImage = {
              fileName,
              originalName: headResponse.Metadata?.['original-name'] || fileName,
              url: `${process.env.NEXT_PUBLIC_CDN}/${fileName}`,
              previewUrl: `${process.env.NEXT_PUBLIC_CDN}/thumbs/${fileName}`,
              markdown: `![${headResponse.Metadata?.['original-name'] || fileName}](${process.env.NEXT_PUBLIC_CDN}/${fileName})`,
              bbcode: `[img]${process.env.NEXT_PUBLIC_CDN}/${fileName}[/img]`,
              size: headResponse.ContentLength || 0,
              uploadTime: headResponse.LastModified?.toISOString() || new Date().toISOString(),
              likedAt: undefined,
              isLiked: true,
              dimensions: {
                width: parseInt(headResponse.Metadata?.['width'] || '0'),
                height: parseInt(headResponse.Metadata?.['height'] || '0')
              }
            }
            
            return image
          } catch (error) {
            console.error(`Failed to get image info for ${fileName}:`, error)
            return null
          }
        })
    )

    return likedImages.filter((image): image is LikedImage => image !== null)
  } catch (error) {
    console.error('Error in getLikedImagesFromDB:', error)
    throw error
  }
}

export async function GET() {
  try {
    // Check authentication
    const cookieStore = cookies()
    const auth = cookieStore.get('auth')
    if (!auth) {
      return NextResponse.json({ 
        error: messages[getCurrentLang()].unauthorized 
      }, { status: 401 })
    }

    console.log('GET /api/likes/details called')
    const likedImages = await getLikedImagesFromDB()
    console.log('Returning liked images:', likedImages)
    return NextResponse.json(likedImages)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: messages[getCurrentLang()].getFailed,
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
} 
