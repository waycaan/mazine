/**
 * 初始化图片索引脚本
 * 用于首次部署或重建索引
 */

const { imageIndexManager } = require('../utils/image-index-manager');

async function initializeIndex() {
  console.log('🚀 开始初始化图片索引...\n');
  
  try {
    // 检查现有索引
    console.log('📋 检查现有索引...');
    const existingIndex = await imageIndexManager.getIndex();
    
    if (existingIndex) {
      console.log(`📊 发现现有索引: ${existingIndex.totalCount} 张图片`);
      console.log(`📅 最后更新: ${existingIndex.lastUpdated}`);
      
      const answer = await askQuestion('是否要重建索引？(y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('✅ 保持现有索引');
        return;
      }
    }
    
    // 重建索引
    console.log('\n🔄 重建图片索引...');
    const newIndex = await imageIndexManager.rebuildIndex();
    
    console.log('\n✅ 索引初始化完成！');
    console.log(`📊 总图片数: ${newIndex.totalCount}`);
    console.log(`❤️  收藏数: ${newIndex.likedCount}`);
    console.log(`📅 更新时间: ${newIndex.lastUpdated}`);
    
    // 显示统计信息
    const stats = await imageIndexManager.getStats();
    console.log('\n📈 统计信息:');
    console.log(`- 总图片: ${stats.totalImages}`);
    console.log(`- 收藏图片: ${stats.likedImages}`);
    console.log(`- 总大小: ${formatBytes(stats.totalSize)}`);
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 询问用户输入
 */
function askQuestion(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// 运行初始化
if (require.main === module) {
  initializeIndex();
}

module.exports = { initializeIndex };
