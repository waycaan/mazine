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

import Link from 'next/link'
import styles from '@/app/styles/shared.module.css'
import { useState, useEffect } from 'react'
import { useI18n } from '@/i18n/context'
const SITE_CONFIG = {
  name: "Mazine",
} as const;
const COMPONENT_INFO = {
  id: 'mazine-core-header-v1.0.0',
  name: 'Header',
  author: 'waycaan',
  version: '1.0.0',
  license: 'MIT'
} as const;
interface HeaderProps {
  currentPage: 'home' | 'manage' | 'likes'
  isDarkMode: boolean
  onThemeToggle: () => void
  onLogout: () => void
}
console.log(
  "%c Mazine Core Component %c Header.tsx %c",
  "background: #3B82F6; color: white; padding: 5px 0 5px 5px; border-radius: 3px 0 0 3px;",
  "background: #1E40AF; color: white; padding: 5px; border-radius: 0 3px 3px 0;",
  "background: transparent"
);
const verifyComponent = () => {
  return JSON.stringify(COMPONENT_INFO);
};
export function Header({ currentPage, isDarkMode, onThemeToggle, onLogout }: HeaderProps) {
  const [showTopButton, setShowTopButton] = useState(false)
  const { t } = useI18n()
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main')
      if (mainElement) {
        setShowTopButton(mainElement.scrollTop > 200)
      }
    }
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll)
      return () => mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [])
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('Component Integrity:', verifyComponent());
    }
  }, []);
  const scrollToTop = () => {
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <img
            src="/favicon.ico"
            width={32}
            height={32}
            alt="Mazine Logo"
            className={styles.logoImage}
          />
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Mazine</h1>
            <span className={styles.subtitle}>
              {process.env.NEXT_PUBLIC_LANGUAGE?.toLowerCase() === 'en'
                ? 'Where Amazing Meets Every spark'
                : '惊喜在每一丝灵感中相遇'}
            </span>
          </div>
        </div>
        <nav className={styles.nav}>
          <Link
            href="/home"
            className={`${styles.navButton} ${
              currentPage === 'home' ? styles.navButtonActive : ''
            }`}
          >
            {t('nav.upload')}
          </Link>
          <Link
            href="/manage"
            className={`${styles.navButton} ${
              currentPage === 'manage' ? styles.navButtonActive : ''
            }`}
          >
            {t('nav.manage')}
          </Link>
          <Link
            href="/likes"
            className={`${styles.navButton} ${
              currentPage === 'likes' ? styles.navButtonActive : ''
            }`}
          >
            {t('nav.favorites')}
          </Link>
          <button
            onClick={onLogout}
            className={`${styles.navButton} ${styles.navButtonLogout}`}
          >
            {t('nav.logout')}
          </button>
        </nav>
        <div className={styles.rightControls}>
          <button
            onClick={onThemeToggle}
            className={styles.themeSwitch}
            aria-label={t('nav.toggleTheme')}
          >
            <span />
          </button>
          <button
            className={`${styles.navButton} ${styles.topButton} ${showTopButton ? styles.visible : ''}`}
            onClick={scrollToTop}
            aria-label={t('nav.backToTop')}
          >
            <span className={styles.topArrow}></span>
          </button>
        </div>
      </div>
    </header>
  )
}