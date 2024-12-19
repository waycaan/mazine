'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { FormEvent, ChangeEvent } from 'react'

// 背景图片URL，修改此处可更换背景
const BG_URL = ''

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!password) {
      setError('请输入密码')
      return
    }

    setError('')
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      const data = await res.json()

      if (res.ok && data?.success) {
        router.push('/home')
        return
      } else {
        setError(data?.message || '密码错误')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('登录失败，请检查网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx>{`
        .container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${BG_URL ? `url(${BG_URL})` : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'};
          background-size: cover;
          background-position: center;
        }
        .card-wrapper {
          width: 100%;
          max-width: 24rem;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .card-container {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 1rem;
          overflow: hidden;
        }
        .card-backdrop {
          position: absolute;
          inset: 0;
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
          backdrop-filter: blur(8px);
        }
        .card {
          position: relative;
          z-index: 1;
          padding: 2rem;
          text-align: center;
        }
        .title {
          color: ${isDarkMode ? '#fff' : '#000'};
          font-size: 1.875rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: ${isDarkMode ? '#fff' : '#000'};
          font-size: 0.875rem;
          margin-bottom: 1rem;
          opacity: 0.8;
        }
        .theme-switch {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          background: ${isDarkMode ? '#374151' : '#E5E7EB'};
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 2rem;
          font-size: 1.25rem;
        }
        .theme-switch:hover {
          background: ${isDarkMode ? '#4B5563' : '#D1D5DB'};
        }
        .input {
          width: 100%;
          max-width: 16rem;
          height: 2.75rem;
          padding: 0 1rem;
          background: ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)'};
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 0.5rem;
          color: ${isDarkMode ? '#fff' : '#000'};
          margin: 0 auto 1rem;
        }
        .input::placeholder {
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
        }
        .input:focus {
          outline: none;
          border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
        }
        .form-group {
          width: 100%;
          max-width: 16rem;
          margin: 0 auto;
        }
        .error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 0.5rem;
          padding: 0.75rem;
          margin-bottom: 1rem;
          width: 100%;
        }
        .error-text {
          color: rgb(239, 68, 68);
          font-size: 0.875rem;
        }
        .button {
          width: 100%;
          height: 2.75rem;
          border-radius: 0.5rem;
          font-weight: 500;
          background: ${isDarkMode ? '#3B82F6' : '#fff'};
          color: ${isDarkMode ? '#fff' : '#2563EB'};
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .button:hover {
          opacity: 0.9;
        }
        .button:disabled {
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.3)'};
          cursor: not-allowed;
        }
        .footer {
          text-align: center;
          color: ${isDarkMode ? '#fff' : '#000'};
          font-size: 0.875rem;
          margin-top: 2rem;
          opacity: 0.8;
        }
      `}</style>

      <div className="container">
        <div className="card-wrapper">
          <div className="card-container">
            <div className="card-backdrop"></div>
            <div className="card">
              <Image
                src="/favicon.ico"
                alt="Logo"
                width={64}
                height={64}
                className="mx-auto mb-4"
              />
              <h1 className="title">图床服务</h1>
              <p className="subtitle">安全可靠的图片存储与分享服务</p>

              <button 
                className="theme-switch"
                onClick={() => setIsDarkMode(!isDarkMode)}
                type="button"
                aria-label="切换主题"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="请输入访问密码"
                    required
                    className="input"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />

                  {error && (
                    <div className="error">
                      <p className="error-text">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="button"
                  >
                    {isLoading ? '登录中...' : '登录'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="footer">
            © 2024 图床服务. All rights reserved.
          </div>
        </div>
      </div>
    </>
  )
} 
