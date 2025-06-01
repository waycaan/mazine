/**
 * S3数据结构迁移工具
 * 将现有的扁平化结构迁移到新的优化结构
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * 生成新的文件名格式：YYYY-MM-DD-randomId.ext
 */
function generateNewFileName(originalName) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const randomId = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  
  return `${dateStr}-${randomId}${ext}`;
}

/**
 * 创建图片元数据JSON
 */
function createImageMetadata(file, newFileName, originalName) {
  return {
    id: path.basename(newFileName, path.extname(newFileName)),
    originalName: originalName,
    fileName: newFileName,
    uploadTime: file.LastModified?.toISOString() || new Date().toISOString(),
    size: file.Size || 0,
    type: getContentType(newFileName),
    dimensions: {
      width: 0,
      height: 0
    },
    urls: {
      original: getPublicUrl(`images/${newFileName}`),
      thumbnail: getPublicUrl(`thumbs/${newFileName.replace(path.extname(newFileName), '.webp')}`)
    },
    metadata: {
      camera: null,
      location: null,
      tags: []
    },
    stats: {
      views: 0,
      downloads: 0
    },
    isLiked: false,
    likedAt: null,
    album: null
  };
}

/**
 * 获取文件的Content-Type
 */
function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 获取公共URL
 */
function getPublicUrl(key) {
  if (process.env.NEXT_PUBLIC_CDN) {
    return `${process.env.NEXT_PUBLIC_CDN.replace(/\/$/, '')}/${key}`;
  }
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
  return `${endpoint}/${BUCKET_NAME}/${key}`;
}

/**
 * 迁移单个图片文件
 */
async function migrateImageFile(file) {
  const oldKey = file.Key;
  const originalName = oldKey;
  
  // 跳过已经在新结构中的文件
  if (oldKey.startsWith('images/') || oldKey.startsWith('thumbs/') || 
      oldKey.startsWith('meta/') || oldKey.startsWith('collections/') || 
      oldKey.startsWith('.system/')) {
    console.log(`⏭️  跳过已迁移文件: ${oldKey}`);
    return null;
  }
  
  // 跳过likes目录中的文件（稍后处理）
  if (oldKey.startsWith('likes/')) {
    return null;
  }
  
  console.log(`🔄 迁移文件: ${oldKey}`);
  
  try {
    // 生成新文件名
    const newFileName = generateNewFileName(originalName);
    const newImageKey = `images/${newFileName}`;
    const newThumbKey = `thumbs/${newFileName.replace(path.extname(newFileName), '.webp')}`;
    const metaKey = `meta/${newFileName.replace(path.extname(newFileName), '.json')}`;
    
    // 获取原文件
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: oldKey
    });
    const originalObject = await s3Client.send(getCommand);
    
    // 获取原文件元数据
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: oldKey
    });
    const headResult = await s3Client.send(headCommand);
    
    // 上传到新位置
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: newImageKey,
      Body: originalObject.Body,
      ContentType: headResult.ContentType,
      ACL: 'public-read',
      Metadata: headResult.Metadata
    });
    await s3Client.send(putCommand);
    
    // 创建元数据文件
    const metadata = createImageMetadata(file, newFileName, originalName);
    const metaPutCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metaKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read'
    });
    await s3Client.send(metaPutCommand);
    
    console.log(`✅ 成功迁移: ${oldKey} -> ${newImageKey}`);
    
    return {
      oldKey,
      newKey: newImageKey,
      metaKey,
      metadata
    };
    
  } catch (error) {
    console.error(`❌ 迁移失败 ${oldKey}:`, error.message);
    return null;
  }
}

/**
 * 迁移收藏数据
 */
async function migrateLikesData(likedFiles, migratedFiles) {
  console.log('\n📋 迁移收藏数据...');
  
  const favorites = [];
  
  for (const likedFile of likedFiles) {
    const originalKey = likedFile.replace('likes/', '');
    const migratedFile = migratedFiles.find(f => f && f.oldKey === originalKey);
    
    if (migratedFile) {
      favorites.push({
        id: migratedFile.metadata.id,
        fileName: migratedFile.metadata.fileName,
        likedAt: new Date().toISOString()
      });
      
      // 更新元数据文件中的收藏状态
      migratedFile.metadata.isLiked = true;
      migratedFile.metadata.likedAt = new Date().toISOString();
      
      const updateMetaCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: migratedFile.metaKey,
        Body: JSON.stringify(migratedFile.metadata, null, 2),
        ContentType: 'application/json',
        ACL: 'public-read'
      });
      await s3Client.send(updateMetaCommand);
    }
  }
  
  // 创建收藏集合文件
  const favoritesCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: 'collections/favorites.json',
    Body: JSON.stringify(favorites, null, 2),
    ContentType: 'application/json',
    ACL: 'public-read'
  });
  await s3Client.send(favoritesCommand);
  
  console.log(`✅ 收藏数据迁移完成，共 ${favorites.length} 个收藏`);
}

/**
 * 创建系统配置文件
 */
async function createSystemFiles() {
  console.log('\n⚙️  创建系统配置文件...');
  
  const config = {
    version: '2.0.0',
    migrationDate: new Date().toISOString(),
    structure: 'optimized',
    features: {
      metadata: true,
      collections: true,
      albums: true,
      tags: true
    }
  };
  
  const configCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: '.system/config.json',
    Body: JSON.stringify(config, null, 2),
    ContentType: 'application/json',
    ACL: 'public-read'
  });
  await s3Client.send(configCommand);
  
  const stats = {
    totalImages: 0,
    totalSize: 0,
    lastUpdated: new Date().toISOString()
  };
  
  const statsCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: '.system/stats.json',
    Body: JSON.stringify(stats, null, 2),
    ContentType: 'application/json',
    ACL: 'public-read'
  });
  await s3Client.send(statsCommand);
  
  console.log('✅ 系统配置文件创建完成');
}

/**
 * 主迁移函数
 */
async function migrateS3Structure() {
  console.log('🚀 开始S3数据结构迁移...\n');
  
  try {
    // 列出所有文件
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1000
    });
    const result = await s3Client.send(listCommand);
    
    if (!result.Contents || result.Contents.length === 0) {
      console.log('📭 存储桶为空，无需迁移');
      return;
    }
    
    console.log(`📊 发现 ${result.Contents.length} 个文件`);
    
    // 分离图片文件和收藏文件
    const imageFiles = [];
    const likedFiles = [];
    
    for (const file of result.Contents) {
      if (file.Key.startsWith('likes/')) {
        likedFiles.push(file.Key);
      } else if (!file.Key.startsWith('thumbs/')) {
        imageFiles.push(file);
      }
    }
    
    console.log(`📸 图片文件: ${imageFiles.length} 个`);
    console.log(`❤️  收藏文件: ${likedFiles.length} 个\n`);
    
    // 迁移图片文件
    const migratedFiles = [];
    for (const file of imageFiles) {
      const result = await migrateImageFile(file);
      if (result) {
        migratedFiles.push(result);
      }
    }
    
    // 迁移收藏数据
    if (likedFiles.length > 0) {
      await migrateLikesData(likedFiles, migratedFiles);
    }
    
    // 创建系统文件
    await createSystemFiles();
    
    console.log('\n🎉 迁移完成！');
    console.log(`✅ 成功迁移 ${migratedFiles.length} 个图片文件`);
    console.log(`✅ 成功迁移 ${likedFiles.length} 个收藏记录`);
    console.log('\n⚠️  请手动验证迁移结果后，删除旧文件');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  }
}

// 运行迁移
if (require.main === module) {
  migrateS3Structure();
}

module.exports = { migrateS3Structure };
