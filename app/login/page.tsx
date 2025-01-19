'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import styles from './login.module.css'
import { useI18n } from '@/i18n/context'

export default function LoginPage() {
  const { t } = useI18n()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [bgImage, setBgImage] = useState<string | null>('null')

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (res.ok) {
        router.push(searchParams.get('from') || '/home')
      } else {
        const data = await res.json()
        setError(data.message || t('login.error.failed'))
      }
    } catch (error) {
      setError(t('login.error.network'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className={`${styles.container} ${isDarkMode ? styles.containerDark : ''}`}
      style={bgImage !== 'null' ? { backgroundImage: `url(${bgImage})` } as React.CSSProperties : undefined}
    >
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
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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

          <button 
            className={styles.themeSwitch}
            onClick={() => setIsDarkMode(!isDarkMode)}
            type="button"
            aria-label={t('login.theme')}
          />
        </form>
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
