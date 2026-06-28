# Mazine

[English](readme.md) · [简体中文](/MDs/Mazine_zh.md)

Mazine is a **Serverless modern image hosting application** built on **Next.js 14** and object storage services, with the following features:

- **No database management**: No longer worry about database failures causing image hosting to go down.
- **Code Hosting**: The project code is hosted on **GitHub** and deployed to **Vercel**.
- **Environment Variable Management**: Passwords and related environment variables must be manually added to Vercel to ensure the security of sensitive information.

# 🚀🚀Major Update🚀🚀----[✈️see the updates ](https://www.bilibili.com/video/BV11cTLzpEmi/?share_source=copy_web&vd_source=374d45a7e4cafee012b1f00c94c3d023)

## May 31

**🚀In short, this is essentially a brand-new project built upon the foundation of the previous UI — with a restructured codebase, improved authentication, and refined UI design.**

- **Authentication Upgrade**: The cumbersome JWT-based method has been deprecated in favor of a more efficient and architecture-aligned authentication approach, improving both security and response speed.

- **Half-Screen UI Optimization**: The interface interactions have been refined to better match user habits, offering a smoother and more intuitive experience.

- **Complete Overhaul of Data Management**: A brand-new architecture significantly reduces backend (Vercel Function) calls, resulting in response speeds several times faster. Even under Vercel deployment, the performance now closely matches local execution.

- **Optimized Loading and Caching Logic**: Loading mechanisms have been restructured and caching strategies enhanced to better support the new data management logic, boosting overall system performance and stability.

- **Enhanced Statistics and Notifications**: More detailed statistics and notifications regarding image hosting usage have been added, giving users better insight into uploads and management. The developer console (F12) now also provides concise feedback for quicker diagnostics.


  
### CDN Security and Recommended Configuration

Due to the high risk of password leaks when handling CDN through open-source code, this project does not include any CDN conversion code. It is recommended to manage the CDN using the following methods:

1. **R2 Custom Subdomain**: Secure access by configuring a dedicated R2 subdomain.
2. **Cloudflare Worker**: Use Cloudflare Worker for efficient CDN acceleration and processing.
3. **Alist S3 CDN Functionality**: Leverage Alist integration for easy CDN implementation.

## Features

- 🚀 Based on Next.js 14 App Router
- 📦 Supports multiple object storage services (S3, Alist, etc.)
- 🎨 Responsive design + dark mode
- 🔒 Simple password protection
- 📋 One-click copy in multiple formats (URL, Markdown, BBCode)
- 💾 Image compression and WebP conversion
- 🖼️ Supports grid view and timeline view, card-style management and preview
- ❤️ Image favorites functionality
- 🔍 Image search feature
- ✍️ **Typora Integration**: Paste images directly into Typora for auto-upload

## [✈️Take a look on YouTube](https://youtu.be/sdJEfDgE-yw?si=FvmTRFBZTk5P2CTf)

![home_1.webp](/MDs/home_1.webp)

![manage_1.webp](/MDs/manage_1.webp)

![manage_2.webp](/MDs/manage_2.webp)

---

### [Q&A☑️](/MDs/Declaration.md) — [中文✅](/MDs/Declaration_zh.md)

---

## Deployment

### 1. Fork this repository

### 2. Set Environment Variables

#### Login

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_USERNAME` | ✅ | Login username |
| `AUTH_PASSWORD` | ✅ | Login password (also used for session encryption) |

#### S3 Storage

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_REGION` | ✅ | Bucket region (e.g., `auto`) |
| `S3_ACCESS_KEY` | ✅ | S3 access key |
| `S3_SECRET_KEY` | ✅ | S3 secret key |
| `S3_ENDPOINT` | ✅ | S3 endpoint URL |
| `S3_BUCKET_NAME` | ✅ | Bucket name |
| `S3_FORCE_PATH_STYLE` | Optional | Set to `true` for some S3 providers |

