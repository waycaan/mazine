import './globals.css'
import { I18nProvider } from '@/i18n/context'
import { Metadata } from 'next'

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

const LAYOUT_INFO = {
  id: 'mazine-layout-root-v1.0.0',
  name: 'RootLayout',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' 
    ? 'Mazine | Where Amazing Meets Every spark!'
    : 'Mazine | 惊喜在每一丝灵感中相遇!',
  description: process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' 
    ? 'Mazine, Where Amazing Meets Every spark!'
    : '美真，惊喜在每一丝灵感中相遇!'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en' ? 'en' : 'zh'}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon"/>
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
      </head>
      <body className="font-sans min-h-screen m-0 p-0">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
