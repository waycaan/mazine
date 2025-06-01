#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 手动加载 .env.local 文件
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
  console.log('⚠️  无法读取 .env.local 文件');
  process.exit(1);
}

console.log('🔐 密码验证工具\n');

const storedHash = process.env.AUTH_PASSWORD_HASH;
const username = process.env.AUTH_USERNAME;

if (!storedHash) {
  console.log('❌ 未找到 AUTH_PASSWORD_HASH 环境变量');
  process.exit(1);
}

if (!username) {
  console.log('❌ 未找到 AUTH_USERNAME 环境变量');
  process.exit(1);
}

console.log(`👤 用户名: ${username}`);
console.log(`🔑 存储的密码哈希: ${storedHash.substring(0, 20)}...`);

// 测试一些常见密码
const testPasswords = [
  'admin',
  'password', 
  '123456',
  'chenryace',
  'mazine',
  'test123'
];

console.log('\n🧪 测试常见密码:');
testPasswords.forEach(password => {
  const isValid = bcrypt.compareSync(password, storedHash);
  console.log(`${isValid ? '✅' : '❌'} "${password}": ${isValid ? '匹配' : '不匹配'}`);
});

console.log('\n💡 如果您知道正确的密码，可以手动测试:');
console.log('请输入您的密码 (输入后按回车):');

process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    const password = chunk.trim();
    if (password) {
      const isValid = bcrypt.compareSync(password, storedHash);
      console.log(`\n${isValid ? '✅' : '❌'} 密码 "${password}": ${isValid ? '正确！' : '错误'}`);
      
      if (!isValid) {
        console.log('\n🔧 生成新的密码哈希:');
        const newHash = bcrypt.hashSync(password, 11);
        console.log(`新的哈希值: ${newHash}`);
        console.log('请将此哈希值更新到 .env.local 文件中的 AUTH_PASSWORD_HASH');
      }
      
      process.exit(0);
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});
