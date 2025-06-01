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

'use client'
import { useState, ChangeEvent, FormEvent, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import styles from './login.module.css'
import { useI18n } from '@/i18n/context'
import { AuthClient } from '@/utils/auth-client'
import { getStoredTheme, setStoredTheme } from '@/utils/theme'
interface LoginCredentials {
  username: string;
  password: string;
}
function LoginForm() {
  const { t } = useI18n()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
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
      document.cookie = `theme=${newTheme ? 'dark' : 'light'}; path=/; max-age=31536000` 
      return newTheme
    })
  }
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
  }
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await AuthClient.login(credentials.username, credentials.password)
      if (result.success) {
        const targetPage = searchParams.get('from') || '/home'
        console.log('🎯 登录成功，强制跳转到:', targetPage)
        window.location.href = targetPage
      } else {
        const errorMessage = result.error || t('login.error.failed')
        setError(errorMessage)
        setTimeout(() => {
          setError('')
        }, 2000)
      }
    } catch (error) {
      console.error('登录错误:', error)
      const errorMessage = t('login.error.network')
      setError(errorMessage)
      setTimeout(() => {
        setError('')
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className={`${styles.container} ${isDarkMode ? styles.containerDark : ''}`}>
      <div className={styles.card}>
        <Image
          src="/favicon.ico"
          alt="Logo"
          width={64}
          height={64}
        />
        <h1 className={styles.title}>{t('login.title')}</h1>
        <p className={styles.subtitle}>{t('login.subtitle')}</p>
        <form className={styles.loginForm} onSubmit={handleLogin}>
          <input
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleInputChange}
            placeholder={t('login.username')}
            required
            className={styles.input}
            disabled={isLoading}
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleInputChange}
            placeholder={t('login.password')}
            required
            className={styles.input}
            disabled={isLoading}
            autoComplete="current-password"
          />
          {error && (
            <div className={styles.error}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? t('login.button.loading') : t('login.button.login')}
          </button>
        </form>
        <button
          className={styles.themeSwitch}
          onClick={toggleTheme}
          type="button"
          aria-label={t('login.theme')}
        />
      </div>
      <footer className={styles.footer}>
        <p>{t('login.copyright', { year: new Date().getFullYear() })}{' '}
          <a
            href="https://github.com/waycaan/mazine"
            target="_blank"
            rel="noopener noreferrer"
          >
            waycaan
          </a>
        </p>
      </footer>
    </div>
  )
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}