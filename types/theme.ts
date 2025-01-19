export type ThemeMode = 'light' | 'dark'

export interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => void
}

export interface ThemeProviderProps {
  children: React.ReactNode
} 