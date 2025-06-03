# What You Seek is Seeking You

This project is built upon the excellent open-source project [Notea](https://github.com/notea-org/notea), and fully complies with its MIT license. It introduces a series of improvements and refinements based on the original architecture, making it more suitable for deployment on [Vercel](https://vercel.com), especially in combination with [Neon](https://neon.tech)'s PostgreSQL database service.

## 🌟 Project Highlights

- ✍️ Switched the editor to [Tiptap](https://tiptap.dev) for a true WYSIWYG editing experience.

- 🧠 Retained support for / markdown command shortcuts and right-click floating markdown syntax menu.

- 💾 Switched to manual saving mode.

- ⚙️ Refactored the upload and loading logic to align with the new editor and save strategy, reducing unnecessary function calls and improving performance.

- 🧱 Maintained the original borderless note page layout.

- 🔐 Preserved the original authentication and encryption mechanism.

- 🔁 Kept the original note management and sharing logic.

- 🖼️ Removed local image upload support. All images are rendered using markdown image links, resulting in a more Typora-like experience.

- 📦 For image upload and hosting, you can refer to my original project [Mazine](https://github.com/waycaan/mazine).

## 🚀 Deployment (Recommended: Vercel + Neon)

> For best performance, please use the Neon database in Washington, D.C., USA (East). Since most users deploy on Vercel's free plan (with servers based in the U.S.), using this region ensures the lowest latency.

### 1. Fork This Repository

Click the Fork button on the top right to copy the project into your GitHub account.

### 2. Import into Vercel

Sign in to [Vercel](https://vercel.com), click Import Project, and select your newly forked repository.

### 3. Set Environment Variables

Go to Settings > Environment Variables in your Vercel project and add the following:

| Variable Name | Description or Example |

|-----------------------|----------------------------------------|

| DATABASE_URL | Your PostgreSQL connection string from Neon |

| PASSWORD | Set your own login password |

| PRELOAD_NOTES_COUNT | 10 (number of notes to preload) |

### 4. Deploy

Click Deploy to start the deployment. The initial setup takes about 2 minutes. Once complete, your note app is ready to use.

---

## 📝 License

This project is based on [Notea](https://github.com/notea-org/notea), and follows the terms of the MIT License. All original copyright statements are retained.

Huge thanks to the original author for making it open-source.

---

If you're looking for feature expansion, UI customization, or commercial deployment solutions, feel free to contact the author.

Although the original project has been discontinued, I've always wanted to bring it back — simply because it's elegant.

However, I believe using S3 as the core storage solution was a fundamental design flaw. S3 isn't well-suited for frequent modifications or file renaming, and the implementation varies across different object storage providers. Because of this, I chose not to submit a PR to the original repo, but instead rewrote and restructured the project independently.

All redesign concepts in this project are entirely my own. That said, I did use AI tools to assist with development where the technical complexity exceeded my current personal capabilities.

I originally wanted to call this project newnotea, but it didn’t feel elegant enough. So I named it Motea — keeping all the original icons untouched, as a tribute to the original project, and to my own youth.
