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

import { useState, useEffect } from 'react'
import { getStoredTheme, setStoredTheme } from '@/utils/theme'
function getThemeFromCookie(): 'light' | 'dark' | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/theme=([^;]+)/)
  return match ? (match[1] as 'light' | 'dark') : null
}
export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  useEffect(() => {
    const cookieTheme = getThemeFromCookie()
    if (cookieTheme) {
      setIsDarkMode(cookieTheme === 'dark')
      setStoredTheme(cookieTheme)
    } else {
      const savedTheme = getStoredTheme()
      if (savedTheme === 'dark') {
        setIsDarkMode(true)
      }
    }
  }, [])
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev
      const themeValue = newTheme ? 'dark' : 'light'
      setStoredTheme(themeValue)
      if (typeof document !== 'undefined') {
        document.cookie = `theme=${themeValue}; path=/; max-age=31536000` 
      }
      return newTheme
    })
  }
  return {
    isDarkMode,
    toggleTheme
  }
}