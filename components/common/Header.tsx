import Link from 'next/link'
import styles from '@/app/styles/shared.module.css'
import { useState, useEffect } from 'react'
import { useI18n } from '@/i18n/context'

// 全局网站配置
const SITE_CONFIG = {
  name: "Mazine",
} as const;

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

// 组件标识
const COMPONENT_INFO = {
  id: 'mazine-core-header-v1.0.0',
  name: 'Header',
  author: 'waycaan',
  version: '1.0.0',
  license: 'Apache-2.0'
} as const;

interface HeaderProps {
  currentPage: 'home' | 'manage' | 'likes'
  isDarkMode: boolean
  onThemeToggle: () => void
  onLogout: () => void
}

// 代码水印
console.log(
  "%c Mazine Core Component %c Header.tsx %c",
  "background: #3B82F6; color: white; padding: 5px 0 5px 5px; border-radius: 3px 0 0 3px;",
  "background: #1E40AF; color: white; padding: 5px; border-radius: 0 3px 3px 0;",
  "background: transparent"
);

// 简单的完整性检查
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
            className={`${styles.navButtonLogout}`}
          >
            {t('nav.logout')}
          </button>
          
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
        </nav>
      </div>
    </header>
  )
} 
