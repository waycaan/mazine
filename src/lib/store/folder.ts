'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { StateCreator } from 'zustand/vanilla'
import type { Folder } from '@/types'
import { prisma } from '@/lib/db'

// 文件夹状态接口
interface FolderState {
  folders: Folder[]
  currentFolder: Folder | null
  isLoading: boolean
  error: string | null
  // 操作方法
  fetchFolders: () => Promise<void>
  createFolder: (parentId: string | null) => Promise<void>
  updateFolder: (folder: Partial<Folder> & { id: string }) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  setCurrentFolder: (folder: Folder | null) => void
  reorderFolders: (folders: Folder[]) => Promise<void>
}

type FolderStoreWithDevtools = StateCreator<
  FolderState,
  [['zustand/devtools', never]]
>

// 创建文件夹状态管理
export const useFolderStore = create<FolderState>()(
  devtools(
    ((set, get) => ({
      folders: [],
      currentFolder: null,
      isLoading: false,
      error: null,

      // 获取所有文件夹
      fetchFolders: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/folders')
          const data = await response.json()
          set({ folders: data, isLoading: false })
        } catch (error) {
          set({ error: '获取文件夹失败', isLoading: false })
        }
      },

      // 创建新文件夹
      createFolder: async (parentId) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId })
          })
          const newFolder = await response.json()
          set(state => ({
            folders: [...state.folders, newFolder],
            currentFolder: newFolder,
            isLoading: false,
          }))
        } catch (error) {
          set({ error: '创建文件夹失败', isLoading: false })
        }
      },

      // 更新文件夹
      updateFolder: async (folder) => {
        const { currentFolder } = get()
        if (!currentFolder) return

        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/folders/${folder.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(folder)
          })
          const updatedFolder = await response.json()
          set(state => ({
            folders: state.folders.map(f => f.id === updatedFolder.id ? updatedFolder : f),
            currentFolder: state.currentFolder?.id === updatedFolder.id ? updatedFolder : state.currentFolder,
            isLoading: false,
          }))
        } catch (error) {
          set({ error: '更新文件夹失败', isLoading: false })
        }
      },

      // 删除文件夹
      deleteFolder: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await fetch(`/api/folders/${id}`, {
            method: 'DELETE'
          })
          set(state => ({
            folders: state.folders.filter(f => f.id !== id),
            currentFolder: state.currentFolder?.id === id ? null : state.currentFolder,
            isLoading: false,
          }))
        } catch (error) {
          set({ error: '删除文件夹失败', isLoading: false })
        }
      },

      // 设置当前文件夹
      setCurrentFolder: (folder) => {
        set({ currentFolder: folder })
      },

      // 重新排序文件夹
      reorderFolders: async (folders) => {
        set({ isLoading: true, error: null })
        try {
          const updates = folders.map((folder, index) => ({
            id: folder.id,
            order: index
          }))
          
          await Promise.all(
            updates.map(update => 
              fetch(`/api/folders/${update.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update)
              })
            )
          )
          
          set({ folders })
        } catch (error) {
          set({ error: '重新排序失败', isLoading: false })
        }
      },
    })) as FolderStoreWithDevtools,
    { name: 'folder-store' }
  )
) 