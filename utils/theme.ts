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