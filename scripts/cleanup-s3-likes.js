/**
 * 清理S3中的收藏标记文件
 * 
 * 这个脚本用于清理S3中likes/目录下的所有标记文件，
 * 因为现在收藏状态完全由JSON文件管理。
 * 
 * 使用方法：
 * node scripts/cleanup-s3-likes.js
 */

const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || ''
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});

const bucketName = process.env.S3_BUCKET_NAME;

async function cleanupLikesFiles() {
  console.log('🧹 开始清理S3中的收藏标记文件...');

  if (!bucketName) {
    console.error('❌ 错误：未设置S3_BUCKET_NAME环境变量');
    process.exit(1);
  }

  try {
    // 列出所有likes/目录下的文件
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'likes/',
      MaxKeys: 1000
    });

    const response = await s3Client.send(listCommand);
    const likesFiles = response.Contents || [];

    if (likesFiles.length === 0) {
      console.log('✅ 没有找到需要清理的收藏标记文件');
      return;
    }

    console.log(`📊 找到 ${likesFiles.length} 个收藏标记文件`);

    // 确认是否继续
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question(`⚠️  确定要删除这 ${likesFiles.length} 个收藏标记文件吗？(y/N): `, resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ 操作已取消');
      return;
    }

    // 批量删除文件
    const deleteObjects = likesFiles.map(file => ({ Key: file.Key }));
    
    // S3批量删除限制为1000个对象
    const batchSize = 1000;
    let deletedCount = 0;

    for (let i = 0; i < deleteObjects.length; i += batchSize) {
      const batch = deleteObjects.slice(i, i + batchSize);
      
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: batch,
          Quiet: false
        }
      });

      const deleteResponse = await s3Client.send(deleteCommand);
      
      if (deleteResponse.Deleted) {
        deletedCount += deleteResponse.Deleted.length;
        console.log(`🗑️  已删除 ${deleteResponse.Deleted.length} 个文件`);
      }

      if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
        console.error('❌ 删除过程中出现错误:');
        deleteResponse.Errors.forEach(error => {
          console.error(`  - ${error.Key}: ${error.Message}`);
        });
      }
    }

    console.log(`✅ 清理完成！共删除 ${deletedCount} 个收藏标记文件`);
    console.log('📋 现在收藏状态完全由JSON文件管理');

  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行清理脚本
if (require.main === module) {
  cleanupLikesFiles().catch(console.error);
}

module.exports = { cleanupLikesFiles };