#### Optional

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CDN` | Optional | Custom CDN domain |
| `NEXT_PUBLIC_LANGUAGE` | Optional | UI language (`EN` or `ZH`) |
| `UPLOAD_API_KEY` | Optional | API key for Typora upload |

> **Tip**: Generate a random API Key for `UPLOAD_API_KEY` at https://generate-secret.vercel.app/32

### 3. Configure R2 / S3 Storage

This project is developed and tested using Cloudflare R2 as the storage bucket, and other S3 buckets have not been tested.  
If using R2 as the storage backend, the configuration example is:

[✡️R2-setting-guide, click here!!!!!](/MDs/R2-setting.md)

### 3. Deploy to Vercel

#### Import the repository to Vercel

![vercel_2.png](/MDs/vercel_2.png)

![vercel_3.png](/MDs/vercel_3.png)

#### Setup your Environment Variables

![vercel_1.png](/MDs/vercel_1.png)

#### Deploy and enjoy!

---

## Typora Integration

Mazine supports Typora image upload. When you paste an image in Typora, it automatically uploads to your Mazine instance.

📖 **详细配置教程**: [Typora-Setup.md](/MDs/Typora-Setup.md)

### Quick Setup

1. **Generate API Key** at https://generate-secret.vercel.app/32

2. **Add Environment Variable** in Vercel:
   ```
   UPLOAD_API_KEY=your-generated-api-key
   ```

3. **Configure Typora**:
   - Open Typora → Preferences → Image
   - Select "Upload Image"
   - Configure as follows:
     - **Upload Service**: Custom
     - **Upload Service URL**: `https://your-vercel-app.vercel.app/api/upload/simple`
     - **Upload Method**: POST
     - **Request Headers**: `Authorization: Bearer YOUR_API_KEY`
     - **Request Body**: `file`
     - **Image URL**: `${url}`

4. **Test**: Paste any image into Typora, it should upload automatically

### How It Works

- Typora sends the image to `/api/upload/simple`
- The API validates your API key
- The image is uploaded to your S3/R2 storage
- The public URL is returned to Typora
- Typora replaces the local image with the hosted URL

---

## To-Do Features

- Alist S3 integration
- Other S3 integrations
- Mobile upload functionality (only the upload page, preserving image favorites feature, excluding management and favorites pages)
- Docker deployment
- Cloudflare Worker version (more complete, but subject to worker policy; waiting for updates)

### Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- AWS SDK for JavaScript v3

------

### **⚠️ Prohibited: No Unauthorized Reproduction or Redistribution**

**This project is strictly prohibited from being published, reproduced, distributed, or shared on any other platform without explicit written permission from the copyright holder (waycaan).**

This includes but is not limited to:
- Publishing source code, documentation, tutorials, or screenshots on blogs, forums, or social media (including CSDN, Juejin, Zhihu, WeChat Official Accounts, etc.)
- Uploading to code hosting platforms other than the official repository (GitHub)
- Incorporating into commercial products or services without authorization
- Creating derivative works for public distribution without consent

**Violators will be subject to legal action under applicable copyright and intellectual property laws.**

------

## Apache License 2.0

This project is licensed under the **Apache License 2.0**. You may use, modify, and distribute this project in compliance with the license terms, provided that:

1. You retain the original copyright notice
2. You include a copy of the Apache License 2.0
3. You indicate any modifications made to the original code
4. You do **NOT** publish or redistribute this project on any other platform without explicit permission from the copyright holder

------

## Disclaimer

This project does not actively collect user privacy data. Image storage is fully managed by the user's object storage service, and the developer is not responsible for its privacy.

This project is open-source software, and the developer is not responsible for any direct or indirect loss caused by the use of this software. Users must ensure that their use complies with relevant laws and regulations in their country or region.

This project is strictly prohibited from being used for any illegal activities or infringing on third-party copyrights. Users bear the legal responsibility for improper use.

The services provided by this project are not guaranteed to be error-free. Users must assume the risks associated with using this project. The author is not responsible for any losses or damages caused by using this project.
