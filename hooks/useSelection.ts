/**
 * Copyright 2024 waycaan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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