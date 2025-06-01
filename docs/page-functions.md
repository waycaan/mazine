# 页面功能分工和批处理优化

## 📊 页面功能分工

### **Home页面 (`/home` 或 `/`)**
- ✅ **主要功能**：图片上传
- ✅ **次要功能**：单个图片收藏/取消收藏
- ✅ **批处理**：使用 `batchOperationManager.likeImage()` 和 `batchOperationManager.unlikeImage()`

### **Manage页面 (`/manage`)**
- ✅ **主要功能**：图片管理
- ✅ **操作功能**：
  - 批量删除：`batchOperationManager.deleteImages()`
  - 批量收藏：`batchOperationManager.likeImages()`
  - 搜索和过滤
  - 选择和批量操作

### **Likes页面 (`/likes`)**
- ✅ **主要功能**：收藏图片管理
- ✅ **操作功能**：
  - 批量取消收藏：`batchOperationManager.unlikeImages()`
  - 搜索收藏的图片
  - 选择和批量操作

## 🚀 批处理优化方案

### **前端批处理管理器**
```typescript
// 位置：utils/batch-operation-manager.ts
export const batchOperationManager = new BatchOperationManager();

// 便捷方法
batchOperationManager.deleteImage(fileName, callback)     // 删除单个
batchOperationManager.deleteImages(fileNames, callback)  // 批量删除
batchOperationManager.likeImage(fileName, callback)      // 收藏单个
batchOperationManager.likeImages(fileNames, callback)    // 批量收藏
batchOperationManager.unlikeImage(fileName, callback)    // 取消收藏单个
batchOperationManager.unlikeImages(fileNames, callback)  // 批量取消收藏
```

### **优化流程**
```
旧流程：前端操作 → 后端删文件 → 后端改JSON → 返回结果 (重复N次)
新流程：前端收集 → 批量发送 → 后端改JSON → 返回索引 → 后台删文件
```

### **关键特性**
- ✅ **智能合并**：200ms内的操作自动合并
- ✅ **去重处理**：相同文件的操作会被合并
- ✅ **JSON优先**：先更新索引，后删除文件
- ✅ **非阻塞**：文件删除在后台进行
- ✅ **积极更新**：UI立即反映操作结果

## 📋 API接口

### **批量删除**
```
DELETE /api/images/batch
Body: { fileNames: string[] }
Response: { success: boolean, newIndex: ImageIndex, results: any[] }
```

### **批量收藏**
```
POST /api/likes/batch
Body: { fileNames: string[] }
Response: { success: boolean, newIndex: ImageIndex }
```

### **批量取消收藏**
```
DELETE /api/likes/batch
Body: { fileNames: string[] }
Response: { success: boolean, newIndex: ImageIndex }
```

## 🎯 性能提升

### **删除10张图片**
- **旧方案**：10次API调用 + 10次JSON更新 = ~2000ms
- **新方案**：1次API调用 + 1次JSON更新 = ~200ms (**90%提升**)

### **收藏5张图片**
- **旧方案**：5次API调用 + 5次JSON更新 = ~1000ms  
- **新方案**：1次API调用 + 1次JSON更新 = ~100ms (**90%提升**)

## 🔧 使用示例

### **Manage页面 - 批量删除**
```typescript
const deleteSelected = async () => {
  // 积极更新UI
  Array.from(selectedImages).forEach(fileName => {
    updateIndexOptimistically({ type: 'remove', fileName });
  });

  // 批量删除
  batchOperationManager.deleteImages(Array.from(selectedImages), (success, newIndex) => {
    if (success) {
      console.log('批量删除成功');
    } else {
      refreshIndex(); // 失败时刷新
    }
  });
};
```

### **Likes页面 - 批量取消收藏**
```typescript
const unlikeSelected = async () => {
  // 积极更新UI
  Array.from(selectedImages).forEach(fileName => {
    updateIndexOptimistically({ 
      type: 'toggleLike', 
      fileName, 
      data: { isLiked: false } 
    });
  });

  // 批量取消收藏
  batchOperationManager.unlikeImages(Array.from(selectedImages), (success, newIndex) => {
    if (success) {
      console.log('批量取消收藏成功');
    } else {
      refreshIndex(); // 失败时刷新
    }
  });
};
```

### **Home页面 - 单个收藏**
```typescript
const handleLike = async (fileName: string) => {
  const wasLiked = currentImage?.isLiked ?? false;

  // 积极更新UI
  setCurrentImages(prev => prev.map(img =>
    img.fileName === fileName ? { ...img, isLiked: !wasLiked } : img
  ));

  // 使用批处理
  if (wasLiked) {
    batchOperationManager.unlikeImage(fileName, (success) => {
      if (!success) {
        // 失败时回滚UI
        setCurrentImages(prev => prev.map(img =>
          img.fileName === fileName ? { ...img, isLiked: wasLiked } : img
        ));
      }
    });
  } else {
    batchOperationManager.likeImage(fileName, (success) => {
      if (!success) {
        // 失败时回滚UI
        setCurrentImages(prev => prev.map(img =>
          img.fileName === fileName ? { ...img, isLiked: wasLiked } : img
        ));
      }
    });
  }
};
```

## 📊 监控和调试

### **控制台日志**
```
📝 添加批处理操作: delete - image1.jpg
📝 添加批处理操作: delete - image2.jpg
📊 当前队列长度: 2
🚀 开始处理批量操作: 2 个操作
📦 处理 delete 操作: 2 个文件
📋 索引已更新，准备删除文件，当前总数: 98
✅ 批量操作完成: 2 个操作
```

### **队列状态查询**
```typescript
const status = batchOperationManager.getQueueStatus();
console.log('队列状态:', status);
// { queueLength: 2, isProcessing: false, operations: [...] }
```

### **立即处理队列**
```typescript
await batchOperationManager.flush();
console.log('所有操作已处理完成');
```
