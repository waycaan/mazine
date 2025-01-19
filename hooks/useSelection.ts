import { useState, useCallback } from 'react'

export function useSelection<T extends string>() {
  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set())

  const toggleSelect = useCallback((item: T) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((items: T[]) => {
    setSelectedItems(new Set(items))
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const invertSelection = useCallback((allItems: T[]) => {
    setSelectedItems(prev => {
      const next = new Set(
        allItems.filter(item => !prev.has(item))
      )
      return next
    })
  }, [])

  return {
    selectedItems,
    toggleSelect,
    selectAll,
    deselectAll,
    invertSelection
  }
} 