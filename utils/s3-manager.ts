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

import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
export interface ImageMetadata {
  id: string;
  originalName: string;
  fileName: string;
  uploadTime: string;
  size: number;
  type: string;
  dimensions: {
    width: number;
    height: number;
  };
  urls: {
    original: string;
    thumbnail: string;
  };
  metadata: {
    camera?: string;
    location?: string;
    tags: string[];
  };
  stats: {
    views: number;
    downloads: number;
  };
  isLiked: boolean;
  likedAt?: string;
  album?: string;
}
export interface Collection {
  id: string;
  name: string;
  description?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}
export interface SystemStats {
  totalImages: number;
  totalSize: number;
  totalViews: number;
  totalDownloads: number;
  lastUpdated: string;
}
export class S3Manager {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnUrl?: string;
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
    this.cdnUrl = process.env.NEXT_PUBLIC_CDN;
  }
  private getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl.replace(/\/$/, '')}/${key}`;
    }
    const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    return `${endpoint}/${this.bucketName}/${key}`;
  }
  private generateFileId(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; 
    const randomId = Math.random().toString(36).substring(2, 8);
    return `${dateStr}-${randomId}`;
  }
  private async readJsonFile<T>(key: string): Promise<T | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      const response = await this.s3Client.send(command);
      const content = await response.Body?.transformToString();
      return content ? JSON.parse(content) : null;
    } catch (error) {
      return null;
    }
  }
  private async writeJsonFile(key: string, data: any): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read'
    });
    await this.s3Client.send(command);
  }
  async uploadImage(
    file: Buffer,
    originalName: string,
    contentType: string,
    thumbnailBuffer?: Buffer
  ): Promise<ImageMetadata> {
    const fileId = this.generateFileId();
    const ext = originalName.split('.').pop();
    const fileName = `${fileId}.${ext}`;
    const imageKey = `images/${fileName}`;
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: imageKey,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read'
    });
    await this.s3Client.send(uploadCommand);
    let thumbnailKey = '';
    if (thumbnailBuffer) {
      thumbnailKey = `thumbs/${fileId}.webp`;
      const thumbCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/webp',
        ACL: 'public-read'
      });
      await this.s3Client.send(thumbCommand);
    }
    const metadata: ImageMetadata = {
      id: fileId,
      originalName,
      fileName,
      uploadTime: new Date().toISOString(),
      size: file.length,
      type: contentType,
      dimensions: { width: 0, height: 0 },
      urls: {
        original: this.getPublicUrl(imageKey),
        thumbnail: thumbnailKey ? this.getPublicUrl(thumbnailKey) : this.getPublicUrl(imageKey)
      },
      metadata: {
        tags: []
      },
      stats: {
        views: 0,
        downloads: 0
      },
      isLiked: false
    };
    const metaKey = `meta/${fileId}.json`;
    await this.writeJsonFile(metaKey, metadata);
    await this.updateStats();
    return metadata;
  }
  async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
    return await this.readJsonFile<ImageMetadata>(`meta/${imageId}.json`);
  }
  async getAllImages(limit?: number, cursor?: string): Promise<{
    images: ImageMetadata[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: 'meta/',
      MaxKeys: limit || 50,
      ContinuationToken: cursor
    });
    const response = await this.s3Client.send(command);
    const images: ImageMetadata[] = [];
    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key?.endsWith('.json')) {
          const metadata = await this.readJsonFile<ImageMetadata>(item.Key);
          if (metadata) {
            images.push(metadata);
          }
        }
      }
    }
    images.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
    return {
      images,
      nextCursor: response.NextContinuationToken,
      hasMore: !!response.IsTruncated
    };
  }
  async deleteImage(imageId: string): Promise<void> {
    const metadata = await this.getImageMetadata(imageId);
    if (!metadata) {
      throw new Error('Image not found');
    }
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: `images/${metadata.fileName}`
    }));
    const ext = metadata.fileName.split('.').pop();
    const thumbKey = `thumbs/${imageId}.webp`;
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: thumbKey
      }));
    } catch (error) {
    }
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: `meta/${imageId}.json`
    }));
    await this.updateStats();
  }
  async toggleLike(imageId: string): Promise<ImageMetadata> {
    const metadata = await this.getImageMetadata(imageId);
    if (!metadata) {
      throw new Error('Image not found');
    }
    metadata.isLiked = !metadata.isLiked;
    metadata.likedAt = metadata.isLiked ? new Date().toISOString() : undefined;
    await this.writeJsonFile(`meta/${imageId}.json`, metadata);
    await this.updateFavoritesCollection();
    return metadata;
  }
  async getFavorites(): Promise<ImageMetadata[]> {
    const { images } = await this.getAllImages(1000);
    return images.filter(img => img.isLiked);
  }
  private async updateFavoritesCollection(): Promise<void> {
    const favorites = await this.getFavorites();
    const collection = {
      id: 'favorites',
      name: 'Favorites',
      description: 'Liked images',
      images: favorites.map(img => img.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.writeJsonFile('collections/favorites.json', collection);
  }
  private async updateStats(): Promise<void> {
    const { images } = await this.getAllImages(10000);
    const stats: SystemStats = {
      totalImages: images.length,
      totalSize: images.reduce((sum, img) => sum + img.size, 0),
      totalViews: images.reduce((sum, img) => sum + img.stats.views, 0),
      totalDownloads: images.reduce((sum, img) => sum + img.stats.downloads, 0),
      lastUpdated: new Date().toISOString()
    };
    await this.writeJsonFile('.system/stats.json', stats);
  }
  async getStats(): Promise<SystemStats | null> {
    return await this.readJsonFile<SystemStats>('.system/stats.json');
  }
  async searchImages(query: string, tags?: string[]): Promise<ImageMetadata[]> {
    const { images } = await this.getAllImages(1000);
    return images.filter(img => {
      const matchesQuery = !query ||
        img.originalName.toLowerCase().includes(query.toLowerCase()) ||
        img.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      const matchesTags = !tags || tags.length === 0 ||
        tags.every(tag => img.metadata.tags.includes(tag));
      return matchesQuery && matchesTags;
    });
  }
}
export const s3Manager = new S3Manager();