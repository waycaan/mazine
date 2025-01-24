'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { File } from 'lucide-react'
import { useNoteStore } from '@/lib/store/note'
import { useFolderStore } from '@/lib/store/folder'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 搜索结果类型
type SearchResult = {
  id: string
  title: string
  content: string
  path: string
  type: 'note'
  matches: { text: string; highlight: boolean }[]
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const { notes } = useNoteStore()
  const { folders } = useFolderStore()

  // 搜索处理
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchResults: SearchResult[] = notes
      .filter(note => {
        const content = note.content.toLowerCase()
        const title = note.title.toLowerCase()
        const searchTerm = query.toLowerCase()
        return content.includes(searchTerm) || title.includes(searchTerm)
      })
      .map(note => {
        // 获取文件路径
        const getPath = (note: any): string => {
          const folder = folders.find(f => f.id === note.folderId)
          if (!folder) return note.title
          return `${folder.name} / ${note.title}`
        }

        // 获取匹配的文本片段
        const getMatches = (content: string): { text: string; highlight: boolean }[] => {
          const searchTerm = query.toLowerCase()
          const words = content.split(/\s+/)
          const matches: { text: string; highlight: boolean }[] = []
          let foundMatch = false

          for (let i = 0; i < words.length; i++) {
            const word = words[i]
            if (word.toLowerCase().includes(searchTerm)) {
              foundMatch = true
              // 添加前后文
              const start = Math.max(0, i - 3)
              const end = Math.min(words.length, i + 4)
              if (start > 0) matches.push({ text: '... ', highlight: false })
              for (let j = start; j < end; j++) {
                matches.push({
                  text: words[j] + ' ',
                  highlight: j === i,
                })
              }
              if (end < words.length) matches.push({ text: '...', highlight: false })
              break
            }
          }

          if (!foundMatch) {
            matches.push({ text: content.slice(0, 100) + '...', highlight: false })
          }

          return matches
        }

        return {
          id: note.id,
          title: note.title,
          content: note.content,
          path: getPath(note),
          type: 'note' as const,
          matches: getMatches(note.content),
        }
      })

    setResults(searchResults)
  }, [query, notes, folders])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border bg-background shadow-lg">
              {/* 搜索输入框 */}
              <div className="flex items-center border-b px-4">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索笔记..."
                  className="h-14 flex-1 border-0 bg-transparent focus-visible:ring-0"
                />
              </div>

              {/* 搜索结果 */}
              <ScrollArea className="h-[50vh] p-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="mb-4 rounded-lg border p-4 hover:bg-accent"
                  >
                    <div className="mb-2 flex items-center">
                      <File className="mr-2 h-4 w-4" />
                      <span className="font-medium">{result.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.path}
                    </div>
                    <div className="mt-2 text-sm">
                      {result.matches.map((match, index) => (
                        <span
                          key={index}
                          className={match.highlight ? 'bg-yellow-200 dark:bg-yellow-800' : ''}
                        >
                          {match.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
} 