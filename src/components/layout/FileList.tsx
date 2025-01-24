'use client'

import { useState, useEffect } from 'react'
import type { DragDropContextProps, DropResult, DraggableProvided, DroppableProvided } from '@hello-pangea/dnd'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Folder, File, Plus } from 'lucide-react'
import { useNoteStore } from '@/lib/store/note'
import { useFolderStore } from '@/lib/store/folder'
import type { Note, Folder as FolderType } from '@/types'

// 文件列表组件
export default function FileList() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // 获取状态
  const { 
    folders, 
    currentFolder,
    fetchFolders, 
    createFolder, 
    reorderFolders,
    setCurrentFolder 
  } = useFolderStore()
  
  const { 
    notes, 
    currentNote,
    fetchNotes, 
    createNote,
    updateNote,
    setCurrentNote 
  } = useNoteStore()

  // 初始化数据
  useEffect(() => {
    fetchFolders()
    fetchNotes()
  }, [fetchFolders, fetchNotes])

  // 处理拖拽结束
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.source.droppableId === result.destination.droppableId && result.source.index === result.destination.index) {
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    const type = result.type

    if (type === 'folder') {
      // 处理文件夹拖拽
      const newFolders = Array.from(folders)
      const [movedFolder] = newFolders.splice(sourceIndex, 1)
      newFolders.splice(destinationIndex, 0, movedFolder)
      reorderFolders(newFolders)
    } else if (type === 'note') {
      // 处理笔记拖拽
      const sourceDroppableId = result.source.droppableId
      const destinationDroppableId = result.destination.droppableId
      
      // 获取目标文件夹ID
      const getTargetFolderId = (droppableId: string) => {
        if (droppableId === 'root-notes') return null
        if (droppableId.startsWith('folder-')) {
          return droppableId.replace('folder-', '')
        }
        return null
      }

      const sourceFolderId = getTargetFolderId(sourceDroppableId)
      const destinationFolderId = getTargetFolderId(destinationDroppableId)

      // 获取相关笔记列表
      const sourceNotes = notes.filter(note => note.folderId === sourceFolderId)
      const destinationNotes = notes.filter(note => note.folderId === destinationFolderId)

      // 移动笔记
      const [movedNote] = sourceNotes.splice(sourceIndex, 1)
      const updatedNote = {
        ...movedNote,
        folderId: destinationFolderId,
      }

      // 更新所有受影响笔记的顺序
      const reorderedNotes = [
        ...sourceNotes.map((note, index) => ({
          ...note,
          order: index,
        })),
        ...destinationNotes.map((note, index) => ({
          ...note,
          order: index >= destinationIndex ? index + 1 : index,
        })),
        {
          ...updatedNote,
          order: destinationIndex,
        },
      ]

      // 批量更新笔记
      reorderedNotes.forEach(note => {
        updateNote(note)
      })
    }
  }

  // 处理选择
  const handleSelect = (id: string, type: 'folder' | 'note', event: React.MouseEvent<HTMLDivElement>) => {
    // 如果是拖拽操作，不触发选择
    if ((event.target as HTMLElement).closest('[data-rbd-draggable-context-id]')) {
      return
    }
    
    if (event.shiftKey || event.ctrlKey) {
      // 多选逻辑
      setSelectedIds(prev => 
        prev.includes(id) 
          ? prev.filter(selectedId => selectedId !== id)
          : [...prev, id]
      )
    } else {
      // 单选逻辑
      setSelectedIds([id])
      if (type === 'folder') {
        const folder = folders.find(f => f.id === id)
        setCurrentFolder(folder || null)
      } else {
        const note = notes.find(n => n.id === id)
        setCurrentNote(note || null)
      }
    }
  }

  // 获取当前文件夹的笔记
  const getCurrentFolderNotes = () => {
    return notes
      .filter(note => note.folderId === currentFolder?.id)
      .sort((a, b) => a.order - b.order)
  }

  return (
    <div className={`w-64 h-full border-r bg-background flex flex-col ${isExpanded ? '' : 'hidden'}`}>
      {/* 顶部按钮 */}
      <div className="p-4 flex justify-between items-center border-b">
        <div className="space-x-2">
          <button 
            onClick={() => createFolder(currentFolder?.id ?? null)}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-2">新建文件夹</span>
          </button>
          <button 
            onClick={() => createNote(currentFolder?.id ?? null)}
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground"
          >
            <File className="w-4 h-4" />
            <span className="ml-2">新建笔记</span>
          </button>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          {/* 文件夹列表 */}
          <Droppable droppableId="folder-list" type="folder">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="p-2 space-y-1"
              >
                {folders.map((folder, index) => (
                  <Draggable 
                    key={folder.id} 
                    draggableId={folder.id} 
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          flex items-center p-2 rounded-lg cursor-pointer
                          ${selectedIds.includes(folder.id) ? 'bg-accent' : 'hover:bg-accent/50'}
                          ${currentFolder?.id === folder.id ? 'border border-accent' : ''}
                        `}
                        onClick={(e) => handleSelect(folder.id, 'folder', e)}
                      >
                        <Folder className="w-4 h-4 mr-2" />
                        <span className="truncate">{folder.name}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* 笔记列表 */}
          <Droppable 
            droppableId={currentFolder ? `folder-${currentFolder.id}` : 'root-notes'} 
            type="note"
          >
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="p-2 space-y-1"
              >
                {getCurrentFolderNotes().map((note, index) => (
                  <Draggable 
                    key={note.id} 
                    draggableId={note.id} 
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          flex items-center p-2 rounded-lg cursor-pointer
                          ${selectedIds.includes(note.id) ? 'bg-accent' : 'hover:bg-accent/50'}
                          ${currentNote?.id === note.id ? 'border border-accent' : ''}
                        `}
                        onClick={(e) => handleSelect(note.id, 'note', e)}
                      >
                        <File className="w-4 h-4 mr-2" />
                        <span className="truncate">{note.title}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
} 