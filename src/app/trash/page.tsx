'use client'

import { useState, useEffect } from 'react'
import { Folder, File, Trash2, RefreshCw } from 'lucide-react'
import { useNoteStore } from '@/lib/store/note'
import { useFolderStore } from '@/lib/store/folder'

// 定义类型
type DeletedFolder = {
  type: 'folder'
  id: string
  name: string
  deleted: boolean
  deletedAt: Date | null
  // ... 其他文件夹属性
}

type DeletedNote = {
  type: 'note'
  id: string
  title: string
  content: string
  deleted: boolean
  deletedAt: Date | null
  // ... 其他笔记属性
}

type DeletedItem = DeletedFolder | DeletedNote

export default function TrashPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  const { 
    notes, 
    fetchNotes,
    updateNote,
    deleteNote 
  } = useNoteStore()

  const { 
    folders,
    fetchFolders,
    updateFolder,
    deleteFolder
  } = useFolderStore()

  // 获取已删除的项目
  const deletedItems: DeletedItem[] = [
    ...folders
      .filter((folder): folder is NonNullable<typeof folder> => folder.deleted)
      .map(folder => ({ ...folder, type: 'folder' as const })),
    ...notes
      .filter((note): note is NonNullable<typeof note> => note.deleted)
      .map(note => ({ ...note, type: 'note' as const }))
  ]

  // 初始化数据
  useEffect(() => {
    fetchFolders()
    fetchNotes()
  }, [fetchFolders, fetchNotes])

  // 处理选择
  const handleSelect = (id: string, event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey || event.ctrlKey) {
      setSelectedIds(prev => 
        prev.includes(id) 
          ? prev.filter(selectedId => selectedId !== id)
          : [...prev, id]
      )
    } else {
      setSelectedIds([id])
    }
  }

  // 恢复选中项
  const handleRestore = () => {
    selectedIds.forEach(id => {
      const item = deletedItems.find(item => item.id === id)
      if (!item) return

      if (item.type === 'folder') {
        updateFolder({
          id: item.id,
          deleted: false,
          deletedAt: null,
        })
      } else {
        updateNote({
          id: item.id,
          deleted: false,
          deletedAt: null,
        })
      }
    })
    setSelectedIds([])
  }

  // 永久删除选中项
  const handleDelete = () => {
    selectedIds.forEach(id => {
      const item = deletedItems.find(item => item.id === id)
      if (!item) return

      if (item.type === 'folder') {
        deleteFolder(item.id)
      } else {
        deleteNote(item.id)
      }
    })
    setSelectedIds([])
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* 顶栏 */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <h1 className="text-xl font-medium">回收站</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRestore}
            disabled={selectedIds.length === 0}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={selectedIds.length === 0}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 已删除项目列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {deletedItems.map(item => (
            <div
              key={item.id}
              className={`
                flex items-center p-2 rounded-lg cursor-pointer
                ${selectedIds.includes(item.id) ? 'bg-accent' : 'hover:bg-accent/50'}
              `}
              onClick={(e) => handleSelect(item.id, e)}
            >
              {item.type === 'folder' ? (
                <Folder className="w-4 h-4 mr-2" />
              ) : (
                <File className="w-4 h-4 mr-2" />
              )}
              <span className="truncate">
                {item.type === 'folder' ? item.name : item.title}
              </span>
              <span className="ml-auto text-sm text-muted-foreground">
                {new Date(item.deletedAt!).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 