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

interface BatchOperation {
  type: 'delete' | 'like' | 'unlike';
  fileName: string;
  timestamp: number;
}
interface BatchRequest {
  operations: BatchOperation[];
  callback?: (success: boolean, newIndex?: any) => void;
}
class BatchOperationManager {
  private operationQueue: BatchOperation[] = [];
  private pendingCallbacks: Array<(success: boolean, newIndex?: any) => void> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly BATCH_DELAY = 0; 
  private readonly MAX_BATCH_SIZE = 50; 
  addOperation(
    type: 'delete' | 'like' | 'unlike',
    fileName: string,
    callback?: (success: boolean, newIndex?: any) => void
  ): void {
    const existingIndex = this.operationQueue.findIndex(
      op => op.fileName === fileName
    );
    if (existingIndex !== -1) {
      const existingOp = this.operationQueue[existingIndex];
      if (existingOp.type === 'delete') {
        console.warn(`⚠️ 文件 ${fileName} 已在删除队列中，忽略新的 ${type} 操作`);
        if (callback) {
          this.pendingCallbacks.push(callback);
        }
        return;
      }
      if (type === 'delete') {
        console.log(`🗑️ 删除操作覆盖现有操作: ${existingOp.type} -> ${type} (${fileName})`);
        this.operationQueue[existingIndex] = {
          type,
          fileName,
          timestamp: Date.now()
        };
      } else {
        this.operationQueue[existingIndex] = {
          type,
          fileName,
          timestamp: Date.now()
        };
      }
    } else {
      this.operationQueue.push({
        type,
        fileName,
        timestamp: Date.now()
      });
    }
    if (callback) {
      this.pendingCallbacks.push(callback);
    }
    console.log(`📝 添加批处理操作: ${type} - ${fileName}`);
    console.log(`📊 当前队列长度: ${this.operationQueue.length}`);
    this.scheduleBatch();
  }
  private scheduleBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    if (this.operationQueue.length >= this.MAX_BATCH_SIZE) {
      this.processBatch();
      return;
    }
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }
    this.isProcessing = true;
    const operations = [...this.operationQueue];
    const callbacks = [...this.pendingCallbacks];
    this.operationQueue = [];
    this.pendingCallbacks = [];
    console.log(`🚀 开始处理批量操作: ${operations.length} 个操作`);
    try {
      const groupedOps = this.groupOperationsByType(operations);
      let finalIndex: any = null;
      for (const [type, fileNames] of Object.entries(groupedOps)) {
        if (fileNames.length === 0) continue;
        console.log(`📦 处理 ${type} 操作: ${fileNames.length} 个文件`);
        const result = await this.sendBatchRequest(type as any, fileNames);
        if (result.success) {
          finalIndex = result.newIndex;
        } else {
          throw new Error(result.error || `${type} 操作失败`);
        }
      }
      callbacks.forEach(callback => callback(true, finalIndex));
      console.log(`✅ 批量操作完成: ${operations.length} 个操作`);
    } catch (error) {
      console.error('❌ 批量操作失败:', error);
      callbacks.forEach(callback => callback(false));
    } finally {
      this.isProcessing = false;
    }
  }
  private groupOperationsByType(operations: BatchOperation[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {
      delete: [],
      like: [],
      unlike: []
    };
    operations.forEach(op => {
      if (!groups[op.type]) {
        groups[op.type] = [];
      }
      if (!groups[op.type].includes(op.fileName)) {
        groups[op.type].push(op.fileName);
      }
    });
    if (groups.delete.length > 0) {
      groups.like = groups.like.filter(fileName => !groups.delete.includes(fileName));
      groups.unlike = groups.unlike.filter(fileName => !groups.delete.includes(fileName));
      console.log(`🗑️ 删除操作优先，清理冲突操作: 删除${groups.delete.length}个文件`);
    }
    return groups;
  }
  private async sendBatchRequest(
    type: 'delete' | 'like' | 'unlike',
    fileNames: string[]
  ): Promise<{ success: boolean; newIndex?: any; error?: string }> {
    try {
      let url: string;
      let method: string;
      switch (type) {
        case 'delete':
          url = '/api/images/batch';
          method = 'DELETE';
          break;
        case 'like':
          url = '/api/likes/batch';
          method = 'POST';
          break;
        case 'unlike':
          url = '/api/likes/batch';
          method = 'DELETE';
          break;
        default:
          throw new Error(`未知操作类型: ${type}`);
      }
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileNames })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return {
        success: result.success,
        newIndex: result.newIndex,
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '请求失败'
      };
    }
  }
  flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.operationQueue.length === 0) {
        resolve();
        return;
      }
      this.pendingCallbacks.push(() => {
        resolve();
      });
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      this.processBatch();
    });
  }
  getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    operations: BatchOperation[]
  } {
    return {
      queueLength: this.operationQueue.length,
      isProcessing: this.isProcessing,
      operations: [...this.operationQueue]
    };
  }
  deleteImage(fileName: string, callback?: (success: boolean, newIndex?: any) => void): void {
    this.addOperation('delete', fileName, callback);
  }
  likeImage(fileName: string, callback?: (success: boolean, newIndex?: any) => void): void {
    this.addOperation('like', fileName, callback);
  }
  unlikeImage(fileName: string, callback?: (success: boolean, newIndex?: any) => void): void {
    this.addOperation('unlike', fileName, callback);
  }
  deleteImages(fileNames: string[], callback?: (success: boolean, newIndex?: any) => void): void {
    fileNames.forEach((fileName, index) => {
      this.addOperation('delete', fileName, index === 0 ? callback : undefined);
    });
  }
  likeImages(fileNames: string[], callback?: (success: boolean, newIndex?: any) => void): void {
    fileNames.forEach((fileName, index) => {
      this.addOperation('like', fileName, index === 0 ? callback : undefined);
    });
  }
  unlikeImages(fileNames: string[], callback?: (success: boolean, newIndex?: any) => void): void {
    fileNames.forEach((fileName, index) => {
      this.addOperation('unlike', fileName, index === 0 ? callback : undefined);
    });
  }
}
export const batchOperationManager = new BatchOperationManager();
export type { BatchOperation };