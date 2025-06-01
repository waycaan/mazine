#!/usr/bin/env node

// 手动加载 .env.local 文件
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=');
      }
    }
  });
} catch (error) {
  console.log('⚠️  无法读取 .env.local 文件，将使用系统环境变量');
}

console.log('🔍 验证环境变量配置...\n');

const requiredVars = [
  'JWT_SECRET',
  'AUTH_USERNAME',
  'AUTH_PASSWORD',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_BUCKET_NAME'
];

const optionalVars = [
  'NEXT_PUBLIC_CDN',
  'NEXT_PUBLIC_LANGUAGE'
];

let hasErrors = false;

// 检查必需变量
console.log('📋 必需的环境变量:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: 未设置`);
    hasErrors = true;
  } else {
    // 对敏感信息进行脱敏显示
    let displayValue = value;
    if (varName.includes('SECRET') || varName.includes('KEY') || varName.includes('HASH')) {
      displayValue = value.substring(0, 8) + '...';
    }
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n📋 可选的环境变量:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚪ ${varName}: 未设置 (可选)`);
  }
});

// 特殊验证
console.log('\n🔐 安全性检查:');

// JWT_SECRET 长度检查
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  if (jwtSecret.length < 32) {
    console.log('⚠️  JWT_SECRET 长度不足32字符，建议使用更长的密钥');
  } else {
    console.log('✅ JWT_SECRET 长度符合要求');
  }

  if (jwtSecret === 'default-secret') {
    console.log('❌ JWT_SECRET 使用了默认值，存在安全风险');
    hasErrors = true;
  }
}

// CDN URL 格式检查
const cdnUrl = process.env.NEXT_PUBLIC_CDN;
if (cdnUrl && !cdnUrl.startsWith('http')) {
  console.log('⚠️  NEXT_PUBLIC_CDN 应该是完整的URL格式 (http:// 或 https://)');
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ 环境变量验证失败，请检查上述错误');
  process.exit(1);
} else {
  console.log('✅ 环境变量验证通过，可以启动应用');
}
