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

import './globals.css'
import { I18nProvider } from '@/i18n/context'
import { Metadata } from 'next'
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
          href="https:
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