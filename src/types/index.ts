export type Note = {
  id: string
  title: string
  content: string
  folderId: string | null
  order: number
  deleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type Folder = {
  id: string
  name: string
  parentId: string | null
  order: number
  deleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type DragItem = {
  id: string
  type: 'folder' | 'note'
  index: number
} 