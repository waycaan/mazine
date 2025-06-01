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

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ImageIndex } from '@/types/image-index';
import { withIronAuth } from '@/lib/iron-session';
import { withCSRF } from '@/lib/auth';
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});
const bucketName = process.env.S3_BUCKET_NAME!;
const indexKey = 'index.json';
async function handlePOST(request: NextRequest) {
  try {
    const { json, operation } = await request.json();
    if (!json || typeof json !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'JSON数据无效'
      }, { status: 400 });
    }
    console.log(`🚀 [JSON覆盖API] 开始处理 ${operation} 操作`);
    console.log(`🚀 [JSON覆盖API] 接收到JSON: 总数=${json.totalCount}, 收藏=${json.likedCount}`);
    const startTime = Date.now();
    const jsonData = JSON.stringify(json, null, 2);
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: indexKey,
      Body: jsonData,
      ContentType: 'application/json',
      ACL: 'public-read'
    }));
    const writeTime = Date.now() - startTime;
    console.log(`🚀 [JSON覆盖API] JSON写入S3完成，耗时: ${writeTime}ms`);
    let verificationSuccess = false;
    let verifyAttempts = 0;
    const maxVerifyAttempts = 3;
    while (verifyAttempts < maxVerifyAttempts && !verificationSuccess) {
      try {
        if (verifyAttempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        const verifyResponse = await s3Client.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: indexKey
        }));
        const verifyContent = await verifyResponse.Body?.transformToString();
        if (verifyContent) {
          const verifiedJson = JSON.parse(verifyContent) as ImageIndex;
          if (verifiedJson.totalCount === json.totalCount &&
              verifiedJson.lastUpdated === json.lastUpdated) {
            console.log(`🚀 [JSON覆盖API] 验证成功 (第${verifyAttempts + 1}次尝试)`);
            verificationSuccess = true;
          } else {
            console.warn(`🚀 [JSON覆盖API] 验证失败 (第${verifyAttempts + 1}次尝试)`);
            console.warn(`   期望: totalCount=${json.totalCount}, lastUpdated=${json.lastUpdated}`);
            console.warn(`   实际: totalCount=${verifiedJson.totalCount}, lastUpdated=${verifiedJson.lastUpdated}`);
          }
        }
      } catch (verifyError) {
        console.warn(`🚀 [JSON覆盖API] 验证出错 (第${verifyAttempts + 1}次尝试):`, verifyError);
      }
      verifyAttempts++;
    }
    if (!verificationSuccess) {
      return NextResponse.json({
        success: false,
        error: 'JSON写入验证失败'
      }, { status: 500 });
    }
    const totalTime = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      newJson: json,
      clearCache: true,
      stats: {
        writeTime,
        totalTime,
        verifyAttempts
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'JSON覆盖失败'
    }, { status: 500 });
  }
}
export const POST = withIronAuth(withCSRF(handlePOST));