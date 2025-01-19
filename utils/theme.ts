const THEME_KEY = 'theme'

export function getStoredTheme(): 'light' | 'dark' | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null
}

export function setStoredTheme(theme: 'light' | 'dark') {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_KEY, theme)
}

export function isDarkTheme(): boolean {
  return getStoredTheme() === 'dark'
} 