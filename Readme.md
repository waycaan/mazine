# 念念不忘，必有回响

本项目基于优秀的开源项目 [Notea](https://github.com/notea-org/notea)，遵循其 MIT 协议。我们在原有架构基础上进行了一系列优化与调整，使其更适合部署在 [Vercel](https://vercel.com) 平台上，特别是结合 [Neon](https://neon.tech) 提供的 PostgreSQL 数据库服务。

## 🌟 项目亮点

- ✍️ 替换编辑器为 [Tiptap](https://tiptap.dev)，提供所见即所得的编辑体验；
- 🧠 保留 `/` 快捷语法调用与右键 Markdown 浮动菜单支持；
- 💾 修改为手动保存模式；
- ⚙️ 针对编辑器与保存机制重构上传/加载逻辑，减少函数调用，提升性能；
- 🧱 保留无边界的笔记页面结构；
- 🔐 延续原项目的加密认证与权限控制逻辑；
- 🔁 保留笔记管理与共享机制；
- 🖼️ 去除本地图片上传，采用 Markdown 图片链接渲染方式，编辑体验更接近 Typora；
- 📦 如需图床支持，可参考我的另一个原创项目 [Mazine](https://github.com/waycaan/mazine)。

## 🚀 部署方式（推荐 Vercel + Neon）

> 为获得最佳体验，请使用 **Neon 数据库 Washington, D.C., USA (East)** 区域节点。因大部分用户使用 Vercel 免费计划（主机位于美国），使用该节点可获得最低延迟。

### 1. Fork 本项目

点击右上角 `Fork`，将项目复制到你的 GitHub 账户下。

### 2. 导入至 Vercel

登录 [Vercel](https://vercel.com)，点击 `Import Project`，选择刚刚 Fork 的仓库。

### 3. 设置环境变量

在 Vercel 项目的 `Settings > Environment Variables` 页面，添加以下变量：

| 变量名              | 示例值或说明                      |
|---------------------|----------------------------------|
| `DATABASE_URL`      | Neon 提供的 PostgreSQL 连接地址 |
| `PASSWORD`          | 登录密码（任意设置）            |
| `PRELOAD_NOTES_COUNT` | `10`（预加载笔记条数）        |

### 4. 部署

点击 `Deploy` 开始部署，初次部署大约需 **2 分钟**。完成后即可访问。

---

## 📝 协议

本项目基于 [Notea](https://github.com/notea-org/notea) 开源项目开发，遵循其 MIT License。原始版权声明已完整保留，感谢原作者的开源贡献。

---

