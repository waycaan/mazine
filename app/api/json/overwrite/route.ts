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

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export const runtime = 'edge'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ImageIndex } from '@/types/image-index';
import { withIronAuth } from '@/lib/iron-session';
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
      ContentType: 'application/json'
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
export const POST = withIronAuth(handlePOST);