import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: '6Tea - 笔记应用',
  description: '一个现代化的笔记应用，支持文件夹管理、Markdown 编辑、实时保存等功能。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* 主容器，设置全屏和溢出隐藏 */}
          <main className="flex h-screen overflow-hidden bg-background">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
} 