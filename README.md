# 6Tea - 笔记应用

一个现代化的笔记应用，支持文件夹管理、Markdown 编辑、实时保存等功能。

## 功能特点

- 📁 文件夹管理（创建、删除、重命名）
- 📝 笔记编辑（支持 Markdown）
- 🔄 实时自动保存
- 🌓 深色/浅色主题切换
- 🗑️ 回收站功能
- 🔍 全文搜索
- 📱 响应式设计

## 技术栈

- Next.js 14
- React 18
- Prisma
- PostgreSQL
- TipTap
- Zustand
- Tailwind CSS
- Radix UI

## 部署指南

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/6tea.git
   cd 6tea
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   在 Vercel 中添加以下环境变量：
   - `DATABASE_URL`: PostgreSQL 数据库连接 URL

4. 部署到 Vercel：
   ```bash
   vercel
   ```

## 本地开发

1. 复制 `.env.example` 到 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 更新环境变量

3. 运行开发服务器：
   ```bash
   npm run dev
   ```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000) 