'use client'
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

import { createContext, useContext } from 'react'
import en from './locales/en'
import zh from './locales/zh'

type Locale = 'en' | 'zh'
type Translations = typeof en

// 从环境变量获取语言设置，默认为中文
const DEFAULT_LOCALE = (process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' ? 'en' : 'zh') as Locale
const translations = { en, zh }

interface TranslationParams {
  [key: string]: string | number
}

const I18nContext = createContext<{
  t: (key: string, params?: TranslationParams) => string
}>({
  t: (key: string, params?: TranslationParams) => key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const t = (key: string, params?: TranslationParams) => {
    const keys = key.split('.')
    let value: any = translations[DEFAULT_LOCALE]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (params && typeof value === 'string') {
      return Object.entries(params).reduce((str, [key, val]) => {
        return str.replace(new RegExp(`{${key}}`, 'g'), String(val))
      }, value)
    }
    
    return value || key
  }

  return (
    <I18nContext.Provider value={{ t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext) 
