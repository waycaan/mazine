'use client'

import type { ReactElement } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import FileList from '@/components/layout/FileList'
import Editor from '@/components/layout/Editor'
import { EditorProvider } from '@/lib/context'

export default function Home(): ReactElement {
  return (
    <EditorProvider>
      <main className="flex h-screen">
        {/* 第一层：侧边栏 */}
        <Sidebar />
        {/* 第二层：文件列表 */}
        <FileList />
        {/* 第三层：编辑器 */}
        <Editor />
      </main>
    </EditorProvider>
  )
} 