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

type IndexUpdateListener = (event: IndexUpdateEvent) => void;
export interface IndexUpdateEvent {
  type: 'upload' | 'delete' | 'like' | 'unlike' | 'rebuild' | 'batch-upload';
  fileName?: string;
  fileNames?: string[];
  timestamp: string;
  totalCount?: number;
  likedCount?: number;
}
class IndexSyncNotifier {
  private listeners: Set<IndexUpdateListener> = new Set();
  private lastUpdateTime: string = new Date().toISOString();
  addListener(listener: IndexUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  removeListener(listener: IndexUpdateListener): void {
    this.listeners.delete(listener);
  }
  notifyUpdate(event: Omit<IndexUpdateEvent, 'timestamp'>): void {
    const fullEvent: IndexUpdateEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    this.lastUpdateTime = fullEvent.timestamp;
    this.listeners.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('索引更新监听器执行失败:', error);
      }
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('index_update_event', JSON.stringify(fullEvent));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'index_update_event',
          newValue: JSON.stringify(fullEvent),
          storageArea: localStorage
        }));
      } catch (error) {
        console.warn('无法存储索引更新事件:', error);
      }
    }
    console.log('📋 索引更新通知:', fullEvent);
  }
  notifyUpload(fileName: string, totalCount?: number): void {
    this.notifyUpdate({
      type: 'upload',
      fileName,
      totalCount
    });
  }
  notifyBatchUpload(fileNames: string[], totalCount?: number): void {
    this.notifyUpdate({
      type: 'batch-upload',
      fileNames,
      totalCount
    });
  }
  notifyDelete(fileNames: string[], totalCount?: number): void {
    this.notifyUpdate({
      type: 'delete',
      fileNames,
      totalCount
    });
  }
  notifyLike(fileName: string, isLiked: boolean, likedCount?: number): void {
    this.notifyUpdate({
      type: isLiked ? 'like' : 'unlike',
      fileName,
      likedCount
    });
  }
  notifyRebuild(totalCount: number, likedCount: number): void {
    this.notifyUpdate({
      type: 'rebuild',
      totalCount,
      likedCount
    });
  }
  getLastUpdateTime(): string {
    return this.lastUpdateTime;
  }
  hasUpdatedSince(timestamp: string): boolean {
    return new Date(this.lastUpdateTime) > new Date(timestamp);
  }
  clearListeners(): void {
    this.listeners.clear();
  }
}
export const indexSyncNotifier = new IndexSyncNotifier();
export function addIndexUpdateListener(
  onUpdate: IndexUpdateListener
): () => void {
  const unsubscribe = indexSyncNotifier.addListener(onUpdate);
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'index_update_event' && event.newValue) {
      try {
        const updateEvent: IndexUpdateEvent = JSON.parse(event.newValue);
        onUpdate(updateEvent);
      } catch (error) {
        console.warn('解析索引更新事件失败:', error);
      }
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }
  return () => {
    unsubscribe();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
  };
}