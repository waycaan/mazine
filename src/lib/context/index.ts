'use client'

import { createContext, useContext, useState } from 'react'
import type { Note } from '@/types'

// 编辑器上下文接口
interface EditorContextType {
  content: string
  setContent: (content: string) => void
  currentNote: Note | null
  setCurrentNote: (note: Note | null) => void
}

// 创建编辑器上下文
const EditorContext = createContext<EditorContextType | undefined>(undefined)

// 编辑器上下文提供者
export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState('')
  const [currentNote, setCurrentNote] = useState<Note | null>(null)

  const value = {
    content,
    setContent,
    currentNote,
    setCurrentNote
  }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}

// 使用编辑器上下文的 Hook
export function useEditor(): EditorContextType {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}

// 导出 Context 以便其他地方可以直接使用
export { EditorContext } 