#!/usr/bin/env node

const bcrypt = require('bcryptjs');

console.log('🔐 密码哈希生成工具\n');

// 生成一些常用密码的哈希
const commonPasswords = [
  'admin123',
  'password123', 
  'mazine123',
  'chenryace123',
  '123456789'
];

console.log('📋 常用密码及其哈希值:');
console.log('=' * 50);

commonPasswords.forEach(password => {
  const hash = bcrypt.hashSync(password, 11);
  console.log(`密码: ${password}`);
  console.log(`哈希: ${hash}`);
  console.log('-'.repeat(50));
});

console.log('\n💡 建议使用 "admin123" 作为临时密码');
console.log('对应的哈希值已在上面显示');
console.log('\n🔧 要更新密码，请将对应的哈希值复制到 .env.local 文件中的 AUTH_PASSWORD_HASH');
