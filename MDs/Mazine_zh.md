# Mazine  
[English](readme.md) · [简体中文](/MDs/Mazine_zh.md)

Mazine 是一个基于 **Next.js 14** 和对象存储服务构建的 **Serverless 现代图床应用**，具有以下特点：  

- **无需数据库管理**：无需再担心数据库丢失而导致图床失效。  
- **代码托管**：项目代码托管在 **GitHub**，并部署到 **Vercel** 上运行。  
- **环境变量管理**：密码和相关环境变量需手动填写到 Vercel 中，确保敏感信息安全。  

### CDN 安全性与推荐配置
由于通过开源代码处理 CDN 存在较高的密码泄露风险，因此本项目不会添加任何CDN转化代码。建议采用以下方式管理 CDN：  
1. **R2 自定义子域名**：通过配置 R2 的专用域名实现安全访问。  
2. **Cloudflare Worker**：利用 Cloudflare Worker 实现高效的 CDN 加速和处理。  
3. **Alist S3 CDN 功能**：借助 Alist 集成功能轻松实现 CDN 化。  

## 特性

- 🚀 基于 Next.js 14 App Router
- 📦 支持多种对象存储（S3、alist等）
- 🎨 响应式设计 + 暗色模式
- 🔒 简单的密码保护
- 📋 一键复制多种格式（URL、Markdown、BBCode）
- 💾 图片压缩和 WebP 转换
- 🖼️ 支持网格视图和时间轴视图，卡片式管理和预览。
- ❤️ 图片收藏功能
- 🔍 图片搜索功能

## [Take a look in YouTube](https://youtu.be/SAv8wK-1I6s?si=fii0mtWhbZO6IM5T)



![home_1.webp](/MDs/home_1.webp)

![manage_1.webp](/MDs/manage_1.webp)

![manage_2.webp](/MDs/manage_2.webp)



---

### [Q&A](/MDs/Declaration.md) — [简体中文](/MDs/Declaration_zh.md)

---



## 部署

### Fork 这个仓库

然后点击下面的 deploy按钮



### Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fimage-hosting)



## 使用 R2

本项目开发和测试均基于CloudFlare R2作为存储桶，其他S3存储桶尚未测试
如果使用R2作为存储后端，配置示例：

[R2-setting-guide](/MDs/R2-setting.md)

\`\`\`env
S3_REGION=APAC
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
NEXT_PUBLIC_CDN=xxx.r2.dev or 自定义域名
NEXT_PUBLIC_LANGUAGE=EN
\`\`\`

## 待开发功能

Alist S3适配
其他 S3适配
适配手机上传功能（仅上传页面，保留图片收藏功能，不含管理和收藏页面）
docker部署
cloudflare worker版本（更完整，但受限于worker的政策，我还是再等待看看）

### 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- AWS SDK for JavaScript v3



---

###  **商业用途限制**   

本项目代码及相关资源仅供个人或非商业性使用，严禁任何形式的商业用途。未经版权所有者明确书面许可，禁止将本代码用于任何盈利或商业活动，包括但不限于产品开发、服务提供、商业推广等。 

---

### **未经许可禁止发布**   

本项目的源代码、文档及所有相关资源不得以任何形式由第三方机构或公司在未经版权所有者许可的情况下公开、发布、传播或分享。特别地，**禁止将本项目发布到 MSDN 或任何其他类似的平台**，无论是部分代码还是整体项目。

---


## 许可声明

本项目采用 Apache License 2.0 许可证，您可以自由使用、修改和分发本项目，但请保留原作者的版权声明。

###### 老子就因为这种人特意搞这些版权，被[恶心](https://www.nodeseek.com/post-231322-1)到了！

---

## 免责声明
本项目不主动采集用户隐私数据，图片存储完全由用户的对象存储服务管理，开发者对其隐私性不负责任。

本项目为开源软件，开发者不对任何因使用本软件导致的直接或间接损失负责。用户应自行确保在其国家或地区的使用符合相关法律法规。

本项目严禁用于任何违法行为或侵犯第三方版权的用途，使用者需自行承担因不当使用产生的法律责任。

本项目提供的服务不保证完全无误，使用者需自行承担使用本项目所带来的风险。作者不对因使用本项目而导致的任何损失或损害负责。



---