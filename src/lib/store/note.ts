'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { StateCreator } from 'zustand/vanilla'
import type { Note } from '@/types'
import { prisma } from '@/lib/db'

// 笔记状态接口
interface NoteState {
  notes: Note[]
  currentNote: Note | null
  isLoading: boolean
  error: string | null
  // 操作方法
  fetchNotes: () => Promise<void>
  createNote: (folderId: string | null) => Promise<void>
  updateNote: (note: Partial<Note> & { id: string }) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  setCurrentNote: (note: Note | null) => void
}

type NoteStoreWithDevtools = StateCreator<
  NoteState,
  [['zustand/devtools', never]]
>

// 创建笔记状态管理
export const useNoteStore = create<NoteState>()(
  devtools(
    ((set, get) => ({
      notes: [],
      currentNote: null,
      isLoading: false,
      error: null,

      // 获取所有笔记
      fetchNotes: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/notes')
          const data = await response.json()
          set({ notes: data, isLoading: false })
        } catch (error) {
          set({ error: '获取笔记失败', isLoading: false })
        }
      },

      // 创建新笔记
      createNote: async (folderId: string | null) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderId })
          })
          const newNote = await response.json()
          set((state) => ({
            notes: [...state.notes, newNote],
            currentNote: newNote,
            isLoading: false,
          }))
        } catch (error) {
          set({ error: '创建笔记失败', isLoading: false })
        }
      },

      // 更新笔记
      updateNote: async (note: Partial<Note> & { id: string }) => {
        const { currentNote } = get()
        if (!currentNote) return

        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
          })
          const updatedNote = await response.json()
          set((state) => ({
            notes: state.notes.map((n) => n.id === updatedNote.id ? updatedNote : n),
            currentNote: state.currentNote?.id === updatedNote.id ? updatedNote : state.currentNote,
            isLoading: false,
          }))
        } catch (error) {
          set({ error: '更新笔记失败', isLoading: false })
        }
      },

      // 删除笔记
      deleteNote: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          await fetch(`/api/notes/${id}`, {
            method: 'DELETE'
          })
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
            currentNote: state.currentNote?.id === id ? null : state.currentNote,
            isLoading: false,
          }))
        } catch (error) {
          set({ error: '删除笔记失败', isLoading: false })
        }
      },

      // 设置当前笔记
      setCurrentNote: (note: Note | null) => {
        set({ currentNote: note })
      },
    })) as NoteStoreWithDevtools,
    { name: 'note-store' }
  )
) 