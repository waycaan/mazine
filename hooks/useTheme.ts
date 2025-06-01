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

import { useState, useEffect } from 'react'import { getStoredTheme, setStoredTheme } from '@/utils/theme'function getThemeFromCookie(): 'light' | 'dark' | null {  if (typeof document === 'undefined') return null  const match = document.cookie.match(/theme=([^;]+)/)  return match ? (match[1] as 'light' | 'dark') : null}export function useTheme() {  const [isDarkMode, setIsDarkMode] = useState(false)  useEffect(() => {    const cookieTheme = getThemeFromCookie()    if (cookieTheme) {      setIsDarkMode(cookieTheme === 'dark')      setStoredTheme(cookieTheme)    } else {      const savedTheme = getStoredTheme()      if (savedTheme === 'dark') {        setIsDarkMode(true)      }    }  }, [])  const toggleTheme = () => {    setIsDarkMode(prev => {      const newTheme = !prev      const themeValue = newTheme ? 'dark' : 'light'      setStoredTheme(themeValue)      if (typeof document !== 'undefined') {        document.cookie = `theme=${themeValue}; path=/; max-age=31536000`       }      return newTheme    })  }  return {    isDarkMode,    toggleTheme  }}