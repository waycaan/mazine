/*
 * MIT License
 * 
 * Copyright (c) 2024 waycaan
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { useState, useCallback } from 'react'export function useSelection<T extends string>() {  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set())  const toggleSelect = useCallback((item: T) => {    setSelectedItems(prev => {      const next = new Set(prev)      if (next.has(item)) {        next.delete(item)      } else {        next.add(item)      }      return next    })  }, [])  const selectAll = useCallback((items: T[]) => {    setSelectedItems(new Set(items))  }, [])  const deselectAll = useCallback(() => {    setSelectedItems(new Set())  }, [])  const invertSelection = useCallback((allItems: T[]) => {    setSelectedItems(prev => {      const next = new Set(        allItems.filter(item => !prev.has(item))      )      return next    })  }, [])  return {    selectedItems,    toggleSelect,    selectAll,    deselectAll,    invertSelection  }}