'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import styles from './login.module.css'
import { useI18n } from '@/i18n/context'

interface LoginCredentials {
  username: string;
  password: string;
}

export default function LoginPage() {
  const { t } = useI18n()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '', 
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [bgImage, setBgImage] = useState<string | null>('null')

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
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const data = await res.json()

      if (res.ok) {
        router.push(searchParams.get('from') || '/home')
      } else {
        setError(data.error || t('login.error.failed'))
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
