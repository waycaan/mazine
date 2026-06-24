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

const API_INFO = {
  id: 'mazine-api-batch-v1.0.0',
  endpoint: '/api/images/batch',
  author: 'waycaan',
  version: '1.0.0',
  license: 'MIT'
} as const;
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
export const runtime = 'edge'
import { imageIndexManager } from '@/utils/image-index-manager'
import { withIronAuth } from '@/lib/iron-session'
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || ''
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true
})
async function deleteS3ObjectWithRetry(bucket: string, key: string, maxRetries = 2): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      }));
      return true;
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404) {
        return true;
      }
      if (attempt <= maxRetries) {
        console.warn(`删除重试 ${attempt}/${maxRetries}: ${key}`, error.message);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }
      throw error;
    }
  }
  return false;
}
async function handleDELETE(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('批量删除请求:', body)
    if (!body || !body.fileNames || !Array.isArray(body.fileNames)) {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }
    const { fileNames } = body
    console.log('批量删除文件:', fileNames)
    console.log(`🚀 [删除API] 采用前端主导JSON模式，只删除S3文件`);
    console.log(`🚀 [删除API] 准备删除 ${fileNames.length} 个文件`);
    setTimeout(async () => {
      console.log('🔄 开始后台删除S3文件...');
      const deleteResults = await Promise.all(fileNames.map(async (fileName: string) => {
        try {
          await deleteS3ObjectWithRetry(
            process.env.S3_BUCKET_NAME || '',
            fileName
          );
          console.log(`🗑️ 原图删除成功: ${fileName}`);
          try {
            await deleteS3ObjectWithRetry(
              process.env.S3_BUCKET_NAME || '',
              `thumbs/${fileName}`
            );
            console.log(`🗑️ 预览图删除成功: ${fileName}`);
          } catch (error: any) {
            console.warn(`预览图删除失败: ${fileName}`, error);
          }
          try {
            await deleteS3ObjectWithRetry(
              process.env.S3_BUCKET_NAME || '',
              `likes/${fileName}`
            );
            console.log(`🗑️ 收藏标记删除成功: ${fileName}`);
          } catch (error: any) {
            console.warn(`收藏标记删除失败: ${fileName}`, error);
          }
          return { fileName, success: true };
        } catch (error: any) {
          console.error(`❌ S3文件删除失败: ${fileName}`, error);
          return { fileName, success: false, error: error.message };
        }
      }));
      const successCount = deleteResults.filter(r => r.success).length;
      const failedCount = deleteResults.length - successCount;
      console.log(`📊 后台S3删除完成: 成功 ${successCount}/${fileNames.length}, 失败 ${failedCount}`);
      if (failedCount > 0) {
        const failedFiles = deleteResults.filter(r => !r.success);
        console.warn(`⚠️ S3删除失败的文件:`, failedFiles.map(f => `${f.fileName}: ${f.error}`));
      }
    });
    return NextResponse.json({
      success: true,
      message: `开始删除 ${fileNames.length} 张图片的S3文件`
    })
  } catch (error: any) {
    console.error('批量删除失败:', error)
    return NextResponse.json(
      { error: '批量删除失败' },
      { status: 500 }
    )
  }
}

export const DELETE = withIronAuth(handleDELETE);