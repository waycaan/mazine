# Mazine  
[English](readme.md) · [简体中文](/MDs/Mazine_zh.md)

Mazine 是一个基于 **Next.js 14** 和对象存储服务构建的 **Serverless 现代图床应用**，具有以下特点：  

- **无需数据库管理**：无需再担心数据库丢失而导致图床失效。  
- **代码托管**：项目代码托管在 **GitHub**，并部署到 **cfpage** 上运行。  
- **环境变量管理**：密码和相关环境变量需手动填写到 cfpage 中，确保敏感信息安全。  

# 再次更新(最终版)

- 修改为支持worker page部署,下载上传速度更快，改为使用json加载数据文本的方案，优化function调用次数更少。（除了上传和加载列表外，通常都不会调用，R2出站免费）

- 页面修改为自定压缩率，而不是之前的锁定压缩率。

![s1.png](/MDs/s1.png)
# 重大更新-----[✈️see the updates ](https://www.bilibili.com/video/BV11cTLzpEmi/?share_source=copy_web&vd_source=374d45a7e4cafee012b1f00c94c3d023)

## 5月31日（废话少说，这是一个在原有 UI 基础上重新构建的全新项目，重构了代码结构，优化了验证机制，并改进了界面设计。）

- 验证机制升级：已弃用繁琐的 JWT 方案，改为更高效且更契合当前架构的验证方式，提升了安全性与响应速度。

- 半屏 UI 优化：界面交互更贴合用户使用习惯，操作体验更加顺畅自然。

- 数据管理全面重构：采用全新架构，大幅减少对后端（Vercel Function）的调用次数，响应速度提升数倍。即使在 Vercel 部署环境下，体验也几乎媲美本地运行。

- 加载与缓存逻辑优化：重构加载机制，增强数据缓存策略，更好地适配新的数据管理方案，进一步提升系统整体性能与稳定性。

- 统计与通知增强：新增更多图床使用统计与通知，帮助用户更全面地掌握上传与管理情况。控制台（F12）也将提供简洁反馈，便于快速诊断和了解当前状态。

### 5个月前

- 已加强登录验证，采用加密密码hash，以及随机JWT保存到cookies来访问验证。
- 改进缓存加载策略，尽量提高反馈速度。

### CDN 安全性与推荐配置

由于通过开源代码处理 CDN 存在较高的密码泄露风险，因此本项目不会添加任何CDN转化代码。建议采用以下方式管理 CDN：  

1. **R2 自定义子域名**：通过配置 R2 的专用域名实现安全访问。  

2. **Cloudflare Worker**：利用 Cloudflare Worker 实现高效的 CDN 加速和处理。  

   

## 特性

- 🚀 基于 Next.js 14 App Router
- 📦 支持R2对象存储
- 🎨 响应式设计 + 暗色模式
- 🔒 简单的密码保护
- 📋 一键复制多种格式（URL、Markdown、BBCode）
- 💾 图片压缩和 WebP 转换
- 🖼️ 支持网格视图和时间轴视图，卡片式管理和预览。
- ❤️ 图片收藏功能
- 🔍 图片搜索功能

## [✈️Take a look on YouTube](https://youtu.be/sdJEfDgE-yw?si=FvmTRFBZTk5P2CTf)



![home_1.webp](/MDs/home_1.webp)

![manage_1.webp](/MDs/manage_1.webp)

![manage_2.webp](/MDs/manage_2.webp)


---

### [Q&A☑️](/MDs/Declaration.md) — [中文✅](/MDs/Declaration_zh.md)

---



## 部署

---

### 1.Fork 这个仓库

---

### 2.使用 R2

配置示例：

### [✡️R2-setting-guide, click here!!!!!](/MDs/R2-setting.md)

CF page构建

#### 1.先fork仓库

#### 2.CF page绑定仓库

![CF1.png](/MDs/CF1.png)

#### 3.填充构建命令

![CF2.png](/MDs/CF2.png)

```
Build command: npm run pages:build
Build output:.vercel/output/static
```

*不要尝试在构建时填充任何变量，实测没用*

*部署完后会全清掉，CF的问题*

等待3分钟部署

部署成功后，进入setting，找到variable再进行添加

![](/MDs/CF3.png)

![](/MDs/CF4.png)

#### 4.填充变量

| 变量                 | 值                       |
| -------------------- | ------------------------ |
| NEXT_PUBLIC_LANGUAGE | zh                       |
| S3_ACCESS_KEY        | your-access-key          |
| S3_SECRET_KEY        | your-secret-key          |
| S3_BUCKET_NAME       | your-bucket              |
| S3_ENDPOINT          | https://bucket-endpoint  |
| S3_REGION            | APAC                     |
| S3_FORCE_PATH_STYLE  | true                     |
| AUTH_USERNAME        | admin/whatever           |
| AUTH_PASSWORD        | your-password            |
| NEXT_PUBLIC_CDN      | xxx.r2.dev or 自定义域名 |



#### 5. redeploy即可。





---

### ~~3.vercel部署~~ 暂时抛弃

#### ~~- 将这个forked的仓库导入到vercel里面~~

![vercel_2.png](MDs/vercel_2.png)

![vercel_3.png](MDs/vercel_3.png)

#### ~~- 设置好你的环境变量~~

![vercel_1.png](MDs/vercel_1.png)

#### ~~- 点击deploy 并等待3分钟！~~

#### ~~- 搞掂!!~~

---

## 待开发功能

---

Alist S3适配

其他 S3适配

---

### 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- AWS SDK for JavaScript v3



---

### **未经许可禁止在其他平台发布**   

本项目的源代码、文档及所有相关资源不得以任何形式由第三方机构或公司在未经版权所有者许可的情况下公开、发布、传播或分享。特别地，**禁止将本项目发布到 CSDN 或任何其他类似的平台**，无论是部分代码还是整体项目。

---


## 许可声明

本项目采用 Apache License 2.0 许可证，您可以自由使用、修改和分发本项目，但请保留原作者的版权声明负责。



---
