# Mazine Vercel 部署指南

## 📋 必需环境变量

根据代码分析，以下是 Mazine 项目在 Vercel 部署时需要配置的所有环境变量：

### 🔐 认证配置
```bash
# 登录用户名和密码（必需）
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_password
```

### ☁️ S3/R2 存储配置
```bash
# S3/R2 基本配置（必需）
S3_REGION=auto                    # Cloudflare R2 使用 "auto"
S3_ACCESS_KEY=your_access_key     # S3/R2 访问密钥
S3_SECRET_KEY=your_secret_key     # S3/R2 密钥
S3_BUCKET_NAME=your_bucket_name   # 存储桶名称
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com  # S3/R2 端点

# S3 路径样式（可选）
S3_FORCE_PATH_STYLE=true          # Cloudflare R2 建议设为 true
```

### 🌐 CDN 配置（可选）
```bash
# CDN 域名（可选，用于加速图片访问）
NEXT_PUBLIC_CDN=https://your-cdn-domain.com
```

### 🔧 运行环境
```bash
# Node.js 环境（Vercel 自动设置）
NODE_ENV=production
```

## 🚀 Vercel 部署步骤

### 1. 准备工作

#### 1.1 GitHub 仓库
确保您的代码已推送到 GitHub 仓库。

#### 1.2 Cloudflare R2 设置
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 创建 R2 存储桶
3. 获取 API 令牌和端点信息
4. 配置 CORS 策略（参考 `MDs/R2-setting.md`）

### 2. Vercel 部署

#### 2.1 导入项目
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 从 GitHub 导入您的仓库
4. 选择 "Next.js" 框架预设

#### 2.2 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

**Settings → Environment Variables**

| 变量名 | 值 | 环境 |
|--------|----|----|
| `AUTH_USERNAME` | 您的登录用户名 | Production, Preview, Development |
| `AUTH_PASSWORD` | 您的登录密码 | Production, Preview, Development |
| `S3_REGION` | `auto` | Production, Preview, Development |
| `S3_ACCESS_KEY` | R2 访问密钥 | Production, Preview, Development |
| `S3_SECRET_KEY` | R2 密钥 | Production, Preview, Development |
| `S3_BUCKET_NAME` | R2 存储桶名称 | Production, Preview, Development |
| `S3_ENDPOINT` | R2 端点 URL | Production, Preview, Development |
| `S3_FORCE_PATH_STYLE` | `true` | Production, Preview, Development |
| `NEXT_PUBLIC_CDN` | CDN 域名（可选） | Production, Preview, Development |

#### 2.3 部署配置
确保 `vercel.json` 配置正确：

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "regions": ["iad1"]
}
```

### 3. 部署验证

#### 3.1 构建检查
- 确保构建成功完成
- 检查构建日志中是否有错误

#### 3.2 功能测试
1. **登录测试**：访问 `/login` 页面测试认证
2. **上传测试**：测试图片上传功能
3. **图片访问**：验证图片可以正常显示
4. **管理功能**：测试图片管理和收藏功能

## 🔧 常见问题

### Q1: 构建失败
**问题**：部署时构建失败
**解决**：
1. 检查所有必需环境变量是否已设置
2. 确保 R2 存储桶已创建且可访问
3. 验证 API 密钥权限

### Q2: 图片无法显示
**问题**：图片上传成功但无法显示
**解决**：
1. 检查 R2 存储桶的公共访问设置
2. 验证 CORS 配置
3. 确认 `NEXT_PUBLIC_CDN` 配置（如果使用）

### Q3: 登录失败
**问题**：无法登录系统
**解决**：
1. 确认 `AUTH_USERNAME` 和 `AUTH_PASSWORD` 设置正确
2. 检查环境变量是否在所有环境中都已设置

### Q4: 会话问题
**问题**：登录后会话不稳定
**解决**：
- Vercel 无服务器环境不支持文件会话存储
- 系统已使用 Iron Session 进行会话管理
- 确保 cookie 设置正确

## 📝 环境变量示例

```bash
# .env.local 示例（本地开发用）
AUTH_USERNAME=admin
AUTH_PASSWORD=your_secure_password
S3_REGION=auto
S3_ACCESS_KEY=your_r2_access_key
S3_SECRET_KEY=your_r2_secret_key
S3_BUCKET_NAME=mazine-images
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=true
NEXT_PUBLIC_CDN=https://your-custom-domain.com
NODE_ENV=development
```

## 🔒 安全建议

1. **密码安全**：使用强密码作为 `AUTH_PASSWORD`
2. **密钥管理**：定期轮换 R2 API 密钥
3. **访问控制**：限制 R2 存储桶的公共访问范围
4. **HTTPS**：确保使用 HTTPS 访问应用
5. **环境隔离**：生产和开发环境使用不同的存储桶

## 📚 相关文档

- [Cloudflare R2 设置指南](../MDs/R2-setting.md)
- [项目功能说明](../MDs/Mazine_zh.md)
- [API 文档](../docs/page-functions.md)

## 🆘 获取帮助

如果遇到部署问题：
1. 检查 Vercel 构建日志
2. 查看浏览器开发者工具的网络和控制台
3. 参考项目 [GitHub Issues](https://github.com/waycaan/mazine/issues)
