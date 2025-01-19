import { useState, useEffect } from 'react'
import { getStoredTheme, setStoredTheme } from '@/utils/theme'

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = getStoredTheme()
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev
      setStoredTheme(newTheme ? 'dark' : 'light')
      return newTheme
    })
  }

  return {
    isDarkMode,
    toggleTheme
  }
} 