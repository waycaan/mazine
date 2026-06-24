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

import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { ImageIndex, ImageIndexItem, ImageIndexResponse } from '@/types/image-index';
export class ImageIndexManager {
  private s3Client: S3Client;
  private bucketName: string;
  private indexKey = 'index.json';
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.S3_REGION!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
    });
    this.bucketName = process.env.S3_BUCKET_NAME!;
  }
  async getIndex(): Promise<ImageIndex> {
    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.indexKey
      }));
      const content = await response.Body?.transformToString();
      if (content) {
        const index = JSON.parse(content) as ImageIndex;
        return index;
      }
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404) {
        console.log('📋 JSON索引不存在，创建新索引');
        return this.createEmptyIndex();
      }
      throw new Error(`读取索引失败: ${error.message}`);
    }
    throw new Error('索引文件内容为空');
  }
  private createEmptyIndex(): ImageIndex {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalCount: 0,
      images: [],
      likedCount: 0
    };
  }
  private async saveIndex(index: ImageIndex): Promise<void> {
    const indexData = JSON.stringify(index);
    const startTime = Date.now();
    console.log(`📝 开始保存JSON到S3，大小: ${indexData.length} 字节`);
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: this.indexKey,
      Body: indexData,
      ContentType: 'application/json'
    }));
    const endTime = Date.now();
    console.log(`✅ JSON保存到S3完成，耗时: ${endTime - startTime}ms`);
    let verifyAttempts = 0;
    const maxVerifyAttempts = 3;
    let verificationSuccess = false;
    while (verifyAttempts < maxVerifyAttempts && !verificationSuccess) {
      try {
        if (verifyAttempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        const verifyCommand = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: this.indexKey
        });
        const verifyResponse = await this.s3Client.send(verifyCommand);
        const verifyContent = await verifyResponse.Body?.transformToString();
        if (verifyContent) {
          const verifiedIndex = JSON.parse(verifyContent) as ImageIndex;
          if (verifiedIndex.totalCount === index.totalCount &&
              verifiedIndex.lastUpdated === index.lastUpdated) {
            console.log(`✅ S3写入验证成功 (第${verifyAttempts + 1}次尝试)，图片数量: ${verifiedIndex.totalCount}`);
            verificationSuccess = true;
          } else {
            console.warn(`⚠️ S3写入验证失败 (第${verifyAttempts + 1}次尝试)，数据不匹配:`);
            console.warn(`   期望: totalCount=${index.totalCount}, lastUpdated=${index.lastUpdated}`);
            console.warn(`   实际: totalCount=${verifiedIndex.totalCount}, lastUpdated=${verifiedIndex.lastUpdated}`);
          }
        }
      } catch (verifyError) {
        console.warn(`⚠️ S3写入验证失败 (第${verifyAttempts + 1}次尝试):`, verifyError);
      }
      verifyAttempts++;
    }
    if (!verificationSuccess) {
      console.error(`🚨 JSON写入验证最终失败，已尝试 ${maxVerifyAttempts} 次`);
      throw new Error('JSON索引写入验证失败，数据可能不一致');
    }
    console.log(`✅ JSON索引保存完成`);
  }
  async addImages(newImages: ImageIndexItem[]): Promise<ImageIndex> {
    console.log(`📝 添加 ${newImages.length} 张图片到索引`);
    const index = await this.getIndex();
    const existingFileNames = new Set(index.images.map(img => img.fileName));
    const uniqueNewImages = newImages.filter(img => !existingFileNames.has(img.fileName));
    index.images.push(...uniqueNewImages);
    index.totalCount = index.images.length;
    index.likedCount = index.images.filter(img => img.isLiked).length;
    index.lastUpdated = new Date().toISOString();
    await this.saveIndex(index);
    console.log(`✅ 成功添加 ${uniqueNewImages.length} 张图片，总数: ${index.totalCount}`);
    return index;
  }
  async removeImages(fileNames: string[]): Promise<ImageIndex> {
    console.log(`📝 ImageIndexManager.removeImages 开始`);
    console.log(`   - 请求删除: [${fileNames.join(', ')}]`);
    const index = await this.getIndex();
    const beforeCount = index.images.length;
    const beforeLikedCount = index.likedCount;
    console.log(`📝 删除前状态:`);
    console.log(`   - 总图片数: ${beforeCount}`);
    console.log(`   - 收藏数: ${beforeLikedCount}`);
    const toDelete: string[] = [];
    const notFound: string[] = [];
    fileNames.forEach(fileName => {
      const exists = index.images.some(img => img.fileName === fileName);
      if (exists) {
        toDelete.push(fileName);
        console.log(`   - ${fileName}: ✅ 找到，将删除`);
      } else {
        notFound.push(fileName);
        console.log(`   - ${fileName}: ❌ 未找到`);
      }
    });
    if (notFound.length > 0) {
      console.warn(`⚠️ 以下文件在索引中不存在: [${notFound.join(', ')}]`);
    }
    if (toDelete.length > 0) {
      console.log(`📝 开始删除 ${toDelete.length} 张图片...`);
      index.images = index.images.filter(img => !toDelete.includes(img.fileName));
    }
    const afterCount = index.images.length;
    const actualDeleted = beforeCount - afterCount;
    index.totalCount = index.images.length;
    index.likedCount = index.images.filter(img => img.isLiked).length;
    index.lastUpdated = new Date().toISOString();
    console.log(`📝 删除后状态:`);
    console.log(`   - 总图片数: ${afterCount}`);
    console.log(`   - 收藏数: ${index.likedCount}`);
    console.log(`   - 实际删除: ${actualDeleted} 张`);
    console.log(`📝 保存更新后的索引到S3...`);
    await this.saveIndex(index);
    console.log(`✅ ImageIndexManager.removeImages 完成`);
    return index;
  }
  async toggleLikes(fileNames: string[], isLiked: boolean): Promise<ImageIndex> {
    console.log(`📝 ${isLiked ? '收藏' : '取消收藏'} ${fileNames.length} 张图片`);
    const index = await this.getIndex();
    let changedCount = 0;
    index.images.forEach(img => {
      if (fileNames.includes(img.fileName) && img.isLiked !== isLiked) {
        img.isLiked = isLiked;
        changedCount++;
      }
    });
    index.likedCount = index.images.filter(img => img.isLiked).length;
    index.lastUpdated = new Date().toISOString();
    await this.saveIndex(index);
    console.log(`✅ 成功${isLiked ? '收藏' : '取消收藏'} ${changedCount} 张图片，收藏总数: ${index.likedCount}`);
    return index;
  }
  async rebuildIndex(): Promise<ImageIndex> {
    console.log('🔄 开始重建图片索引...');
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucketName,
      MaxKeys: 1000
    });
    const response = await this.s3Client.send(listCommand);
    const allFiles = response.Contents || [];
    const imageFiles = [];
    for (const file of allFiles) {
      const key = file.Key!;
      if (!key.startsWith('thumbs/') && !key.startsWith('likes/') &&
          !key.includes('index.json') && key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        imageFiles.push(file);
      }
    }
    console.log(`📊 发现 ${imageFiles.length} 个图片文件`);
    let existingIndex: ImageIndex | null = null;
    try {
      existingIndex = await this.getIndex();
      console.log(`📋 获取现有索引，保留 ${existingIndex.likedCount} 个收藏状态`);
    } catch (error) {
      console.log('📋 未找到现有索引，将创建全新索引');
    }
    const existingLikes = new Map<string, boolean>();
    if (existingIndex) {
      existingIndex.images.forEach(img => {
        if (img.isLiked) {
          existingLikes.set(img.fileName, true);
        }
      });
    }
    const indexItems: ImageIndexItem[] = [];
    for (const file of imageFiles) {
      const fileName = file.Key!;
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: fileName
        });
        const headResponse = await this.s3Client.send(headCommand);
        const indexItem: ImageIndexItem = {
          fileName,
          size: file.Size || 0,
          uploadTime: file.LastModified?.toISOString() || new Date().toISOString(),
          isLiked: existingLikes.get(fileName) || false, 
          width: headResponse.Metadata?.['width'] ? parseInt(headResponse.Metadata['width']) : undefined,
          height: headResponse.Metadata?.['height'] ? parseInt(headResponse.Metadata['height']) : undefined
        };
        indexItems.push(indexItem);
      } catch (error) {
        console.warn(`⚠️ 无法获取文件元数据: ${fileName}`, error);
      }
    }
    indexItems.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
    const index: ImageIndex = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalCount: indexItems.length,
      images: indexItems,
      likedCount: indexItems.filter(item => item.isLiked).length
    };
    await this.saveIndex(index);
    console.log(`✅ 索引重建完成，共 ${index.totalCount} 张图片，${index.likedCount} 个收藏`);
    return index;
  }
  async getStats(): Promise<{
    totalImages: number;
    likedImages: number;
    totalSize: number;
    lastUpdated: string;
  }> {
    const index = await this.getIndex();
    const totalSize = index.images.reduce((sum, item) => sum + item.size, 0);
    return {
      totalImages: index.totalCount,
      likedImages: index.likedCount,
      totalSize,
      lastUpdated: index.lastUpdated
    };
  }
}
export const imageIndexManager = new ImageIndexManager();