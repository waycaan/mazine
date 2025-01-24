'use client'

import { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { extensions, editorProps } from '@/lib/editor'
import { ArrowUp, Download, Save } from 'lucide-react'
import { useNoteStore } from '@/lib/store/note'

// 编辑器组件
export default function Editor() {
  const { currentNote, updateNote } = useNoteStore()

  // 自动保存处理
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      if (!currentNote) return

      const content = editor.getHTML()
      const firstLine = editor.getText().split('\n')[0]
      
      // 更新笔记内容和标题
      updateNote({
        id: currentNote.id,
        content,
        title: firstLine || '无标题',
      })
    },
    [currentNote, updateNote]
  )

  // 初始化编辑器
  const editor = useEditor({
    extensions,
    editorProps,
    onUpdate: handleUpdate,
  })

  // 同步编辑器内容
  useEffect(() => {
    if (editor && currentNote) {
      if (editor.getText() !== currentNote.content) {
        editor.commands.setContent(currentNote.content)
      }
    }
  }, [editor, currentNote])

  if (!editor || !currentNote) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* 顶栏 */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <h1 className="text-xl font-medium truncate">{currentNote.title}</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleUpdate({ editor })}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground"
          >
            <Save className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const content = editor.getHTML()
              const blob = new Blob([content], { type: 'text/html' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${currentNote.title}.html`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 编辑器内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
} 